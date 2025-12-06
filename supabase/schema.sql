-- Supabase Database Schema for Agency Matching Funnel
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  platforms TEXT[] DEFAULT '{}',
  spend_bracket TEXT,
  objectives TEXT[] DEFAULT '{}',
  current_management TEXT,
  performance_context TEXT,
  growth_intent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  platforms TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  spend_brackets TEXT[] DEFAULT '{}',
  objectives TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'active', 'review', 'ongoing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_agency_id ON deals(agency_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_agencies_verified ON agencies(verified);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view verified agencies" ON agencies;
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;

-- RLS Policies for user_profiles
-- Using a single policy for all operations is more efficient
CREATE POLICY "Users full access to own profile"
  ON user_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agencies (public read for verified agencies)
CREATE POLICY "Anyone can view verified agencies"
  ON agencies FOR SELECT
  USING (verified = true);

-- RLS Policies for deals - simplified
CREATE POLICY "Users full access to own deals"
  ON deals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample agencies (optional - for testing)
INSERT INTO agencies (name, description, platforms, industries, spend_brackets, objectives, capabilities, verified) VALUES
('Elevate Digital', 'Full-service digital marketing agency specializing in e-commerce and SaaS growth.', 
 ARRAY['FB/IG', 'Google', 'TikTok'], ARRAY['E-commerce', 'SaaS'], 
 ARRAY['$5–20k', '$20–50k', '$50–150k'], 
 ARRAY['Improve ROAS', 'Scale spend', 'Creative improvement'],
 ARRAY['Social Media', 'Content', 'ROAS Optimization', 'Creative Development'], true),
('Neon Strategies', 'B2B marketing powerhouse focused on scaling high-growth SaaS companies.',
 ARRAY['Google', 'YouTube', 'LinkedIn'], ARRAY['SaaS', 'Finance'],
 ARRAY['$20–50k', '$50–150k', '$150k+'],
 ARRAY['Scale spend', 'Expand channels'],
 ARRAY['Branding', 'Design', 'B2B Marketing', 'Account-Based Marketing'], true),
('Pixel Perfect', 'Creative-first agency with expertise in performance marketing and analytics.',
 ARRAY['FB/IG', 'Google', 'Programmatic'], ARRAY['E-commerce', 'Healthcare'],
 ARRAY['Under $5k', '$5–20k', '$20–50k'],
 ARRAY['Fix tracking', 'Improve ROAS'],
 ARRAY['UI/UX', 'Development', 'Analytics', 'Conversion Optimization'], true)
ON CONFLICT DO NOTHING;

