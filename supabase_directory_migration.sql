-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Directorio Gastronómico — nuevos campos en tenants
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Tipo de tenant: 'saas' (cliente pago) o 'directory' (listado gratis)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'saas';

-- Categoría del local (para filtros del directorio)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'otros';

-- Descripción corta para el directorio
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;

-- Ciudad del local (para ruta /directorio/[city])
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'mercedes';

-- URL externa (WhatsApp, Instagram, web) para locales de directorio
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Activo/Inactivo en el directorio (independiente de is_suspended)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_directory_active BOOLEAN DEFAULT true;

-- Horarios de apertura para el directorio (JSON: {monday: [{start, end}], ...})
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Banner/foto del local para el directorio
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Índices para consultas rápidas del directorio
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants (type);
CREATE INDEX IF NOT EXISTS idx_tenants_city ON tenants (city);
CREATE INDEX IF NOT EXISTS idx_tenants_category ON tenants (category);
CREATE INDEX IF NOT EXISTS idx_tenants_directory_active ON tenants (is_directory_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Tabla de tracking de clics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS directory_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    clicked_at timestamptz DEFAULT now(),
    source TEXT DEFAULT 'directory'
);

CREATE INDEX IF NOT EXISTS idx_directory_clicks_tenant_id ON directory_clicks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_directory_clicks_date ON directory_clicks (clicked_at);

-- RLS: permitir inserts anónimos (los clics vienen de usuarios no logueados)
ALTER TABLE directory_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_clicks" ON directory_clicks
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "admin_read_clicks" ON directory_clicks
    FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Ejecutá esto en Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════════
