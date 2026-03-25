-- ============================================================
-- ÍNDICES COMPUESTOS: Optimización de queries frecuentes
-- Proyecto: PedidosPosta (Multi-tenant SaaS)
-- Fecha: 2026-03-25
--
-- INSTRUCCIONES:
-- Ejecutar en el SQL Editor de Supabase.
-- Todos usan IF NOT EXISTS para ser idempotentes.
-- En producción con tráfico, usar CONCURRENTLY (requiere
-- ejecutar fuera de una transacción en psql directo).
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. ORDERS: Dashboard del Manager
--    Query: WHERE tenant_id = X AND status IN (...) ORDER BY created_at DESC
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_created
ON public.orders (tenant_id, status, created_at DESC);

-- Webhook MP y tracking: WHERE id = X AND tenant_id = Y
-- (PK cubre id, este índice cubre el combo)
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id
ON public.orders (id, tenant_id);

-- Slot capacity check (checkout RPC):
-- WHERE tenant_id = X AND created_at::date = TODAY AND status != 'cancelled'
CREATE INDEX IF NOT EXISTS idx_orders_tenant_date
ON public.orders (tenant_id, created_at DESC)
WHERE status != 'cancelled';


-- ══════════════════════════════════════════════════════════════
-- 2. PRODUCTS: Storefront público
--    Query: WHERE tenant_id = X AND is_available = true ORDER BY sort_order ASC
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_products_tenant_available_sort
ON public.products (tenant_id, sort_order ASC)
WHERE is_available = true;

-- Manager menu: WHERE tenant_id = X ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_products_tenant_sort
ON public.products (tenant_id, sort_order ASC);


-- ══════════════════════════════════════════════════════════════
-- 3. CATEGORIES: Storefront y Manager
--    Query: WHERE tenant_id = X ORDER BY sort_order ASC
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_categories_tenant_sort
ON public.categories (tenant_id, sort_order ASC);


-- ══════════════════════════════════════════════════════════════
-- 4. MODIFIERS / OPTIONS: Storefront y Manager menu
--    Query: WHERE tenant_id = X
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_modifiers_tenant
ON public.modifiers (tenant_id);

CREATE INDEX IF NOT EXISTS idx_modifier_options_modifier
ON public.modifier_options (modifier_id);


-- ══════════════════════════════════════════════════════════════
-- 5. TENANT LOOKUP: Storefront, checkout, y todas las rutas
--    Query: WHERE slug = X (se ejecuta en cada page load)
-- ══════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug
ON public.tenants (slug);


-- ══════════════════════════════════════════════════════════════
-- 6. TENANT_USERS: Auth y RLS policies
--    Usado en CADA policy RLS como subquery
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tenant_users_user
ON public.tenant_users (user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant
ON public.tenant_users (tenant_id, user_id);
