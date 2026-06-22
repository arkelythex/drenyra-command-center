-- Fiscal Truth Events — Append-Only Trigger
--
-- Enforces immutability at the PostgreSQL level so that even direct DB access
-- cannot mutate or delete fiscal truth events. This is the last line of defense;
-- the application layer also never issues UPDATE/DELETE on this table.
--
-- Error code 23601 is a custom code (unassigned in the PostgreSQL manual) used
-- to signal "immutable table violation" for monitoring and alerting purposes.

CREATE OR REPLACE FUNCTION reject_fiscal_truth_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'fiscal_truth_events is append-only: UPDATE/DELETE not allowed'
    USING ERRCODE = '23601'; -- CUSTOM: immutable_table_violation
END;
$$;

-- Apply the trigger to the canonical table
DROP TRIGGER IF EXISTS fiscal_truth_events_append_only ON fiscal_truth_events;
CREATE TRIGGER fiscal_truth_events_append_only
  BEFORE UPDATE OR DELETE ON fiscal_truth_events
  FOR EACH ROW
  EXECUTE FUNCTION reject_fiscal_truth_mutation();
