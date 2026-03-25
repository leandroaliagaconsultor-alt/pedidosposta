-- ============================================================
-- MIGRACIÓN: Agregar store_lat / store_lng a tenants
-- Proyecto: PedidosPosta (Multi-tenant SaaS)
-- Fecha: 2026-03-25
--
-- Ejecutar en el SQL Editor de Supabase.
-- Estas columnas cachean las coordenadas de la dirección
-- del local para evitar geocodificar en cada checkout.
-- ============================================================

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS store_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS store_lng DOUBLE PRECISION;

COMMENT ON COLUMN public.tenants.store_lat IS 'Latitud cacheada de store_address — evita geocodificar en cada checkout';
COMMENT ON COLUMN public.tenants.store_lng IS 'Longitud cacheada de store_address — evita geocodificar en cada checkout';
