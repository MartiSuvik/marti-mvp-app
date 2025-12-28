-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0 CHECK (platform_fee >= 0),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add proposal_id and source to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct' CHECK (source IN ('proposal', 'direct'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_proposals_agency_id ON proposals(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_business_id ON proposals(business_id);
CREATE INDEX IF NOT EXISTS idx_proposals_deal_id ON proposals(deal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_jobs_proposal_id ON jobs(proposal_id);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals

-- Agencies can view all their proposals
CREATE POLICY "Agencies can view their proposals"
  ON proposals FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can create proposals
CREATE POLICY "Agencies can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );

-- Agencies can update their own draft proposals (read-only after sending)
CREATE POLICY "Agencies can update draft proposals"
  ON proposals FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
    AND status = 'draft'
  );

-- Businesses can view proposals sent to them
CREATE POLICY "Businesses can view their proposals"
  ON proposals FOR SELECT
  USING (business_id = auth.uid());

-- Businesses can update proposals (accept/decline only)
CREATE POLICY "Businesses can respond to proposals"
  ON proposals FOR UPDATE
  USING (
    business_id = auth.uid()
    AND status = 'sent'
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
  );

-- Function to automatically calculate platform fee (10%)
CREATE OR REPLACE FUNCTION calculate_proposal_platform_fee()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee := NEW.amount * 0.10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate platform fee
CREATE TRIGGER set_proposal_platform_fee
  BEFORE INSERT OR UPDATE OF amount ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_proposal_platform_fee();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_proposal_timestamp
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_updated_at();
