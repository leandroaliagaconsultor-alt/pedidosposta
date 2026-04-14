-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Tabla de ciudades del directorio
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS directory_cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,               -- "Mercedes" (display)
    slug TEXT UNIQUE NOT NULL,         -- "mercedes" (URL)
    is_active BOOLEAN DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Insertar Mercedes como ciudad inicial
INSERT INTO directory_cities (name, slug) VALUES ('Mercedes', 'mercedes')
ON CONFLICT (slug) DO NOTHING;

-- RLS: lectura pública, escritura solo autenticados
ALTER TABLE directory_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_cities" ON directory_cities
    FOR SELECT USING (true);

CREATE POLICY "auth_manage_cities" ON directory_cities
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
