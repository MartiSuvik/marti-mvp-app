-- Migration: Add Stripe Customer ID to user_profiles
-- Created: 2026-01-03
-- Purpose: Link business users to Stripe Customers for invoicing

-- Add stripe_customer_id column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);
