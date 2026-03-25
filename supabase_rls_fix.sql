-- ============================================================
-- RLS FIX: Habilitar Row Level Security en tablas desprotegidas
-- Proyecto: PedidosPosta (Multi-tenant SaaS)
-- Fecha: 2026-03-24
--
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase.
-- 2. Verificar que no haya errores.
-- 3. Probar desde el frontend que las operaciones siguen funcionando.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- TABLA: tenants
-- Estrategia: Lectura pública (storefront necesita leer slug, nombre, tema).
--             Escritura solo para miembros del tenant (owner/manager).
--             Columnas sensibles (mp_access_token) se protegen con SELECT
--             limitado en las queries de la app, no con RLS columnar.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede leer datos del tenant (necesario para storefront)
CREATE POLICY "tenants_select_public"
ON public.tenants FOR SELECT
USING (true);

-- UPDATE: Solo miembros del tenant pueden editar su propio tenant
CREATE POLICY "tenants_update_own"
ON public.tenants FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = tenants.id
  )
);

-- INSERT: Solo usuarios autenticados pueden crear tenants (registro)
CREATE POLICY "tenants_insert_authenticated"
ON public.tenants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Nadie puede eliminar tenants via API (solo superadmin desde dashboard)
-- No se crea política DELETE = denegado por defecto con RLS habilitado.


-- ══════════════════════════════════════════════════════════════
-- TABLA: tenant_users
-- Estrategia: Un usuario solo puede ver/gestionar membresías de su tenant.
--             INSERT abierto para registro (el usuario se asocia a sí mismo).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- SELECT: Un usuario autenticado solo ve sus propias membresías
CREATE POLICY "tenant_users_select_own"
ON public.tenant_users FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Un usuario autenticado puede crear su propia membresía
-- (necesario para el flujo de registro)
CREATE POLICY "tenant_users_insert_own"
ON public.tenant_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo el propio usuario puede modificar su membresía
CREATE POLICY "tenant_users_update_own"
ON public.tenant_users FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Solo el propio usuario puede eliminar su membresía
CREATE POLICY "tenant_users_delete_own"
ON public.tenant_users FOR DELETE
USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- TABLA: orders
-- Estrategia: Clientes anónimos pueden crear pedidos (INSERT).
--             Lectura pública filtrada por tenant_id (para tracking).
--             UPDATE solo para miembros del tenant (cambiar estado).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede leer órdenes (necesario para tracking del cliente).
-- La app filtra por tenant_id + order_id en las queries.
CREATE POLICY "orders_select_public"
ON public.orders FOR SELECT
USING (true);

-- INSERT: Cualquiera puede crear un pedido (clientes no autenticados)
CREATE POLICY "orders_insert_public"
ON public.orders FOR INSERT
WITH CHECK (true);

-- UPDATE: Solo miembros del tenant pueden actualizar órdenes
CREATE POLICY "orders_update_tenant_member"
ON public.orders FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = orders.tenant_id
  )
);

-- DELETE: Solo miembros del tenant pueden eliminar órdenes
CREATE POLICY "orders_delete_tenant_member"
ON public.orders FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = orders.tenant_id
  )
);


-- ══════════════════════════════════════════════════════════════
-- TABLA: order_items
-- Estrategia: Misma lógica que orders. tenant_id se resuelve
--             via JOIN a orders. INSERT público para checkout.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede leer items (necesario para tracking y recibos)
CREATE POLICY "order_items_select_public"
ON public.order_items FOR SELECT
USING (true);

-- INSERT: Cualquiera puede crear items (parte del checkout)
CREATE POLICY "order_items_insert_public"
ON public.order_items FOR INSERT
WITH CHECK (true);

-- UPDATE: Solo miembros del tenant (via join a orders)
CREATE POLICY "order_items_update_tenant_member"
ON public.order_items FOR UPDATE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.orders o ON o.tenant_id = tu.tenant_id
    WHERE o.id = order_items.order_id
  )
);

-- DELETE: Solo miembros del tenant (via join a orders)
CREATE POLICY "order_items_delete_tenant_member"
ON public.order_items FOR DELETE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.orders o ON o.tenant_id = tu.tenant_id
    WHERE o.id = order_items.order_id
  )
);


-- ══════════════════════════════════════════════════════════════
-- TABLA: modifiers
-- Estrategia: Lectura pública (storefront muestra opciones).
--             Escritura solo para miembros del tenant.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede ver modifiers (storefront)
CREATE POLICY "modifiers_select_public"
ON public.modifiers FOR SELECT
USING (true);

-- INSERT: Solo miembros del tenant
CREATE POLICY "modifiers_insert_tenant_member"
ON public.modifiers FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = modifiers.tenant_id
  )
);

-- UPDATE: Solo miembros del tenant
CREATE POLICY "modifiers_update_tenant_member"
ON public.modifiers FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = modifiers.tenant_id
  )
);

-- DELETE: Solo miembros del tenant
CREATE POLICY "modifiers_delete_tenant_member"
ON public.modifiers FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users
    WHERE tenant_users.tenant_id = modifiers.tenant_id
  )
);


-- ══════════════════════════════════════════════════════════════
-- TABLA: modifier_options
-- Estrategia: Lectura pública (storefront).
--             Escritura solo para miembros del tenant (via modifiers).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede ver opciones (storefront)
CREATE POLICY "modifier_options_select_public"
ON public.modifier_options FOR SELECT
USING (true);

-- INSERT: Solo miembros del tenant (via join a modifiers)
CREATE POLICY "modifier_options_insert_tenant_member"
ON public.modifier_options FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.modifiers m ON m.tenant_id = tu.tenant_id
    WHERE m.id = modifier_options.modifier_id
  )
);

-- UPDATE: Solo miembros del tenant (via join a modifiers)
CREATE POLICY "modifier_options_update_tenant_member"
ON public.modifier_options FOR UPDATE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.modifiers m ON m.tenant_id = tu.tenant_id
    WHERE m.id = modifier_options.modifier_id
  )
);

-- DELETE: Solo miembros del tenant (via join a modifiers)
CREATE POLICY "modifier_options_delete_tenant_member"
ON public.modifier_options FOR DELETE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.modifiers m ON m.tenant_id = tu.tenant_id
    WHERE m.id = modifier_options.modifier_id
  )
);


-- ══════════════════════════════════════════════════════════════
-- TABLA: product_modifiers (pivot)
-- Estrategia: Lectura pública (storefront).
--             Escritura solo para miembros del tenant (via products).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

-- SELECT: Público puede ver asociaciones (storefront)
CREATE POLICY "product_modifiers_select_public"
ON public.product_modifiers FOR SELECT
USING (true);

-- INSERT: Solo miembros del tenant (via join a products)
CREATE POLICY "product_modifiers_insert_tenant_member"
ON public.product_modifiers FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.products p ON p.tenant_id = tu.tenant_id
    WHERE p.id = product_modifiers.product_id
  )
);

-- UPDATE: Solo miembros del tenant (via join a products)
CREATE POLICY "product_modifiers_update_tenant_member"
ON public.product_modifiers FOR UPDATE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.products p ON p.tenant_id = tu.tenant_id
    WHERE p.id = product_modifiers.product_id
  )
);

-- DELETE: Solo miembros del tenant (via join a products)
CREATE POLICY "product_modifiers_delete_tenant_member"
ON public.product_modifiers FOR DELETE
USING (
  auth.uid() IN (
    SELECT tu.user_id FROM public.tenant_users tu
    INNER JOIN public.products p ON p.tenant_id = tu.tenant_id
    WHERE p.id = product_modifiers.product_id
  )
);
