-- CAP-SIRE-01 Phase D: Durable Execution — UNKNOWN state + payload storage
-- Additive migration: no existing columns modified
-- REQ-D-001, REQ-D-003

-- Add payload storage for retry (REQ-D-003)
ALTER TABLE sire_submissions
  ADD COLUMN payload_base64 TEXT;  -- NULL for pre-migration submissions

-- Update status comment to include new states (REQ-D-001, REQ-D-004)
COMMENT ON COLUMN sire_submissions.status IS
  'PENDING, SUBMITTED, ACCEPTED, REJECTED, OBSERVED, SIMULATED, FAILED, UNKNOWN, RECONCILING';
