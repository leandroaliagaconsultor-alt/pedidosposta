-- ============================================================
-- CHECKOUT RPC v2: Validación de precios server-side
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- REEMPLAZA la función process_checkout existente
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_checkout(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_tenant_id UUID;
    v_max_orders INT;
    v_schedule JSONB;
    v_slot_time TEXT;
    v_is_asap BOOLEAN;
    v_slot_count INT;
    v_item JSONB;
    v_real_price NUMERIC;
    v_real_total NUMERIC := 0;
    v_product_tenant UUID;
BEGIN
    -- ── 1. Extraer datos del payload ──
    v_tenant_id   := (payload->>'tenant_id')::UUID;
    v_is_asap     := COALESCE((payload->>'is_asap')::BOOLEAN, true);
    v_slot_time   := payload->>'scheduled_slot';

    -- ── 2. Validar que el tenant existe ──
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
        RAISE EXCEPTION 'TENANT_NOT_FOUND: El local no existe.';
    END IF;

    -- ── 3. Validar precios y ownership de productos ──
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        SELECT price, tenant_id INTO v_real_price, v_product_tenant
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID
          AND is_available = true;

        IF v_real_price IS NULL THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Uno de los productos no existe o no esta disponible.';
        END IF;

        IF v_product_tenant != v_tenant_id THEN
            RAISE EXCEPTION 'PRODUCT_MISMATCH: Un producto no pertenece a este local.';
        END IF;

        -- Acumular total real basado en precios de la DB
        v_real_total := v_real_total + (v_real_price * (v_item->>'quantity')::INT);
    END LOOP;

    -- ── 4. Validar capacidad del time slot (race-condition safe) ──
    SELECT schedule, COALESCE(max_orders_per_slot, 10)
    INTO v_schedule, v_max_orders
    FROM public.tenants
    WHERE id = v_tenant_id
    FOR UPDATE;

    IF v_slot_time IS NOT NULL AND v_slot_time != '' THEN
        SELECT COUNT(*)
        INTO v_slot_count
        FROM public.orders
        WHERE tenant_id = v_tenant_id
          AND created_at::date = CURRENT_DATE
          AND (
              (scheduled_time IS NOT NULL AND to_char(scheduled_time AT TIME ZONE 'America/Argentina/Buenos_Aires', 'HH24:MI') = v_slot_time)
          )
          AND status NOT IN ('cancelled');

        IF v_slot_count >= v_max_orders THEN
            RAISE EXCEPTION 'SLOT_FULL: El horario % ya no tiene disponibilidad. Elegi otro.', v_slot_time;
        END IF;
    END IF;

    IF v_is_asap THEN
        DECLARE
            v_asap_slot TEXT;
        BEGIN
            v_asap_slot := to_char(
                (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires') + INTERVAL '30 minutes',
                'HH24:MI'
            );

            SELECT COUNT(*)
            INTO v_slot_count
            FROM public.orders
            WHERE tenant_id = v_tenant_id
              AND created_at::date = CURRENT_DATE
              AND is_asap = true
              AND created_at >= (NOW() - INTERVAL '30 minutes')
              AND status NOT IN ('cancelled');

            IF v_slot_count >= v_max_orders THEN
                RAISE EXCEPTION 'SLOT_FULL: Hay demasiados pedidos en este momento. Intenta de nuevo en unos minutos.';
            END IF;
        END;
    END IF;

    -- ── 5. Insertar la orden con el total REAL calculado server-side ──
    INSERT INTO public.orders (
        tenant_id,
        customer_name,
        first_name,
        last_name,
        customer_phone,
        customer_address,
        delivery_notes,
        delivery_method,
        payment_method,
        is_asap,
        scheduled_time,
        total_amount,
        status,
        receipt_url
    ) VALUES (
        v_tenant_id,
        payload->>'customer_name',
        payload->>'first_name',
        payload->>'last_name',
        payload->>'customer_phone',
        payload->>'customer_address',
        payload->>'delivery_notes',
        payload->>'delivery_method',
        payload->>'payment_method',
        v_is_asap,
        CASE
            WHEN payload->>'scheduled_time' IS NOT NULL AND payload->>'scheduled_time' != ''
            THEN (payload->>'scheduled_time')::TIMESTAMPTZ
            ELSE NULL
        END,
        -- Usar total real + delivery fee del payload (delivery fee viene del server config)
        v_real_total + COALESCE((payload->>'delivery_fee')::NUMERIC, 0),
        payload->>'status',
        payload->>'receipt_url'
    )
    RETURNING id INTO v_order_id;

    -- ── 6. Insertar los items con precios REALES de la DB ──
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        SELECT price INTO v_real_price
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            notes
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INT,
            v_real_price,
            v_real_price * (v_item->>'quantity')::INT,
            v_item->>'notes'
        );
    END LOOP;

    -- ── 7. Éxito ──
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'success', true,
        'verified_total', v_real_total
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB) TO authenticated;
