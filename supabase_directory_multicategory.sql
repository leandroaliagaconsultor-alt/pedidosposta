-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Multi-categoría — category TEXT → categories TEXT[]
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Agregar nueva columna de array
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- 2. Migrar datos existentes de category (single) a categories (array)
UPDATE tenants
SET categories = ARRAY[category]
WHERE category IS NOT NULL AND category != '' AND (categories IS NULL OR categories = '{}');

-- 3. Crear índice GIN para buscar dentro del array eficientemente
CREATE INDEX IF NOT EXISTS idx_tenants_categories ON tenants USING GIN (categories);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTA: Mantenemos la columna 'category' (TEXT) por compatibilidad.
-- El código nuevo usa 'categories' (TEXT[]). Eventualmente eliminar 'category'.
-- ═══════════════════════════════════════════════════════════════════════════════
