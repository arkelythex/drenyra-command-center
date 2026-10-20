-- D5 (monthly close MVP) — mission_receipts is the append-only log of
-- approve / reject decisions on missions.
--
-- Rows are written by MissionsService in the same transaction as the
-- mission's state change. Once written, a decision cannot be changed or
-- removed: UPDATE, DELETE and TRUNCATE raise an error for every role,
-- including the table owner. Corrections are new rows, never edits.
--
-- Idempotent: safe to apply more than once.

CREATE OR REPLACE FUNCTION mission_receipts_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'mission_receipts is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS mission_receipts_no_update_delete ON "mission_receipts";
--> statement-breakpoint

CREATE TRIGGER mission_receipts_no_update_delete
  BEFORE UPDATE OR DELETE ON "mission_receipts"
  FOR EACH ROW EXECUTE FUNCTION mission_receipts_reject_mutation();
--> statement-breakpoint

DROP TRIGGER IF EXISTS mission_receipts_no_truncate ON "mission_receipts";
--> statement-breakpoint

CREATE TRIGGER mission_receipts_no_truncate
  BEFORE TRUNCATE ON "mission_receipts"
  FOR EACH STATEMENT EXECUTE FUNCTION mission_receipts_reject_mutation();
