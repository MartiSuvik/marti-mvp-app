-- Migration: Direct Charges Model
-- Removes escrow-related job statuses and adds direct payment tracking to milestones
-- Date: 2025-01-XX

-- ============================================================================
-- 1. Add Stripe payment tracking columns to milestones table
-- ============================================================================
-- These track the direct charge made to the agency's connected account
ALTER TABLE milestones 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Comment the new columns
COMMENT ON COLUMN milestones.stripe_payment_intent_id IS 'PaymentIntent ID from direct charge to agency';
COMMENT ON COLUMN milestones.stripe_charge_id IS 'Charge ID from direct charge to agency';
COMMENT ON COLUMN milestones.stripe_checkout_session_id IS 'Checkout Session ID for milestone payment';

-- ============================================================================
-- 2. Update jobs table status constraint
-- ============================================================================
-- Remove unfunded, funded, refunded statuses - payments now happen at approval time

-- First, migrate any existing jobs with deprecated statuses
UPDATE jobs SET status = 'pending' WHERE status = 'unfunded';
UPDATE jobs SET status = 'in_progress' WHERE status = 'funded';
UPDATE jobs SET status = 'cancelled' WHERE status = 'refunded';

-- Drop existing constraint and recreate with new values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN (
  'draft',
  'pending',
  'declined',
  'in_progress',
  'review',
  'revision',
  'approved',
  'paid_out',
  'cancelled'
));

-- ============================================================================
-- 3. Add direct payment tracking to jobs table
-- ============================================================================
-- For non-milestone jobs, track the direct charge payment
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

COMMENT ON COLUMN jobs.stripe_payment_intent_id IS 'PaymentIntent ID for direct job payment (no milestones)';
COMMENT ON COLUMN jobs.stripe_charge_id IS 'Charge ID for direct job payment (no milestones)';

-- ============================================================================
-- 4. Create index for efficient lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_milestones_payment_intent ON milestones(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_milestones_checkout_session ON milestones(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_payment_intent ON jobs(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- 5. Update job_payments table to track connected account
-- ============================================================================
ALTER TABLE job_payments 
  ADD COLUMN IF NOT EXISTS connected_account_id TEXT,
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

COMMENT ON COLUMN job_payments.connected_account_id IS 'Agency Stripe connected account that received the payment';
COMMENT ON COLUMN job_payments.milestone_id IS 'Optional: specific milestone this payment is for';

-- ============================================================================
-- 6. Deprecate job_payouts table (no longer needed with direct charges)
-- ============================================================================
-- We keep the table for historical data but add a deprecation notice
COMMENT ON TABLE job_payouts IS 'DEPRECATED: No longer used with direct charges model. Historical data only.';

-- ============================================================================
-- 7. Add RLS policies for new columns
-- ============================================================================
-- No additional RLS needed - existing policies on milestones and jobs tables apply

-- ============================================================================
-- 8. Refresh schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
