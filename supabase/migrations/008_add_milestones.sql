-- Migration: Add milestones table for job payment splitting
-- Run this in Supabase SQL Editor

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Status flow: pending → in_progress → submitted → approved → paid
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started yet
    'in_progress',  -- Agency working on it
    'submitted',    -- Agency submitted for review
    'approved',     -- Business approved, ready for payment
    'paid',         -- Payment transferred to agency
    'revision'      -- Business requested changes
  )),
  
  -- Payment tracking
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_job_id ON milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

-- RLS Policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Businesses can view milestones for their jobs
CREATE POLICY "Businesses can view their job milestones"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- Businesses can create milestones for their jobs (only before funding)
CREATE POLICY "Businesses can create milestones for unfunded jobs"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.business_id = auth.uid()
      AND jobs.status = 'unfunded'
    )
  );

-- Businesses can update milestones (approve, request revision)
CREATE POLICY "Businesses can update their job milestones"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.business_id = auth.uid()
    )
  );

-- Businesses can delete milestones before funding
CREATE POLICY "Businesses can delete milestones before funding"
  ON milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.business_id = auth.uid()
      AND jobs.status = 'unfunded'
    )
  );

-- Agencies can view milestones for their jobs
CREATE POLICY "Agencies can view their job milestones"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- Agencies can update milestone status (start, submit)
CREATE POLICY "Agencies can update milestone status"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = milestones.job_id 
      AND jobs.agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
      )
    )
  );

-- Add has_milestones flag to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_milestones BOOLEAN DEFAULT false;

-- Add total_released column to track how much has been paid out
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_released DECIMAL(10,2) DEFAULT 0;

-- Comments
COMMENT ON TABLE milestones IS 'Payment milestones for jobs - allows splitting payments into stages';
COMMENT ON COLUMN milestones.order_index IS 'Display order of milestones (0-indexed)';
COMMENT ON COLUMN milestones.status IS 'Milestone workflow status';
COMMENT ON COLUMN jobs.has_milestones IS 'Whether this job uses milestone-based payments';
COMMENT ON COLUMN jobs.total_released IS 'Total amount already transferred to agency';
