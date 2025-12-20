-- Supabase Database Schema for Agency Matching Funnel
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (Updated for new 20-question onboarding)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  website_url TEXT,
  
  -- Section A: Business Basics
  product_description TEXT,
  monthly_revenue TEXT,
  aov TEXT,
  profit_margin TEXT,
  business_model TEXT,
  
  -- Section B: Ads & Performance
  ad_spend TEXT,
  ad_platforms TEXT[] DEFAULT '{}',
  other_platforms TEXT,
  revenue_consistency TEXT,
  profitable_ads TEXT,
  ads_experience TEXT,
  
  -- Section C: Creative & Funnel
  monthly_creatives TEXT,
  testimonial_count TEXT,
  creative_creator TEXT,
  
  -- Section D: Operations
  inventory_status TEXT,
  other_inventory TEXT,
  fulfillment_time TEXT,
  return_issues TEXT,
  team_member TEXT,
  
  -- Agency portal fields
  user_type TEXT DEFAULT 'business' CHECK (user_type IN ('business', 'agency')),
  agency_id UUID REFERENCES agencies(id),
  
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

-- ============================================
-- STRIPE CONNECT & JOBS SCHEMA
-- ============================================

-- Add Stripe fields to agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;

-- Add Stripe customer ID to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Jobs Table - Core entity for work between business and agency
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'unfunded', 'funded', 
    'in_progress', 'review', 'revision', 'approved', 'paid_out', 'cancelled', 'refunded'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Milestones - For phased payments (optional)
CREATE TABLE IF NOT EXISTS job_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'paid')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Payments - Track Stripe PaymentIntents
CREATE TABLE IF NOT EXISTS job_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Payouts - Track Stripe Transfers to agencies
CREATE TABLE IF NOT EXISTS job_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_transfer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger Entries - Audit trail for all payment events
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for jobs tables
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_deal_id ON jobs(deal_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_milestones_job_id ON job_milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_stripe_id ON job_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_job_payouts_job_id ON job_payouts(job_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_job_id ON ledger_entries(job_id);

-- Enable RLS on new tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
-- Businesses can see their own jobs
CREATE POLICY "Businesses can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = business_id);

-- Businesses can create jobs
CREATE POLICY "Businesses can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = business_id);

-- Businesses can update their own jobs
CREATE POLICY "Businesses can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = business_id);

-- RLS Policies for job_milestones (tied to job access)
CREATE POLICY "Users can view milestones for their jobs"
  ON job_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_milestones.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage milestones for their jobs"
  ON job_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_milestones.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- RLS Policies for job_payments (read-only for users)
CREATE POLICY "Users can view payments for their jobs"
  ON job_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_payments.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- RLS Policies for job_payouts (read-only for users)
CREATE POLICY "Users can view payouts for their jobs"
  ON job_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_payouts.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- RLS Policies for ledger_entries (read-only for users)
CREATE POLICY "Users can view ledger for their jobs"
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = ledger_entries.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- Triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_milestones_updated_at ON job_milestones;
CREATE TRIGGER update_job_milestones_updated_at
  BEFORE UPDATE ON job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AGENCY PORTAL SCHEMA
-- ============================================

-- Add owner_id to agencies to link agency to an auth user
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add user_type to user_profiles to differentiate business vs agency users
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'business' CHECK (user_type IN ('business', 'agency'));

-- Add agency_id to user_profiles for agency users (links to which agency they belong to)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);

-- Update jobs status constraint to include 'declined'
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN (
  'draft', 'pending', 'declined', 'unfunded', 'funded', 
  'in_progress', 'review', 'revision', 'approved', 'paid_out', 'cancelled', 'refunded'
));

-- Create indexes for agency portal queries
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);

-- RLS Policies for agencies - owner can view and update their agency
DROP POLICY IF EXISTS "Agency owners can view their agency" ON agencies;
CREATE POLICY "Agency owners can view their agency"
  ON agencies FOR SELECT
  USING (owner_id = auth.uid() OR verified = true);

DROP POLICY IF EXISTS "Agency owners can update their agency" ON agencies;
CREATE POLICY "Agency owners can update their agency"
  ON agencies FOR UPDATE
  USING (owner_id = auth.uid());

-- RLS Policies for jobs - agencies can view jobs assigned to them
DROP POLICY IF EXISTS "Agencies can view their jobs" ON jobs;
CREATE POLICY "Agencies can view their jobs"
  ON jobs FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can update jobs assigned to them (for accepting, starting work, submitting)
DROP POLICY IF EXISTS "Agencies can update their jobs" ON jobs;
CREATE POLICY "Agencies can update their jobs"
  ON jobs FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- RLS for job_payments - agencies can view payments for their jobs
DROP POLICY IF EXISTS "Agencies can view payments for their jobs" ON job_payments;
CREATE POLICY "Agencies can view payments for their jobs"
  ON job_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_payments.job_id 
      AND jobs.agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- RLS for job_payouts - agencies can view payouts for their jobs
DROP POLICY IF EXISTS "Agencies can view payouts for their jobs" ON job_payouts;
CREATE POLICY "Agencies can view payouts for their jobs"
  ON job_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_payouts.job_id 
      AND jobs.agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- RLS for ledger_entries - agencies can view ledger for their jobs
DROP POLICY IF EXISTS "Agencies can view ledger for their jobs" ON ledger_entries;
CREATE POLICY "Agencies can view ledger for their jobs"
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = ledger_entries.job_id 
      AND jobs.agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- ============================================
-- AGENCY APPLICATIONS (Invite-Only System)
-- ============================================

-- Table to store agency interest form submissions
CREATE TABLE IF NOT EXISTS agency_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_agency_applications_status ON agency_applications(status);
CREATE INDEX IF NOT EXISTS idx_agency_applications_email ON agency_applications(contact_email);

-- No RLS needed - this table is admin-only, we'll use service role key to insert
-- But allow anonymous inserts for the form (with rate limiting at edge function level)
ALTER TABLE agency_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit an application (insert only)
DROP POLICY IF EXISTS "Anyone can submit agency application" ON agency_applications;
CREATE POLICY "Anyone can submit agency application"
  ON agency_applications FOR INSERT
  WITH CHECK (true);

-- Only admins can view applications (via service role, not RLS)

-- ============================================
-- CHAT / CONVERSATIONS SYSTEM
-- ============================================

-- Ensure owner_id column exists on agencies (needed for RLS)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Conversations table (one per deal)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES auth.users(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(deal_id) -- One conversation per deal
);

-- Messages table (persisted chat history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('business', 'agency')),
  sender_name TEXT NOT NULL, -- Denormalized for easy display
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE -- For read receipts (future)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_deal ON conversations(deal_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agency ON conversations(agency_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Business users can see their conversations
DROP POLICY IF EXISTS "Business can view their conversations" ON conversations;
CREATE POLICY "Business can view their conversations"
  ON conversations FOR SELECT
  USING (business_id = auth.uid());

-- Agency users can see conversations for their agency
DROP POLICY IF EXISTS "Agency can view their conversations" ON conversations;
CREATE POLICY "Agency can view their conversations"
  ON conversations FOR SELECT
  USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- Business users can create conversations for their deals
DROP POLICY IF EXISTS "Business can create conversations" ON conversations;
CREATE POLICY "Business can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (business_id = auth.uid());

-- RLS Policies for messages
-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE business_id = auth.uid() OR 
            agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- Users can insert messages to their conversations
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE business_id = auth.uid() OR 
            agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime policies (for Supabase Realtime broadcast)
-- These allow authenticated users to use private channels
-- Note: These may already exist or the realtime.messages table may not exist yet
-- Run these separately if needed after enabling Realtime in Supabase dashboard
DO $$
BEGIN
  -- Try to create the policy, ignore if it already exists or table doesn't exist
  BEGIN
    DROP POLICY IF EXISTS "authenticated_users_can_receive" ON realtime.messages;
    CREATE POLICY "authenticated_users_can_receive" ON realtime.messages
      FOR SELECT TO authenticated USING (true);
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'realtime.messages table does not exist yet - skipping policy';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy already exists - skipping';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "authenticated_users_can_send" ON realtime.messages;
    CREATE POLICY "authenticated_users_can_send" ON realtime.messages
      FOR INSERT TO authenticated WITH CHECK (true);
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'realtime.messages table does not exist yet - skipping policy';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy already exists - skipping';
  END;
END $$;

