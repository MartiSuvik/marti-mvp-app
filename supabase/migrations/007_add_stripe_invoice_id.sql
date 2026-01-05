-- Migration: Add stripe_invoice_id to jobs table
-- Run this in Supabase SQL Editor

-- Add stripe_invoice_id column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_stripe_invoice_id ON jobs(stripe_invoice_id);

-- Comment for documentation
COMMENT ON COLUMN jobs.stripe_invoice_id IS 'Stripe Invoice ID for this job payment';
