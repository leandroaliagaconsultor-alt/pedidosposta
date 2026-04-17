-- Add address column to tenants for directory listings
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
