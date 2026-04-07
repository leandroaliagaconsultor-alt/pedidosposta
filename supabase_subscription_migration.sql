-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Trial & Subscription fields for SaaS model
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add subscription columns to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 2. Set existing tenants to 'active' (grandfather them in) so they don't get blocked
UPDATE tenants
SET subscription_status = 'active'
WHERE subscription_status = 'trialing'
  AND trial_ends_at IS NULL;

-- 3. Add a CHECK constraint for valid statuses
ALTER TABLE tenants
  ADD CONSTRAINT tenants_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled'));

-- 4. Index for quick lookups of expired trials
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status
  ON tenants (subscription_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. New tenants created via register will get:
--   subscription_status = 'trialing'
--   trial_ends_at = now() + interval '10 days'
-- ═══════════════════════════════════════════════════════════════════════════════
