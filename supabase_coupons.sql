-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Sistema de Cupones/Descuentos
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,                      -- "PRIMERAVEZ", "VERANO20"
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
    discount_value NUMERIC NOT NULL,         -- 10 (%) or 500 ($)
    min_order NUMERIC DEFAULT 0,             -- monto mínimo para aplicar
    max_uses INTEGER,                        -- null = ilimitado
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,                  -- null = sin vencimiento
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_tenant_code ON coupons (tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons (tenant_id);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el checkout necesita validar cupones)
CREATE POLICY "public_read_coupons" ON coupons
    FOR SELECT USING (true);

-- Solo el dueño puede crear/editar/borrar
CREATE POLICY "owner_manage_coupons" ON coupons
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- Agregar campo coupon_code a orders para registrar qué cupón se usó
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
