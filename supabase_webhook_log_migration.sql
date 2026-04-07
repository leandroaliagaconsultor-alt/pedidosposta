-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Webhook log table for idempotency
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mp_webhook_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id text UNIQUE NOT NULL,
    action text,
    type text,
    data_id text,
    payload jsonb,
    processed boolean DEFAULT false,
    processing_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mp_webhook_log_notification_id
    ON mp_webhook_log (notification_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE.
-- ═══════════════════════════════════════════════════════════════════════════════
