-- Migration: Remove obsolete stripe_transfer_id from milestones
-- This column was used in the old escrow/transfer model
-- Direct charges model doesn't use transfers, payments go directly to agencies

ALTER TABLE milestones DROP COLUMN IF EXISTS stripe_transfer_id;

-- Also update schema-complete.sql comment for documentation
COMMENT ON TABLE milestones IS 'Milestone payments - uses direct charges, not transfers';

NOTIFY pgrst, 'reload schema';
