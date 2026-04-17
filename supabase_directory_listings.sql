-- ============================================================
-- Tabla separada para locales de directorio (no SaaS)
-- ============================================================

CREATE TABLE IF NOT EXISTS directory_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    categories TEXT[],
    city TEXT NOT NULL DEFAULT 'mercedes',
    address TEXT,
    logo_url TEXT,
    external_url TEXT,
    opening_hours JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_directory_listings_city ON directory_listings(city);
CREATE INDEX IF NOT EXISTS idx_directory_listings_active ON directory_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_directory_listings_categories ON directory_listings USING GIN(categories);

-- RLS
ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active listings"
    ON directory_listings FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated can manage listings"
    ON directory_listings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Migrar datos existentes de tenants tipo directory
-- ============================================================
INSERT INTO directory_listings (name, description, categories, city, address, logo_url, external_url, opening_hours, is_active)
SELECT name, description, categories, city, address, logo_url, external_url, opening_hours, COALESCE(is_directory_active, true)
FROM tenants
WHERE type = 'directory'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Actualizar directory_clicks para soportar listing_id
-- ============================================================
ALTER TABLE directory_clicks ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES directory_listings(id);
-- Hacer tenant_id nullable (clicks pueden venir de listings)
ALTER TABLE directory_clicks ALTER COLUMN tenant_id DROP NOT NULL;

-- ============================================================
-- Después de verificar que la migración fue correcta,
-- podés limpiar los tenants de directorio con:
-- DELETE FROM tenants WHERE type = 'directory';
-- (NO ejecutar automáticamente, verificar primero)
-- ============================================================
