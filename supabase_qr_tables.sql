-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: QR para mesas (Dine-in)
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Agregar campo mesa/table a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number TEXT;

-- Agregar delivery_method "DINE_IN" como opción válida
-- (No hay constraint, es un VARCHAR libre)

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
