-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Subscription billing fields (MP Preapproval)
-- Run this in Supabase SQL Editor AFTER supabase_subscription_migration.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add billing-related columns
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS mp_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

-- mp_subscription_id: The preapproval ID from MercadoPago (for tracking/cancellation)
-- subscription_ends_at: When the current paid period expires (rolled forward +30 days on each payment)

-- 2. Index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_tenants_mp_subscription_id
  ON tenants (mp_subscription_id)
  WHERE mp_subscription_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
