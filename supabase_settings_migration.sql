-- ============================================================
-- MIGRACIÓN: Columnas faltantes en la tabla "tenants"
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- Es seguro ejecutar múltiples veces (usa IF NOT EXISTS)
-- ============================================================

-- ── Delivery avanzado ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_pricing_type TEXT DEFAULT 'fixed';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC DEFAULT 5;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fixed_delivery_price NUMERIC DEFAULT 1500;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS base_delivery_price NUMERIC DEFAULT 1500;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS base_delivery_km NUMERIC DEFAULT 2;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS extra_price_per_km NUMERIC DEFAULT 500;

-- ── Coordenadas del local (cache para cálculo de distancia) ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_lat DOUBLE PRECISION;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_lng DOUBLE PRECISION;

-- ── Estado y horarios ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS override_status TEXT DEFAULT 'none';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS schedule JSONB;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_orders_per_slot INTEGER DEFAULT 10;

-- ── MercadoPago ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_mp_active BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mp_public_key TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS transfer_alias TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS transfer_account_name TEXT;

-- ── Marketing y contacto ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS public_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS announcement_text TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS show_whatsapp_checkout BOOLEAN DEFAULT false;

-- ── Comandas ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enable_kitchen_tickets BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enable_delivery_tickets BOOLEAN DEFAULT false;

-- ── Dominio propio ──
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- ── Verificación ──
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;
