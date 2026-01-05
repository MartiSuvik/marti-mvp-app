-- Migration: Add RLS policies for agencies to access jobs
-- Created: 2026-01-03
-- Purpose: Allow agencies to view and update jobs assigned to them

-- Allow agencies to view jobs assigned to them
DROP POLICY IF EXISTS "Agencies can view assigned jobs" ON jobs;
CREATE POLICY "Agencies can view assigned jobs"
  ON jobs FOR SELECT
  USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- Allow agencies to update jobs assigned to them (for accepting/declining, updating status)
DROP POLICY IF EXISTS "Agencies can update assigned jobs" ON jobs;
CREATE POLICY "Agencies can update assigned jobs"
  ON jobs FOR UPDATE
  USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- Also add policies for job_milestones, job_payments, job_payouts for agencies
-- (these may already exist but let's ensure they do)

DROP POLICY IF EXISTS "Agencies can view milestones for their jobs" ON job_milestones;
CREATE POLICY "Agencies can view milestones for their jobs"
  ON job_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_milestones.job_id 
      AND jobs.agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

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
