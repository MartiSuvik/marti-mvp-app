-- Migration: Remove Platform Fees
-- Date: 2026-01-09
-- Description: Remove all platform fee functionality (triggers, functions, columns)
-- Platform now takes 0% fee - 100% goes to agencies

-- Step 1: Drop the trigger that auto-calculates platform fees
DROP TRIGGER IF EXISTS set_proposal_platform_fee ON proposals;

-- Step 2: Drop the function that calculates platform fees
DROP FUNCTION IF EXISTS calculate_proposal_platform_fee();

-- Step 3: Set all existing platform fees to 0 (before dropping columns)
UPDATE proposals SET platform_fee = 0 WHERE platform_fee IS NOT NULL;
UPDATE jobs SET platform_fee = 0 WHERE platform_fee IS NOT NULL;

-- Step 4: Drop the platform_fee columns from both tables
ALTER TABLE proposals DROP COLUMN IF EXISTS platform_fee;
ALTER TABLE jobs DROP COLUMN IF EXISTS platform_fee;

-- Note: Agencies now receive 100% of job/proposal amounts
-- Platform revenue model has changed - no commission on transactions
