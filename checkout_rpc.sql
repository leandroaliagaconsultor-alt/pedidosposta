-- ============================================================
-- CHECKOUT RPC: Transacción atómica para creación de pedidos
-- Proyecto: PedidosPosta (Multi-tenant SaaS)
-- Fecha: 2026-03-25
--
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase.
-- 2. Probar el checkout completo desde el frontend.
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
BEGIN
    -- ── 1. Extraer datos del payload ──
    v_tenant_id   := (payload->>'tenant_id')::UUID;
    v_is_asap     := COALESCE((payload->>'is_asap')::BOOLEAN, true);
    v_slot_time   := payload->>'scheduled_slot';  -- formato "HH:MM" o null si ASAP

    -- ── 2. Validar que el tenant existe ──
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
        RAISE EXCEPTION 'TENANT_NOT_FOUND: El local no existe.';
    END IF;

    -- ── 3. Validar capacidad del time slot (race-condition safe) ──
    -- Usamos SELECT ... FOR UPDATE sobre el tenant para serializar
    -- checkouts concurrentes del mismo restaurante.
    SELECT schedule, COALESCE(max_orders_per_slot, 10)
    INTO v_schedule, v_max_orders
    FROM public.tenants
    WHERE id = v_tenant_id
    FOR UPDATE;

    -- Si hay un slot programado (no ASAP), verificar capacidad
    IF v_slot_time IS NOT NULL AND v_slot_time != '' THEN
        SELECT COUNT(*)
        INTO v_slot_count
        FROM public.orders
        WHERE tenant_id = v_tenant_id
          AND created_at::date = CURRENT_DATE
          AND (
              -- Órdenes programadas en el mismo slot
              (scheduled_time IS NOT NULL AND to_char(scheduled_time AT TIME ZONE 'America/Argentina/Buenos_Aires', 'HH24:MI') = v_slot_time)
          )
          AND status NOT IN ('cancelled');

        IF v_slot_count >= v_max_orders THEN
            RAISE EXCEPTION 'SLOT_FULL: El horario % ya no tiene disponibilidad. Elegí otro.', v_slot_time;
        END IF;
    END IF;

    -- Si es ASAP, verificamos el bloque más cercano (30 min desde ahora)
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
                RAISE EXCEPTION 'SLOT_FULL: Hay demasiados pedidos en este momento. Intentá de nuevo en unos minutos.';
            END IF;
        END;
    END IF;

    -- ── 4. Insertar la orden ──
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
        (payload->>'total_amount')::NUMERIC,
        payload->>'status',
        payload->>'receipt_url'
    )
    RETURNING id INTO v_order_id;

    -- ── 5. Insertar los items ──
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
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
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC,
            v_item->>'notes'
        );
    END LOOP;

    -- ── 6. Éxito: devolver el UUID de la orden ──
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'success', true
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Cualquier error hace ROLLBACK automático (PL/pgSQL)
        -- Re-lanzamos con el mensaje original para que el frontend lo capture
        RAISE;
END;
$$;

-- Permitir que usuarios anónimos y autenticados llamen a esta función
GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(JSONB) TO authenticated;
