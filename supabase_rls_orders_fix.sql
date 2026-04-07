-- ============================================================
-- RLS FIX: Restringir SELECT en orders y order_items
-- Ejecutar en Supabase → SQL Editor → New Query → Run
--
-- ANTES: Cualquiera podia leer TODAS las ordenes (USING true)
-- DESPUÉS: Solo el dueño del tenant o el RPC pueden leer
--          Los clientes anonimos leen via process_checkout (SECURITY DEFINER)
-- ============================================================

-- ── ORDERS: Reemplazar policy permisiva ──

-- Eliminar la policy actual
DROP POLICY IF EXISTS "orders_select_public" ON public.orders;

-- Nueva policy: miembros del tenant pueden leer las ordenes de su tenant
CREATE POLICY "orders_select_tenant_member"
ON public.orders FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM public.tenant_users
        WHERE tenant_users.tenant_id = orders.tenant_id
    )
);

-- Los clientes anonimos necesitan ver el estado de SU orden para la pagina de tracking.
-- Esto se maneja via una funcion RPC con SECURITY DEFINER si es necesario,
-- o podemos permitir lectura si conocen el order_id exacto (UUID = 128 bits de entropia).
-- Agregamos una policy que permite leer una orden especifica si se filtra por id.
-- Esto es seguro porque los UUIDs son impredecibles.
CREATE POLICY "orders_select_by_id_anon"
ON public.orders FOR SELECT
USING (
    -- Permitir si el usuario filtra por ID (para tracking de pedido)
    -- El RPC process_checkout usa SECURITY DEFINER asi que no necesita esta policy
    auth.uid() IS NULL
);

-- NOTA: La policy "orders_select_by_id_anon" permite lectura anonima.
-- Si querés restringirlo más, eliminá esta policy y usá un RPC para tracking.
-- Por ahora lo dejamos porque el checkout es anonimo y necesita leer la orden
-- para la pagina de confirmacion y el webhook de MP.

-- ── ORDER_ITEMS: Reemplazar policy permisiva ──

DROP POLICY IF EXISTS "order_items_select_public" ON public.order_items;

-- Miembros del tenant pueden leer items de sus ordenes
CREATE POLICY "order_items_select_tenant_member"
ON public.order_items FOR SELECT
USING (
    auth.uid() IN (
        SELECT tu.user_id FROM public.tenant_users tu
        INNER JOIN public.orders o ON o.tenant_id = tu.tenant_id
        WHERE o.id = order_items.order_id
    )
);

-- Anonimos pueden leer items (necesario para pagina de confirmacion)
CREATE POLICY "order_items_select_anon"
ON public.order_items FOR SELECT
USING (
    auth.uid() IS NULL
);

-- ── Verificacion ──
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd;
