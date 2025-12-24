-- Migration: Update user_profiles for new onboarding questionnaire
-- Run this SQL in your Supabase SQL Editor

-- Add new columns for Section A: Business Basics
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_revenue TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS aov TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profit_margin TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS business_model TEXT;

-- Add new columns for Section B: Ads & Performance
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ad_spend TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ad_platforms TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS other_platforms TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS revenue_consistency TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profitable_ads TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ads_experience TEXT;

-- Add new columns for Section C: Creative & Funnel
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS monthly_creatives TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS testimonial_count TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS creative_creator TEXT;

-- Add new columns for Section D: Operations
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS inventory_status TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS other_inventory TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS fulfillment_time TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS return_issues TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS team_member TEXT;


-- Uncomment these lines after you've verified the migration works
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS industry;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS platforms;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS spend_bracket;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS objectives;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS current_management;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS performance_context;
 ALTER TABLE user_profiles DROP COLUMN IF EXISTS growth_intent;

-- Update agencies table to have compatible platform names
UPDATE agencies 
SET platforms = ARRAY['Meta', 'Google']
WHERE 'FB/IG' = ANY(platforms);

-- Add spend bracket mappings for agencies
UPDATE agencies 
SET spend_brackets = ARRAY['$1k–$5k', '$5k–$20k', '$20k+']
WHERE spend_brackets IS NULL OR array_length(spend_brackets, 1) = 0;
