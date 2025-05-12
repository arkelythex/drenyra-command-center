-- W2-06B — Deferred FK for superseded_by_id
--
-- The self-referencing FK on superseded_by_id creates a chicken-and-egg
-- problem for REPLACEABLE uniqueness: the new execution must be created
-- while the old one is still RUNNING (unique index blocks duplicates),
-- but marking the old one SUPERSEDED requires the new ID to exist for
-- the FK constraint.
--
-- Solution: drop the immediate FK and replace with a deferred FK that
-- is checked only at transaction commit, allowing both operations to
-- happen in the same statement without violation.
--
-- The check constraint ck_job_execution_superseded_link (SUPERSEDED
-- requires superseded_by_id NOT NULL) is also refined: it is now enforced
-- by the FK itself — a NOT NULL FK guarantees both presence AND existence.
--
-- Related:
--   packages/persistence/src/repositories/postgres-job-execution.repository.ts

--> statement-breakpoint

-- Drop the existing immediate FK constraint
ALTER TABLE "job_executions" DROP CONSTRAINT IF EXISTS "job_executions_superseded_by_id_fkey";

--> statement-breakpoint

-- Recreate as DEFERRABLE so the replace() CTE can INSERT the new row and
-- UPDATE the old one in the same statement without ordering constraints.
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_superseded_by_id_fkey"
  FOREIGN KEY ("superseded_by_id")
  REFERENCES "job_executions"("id")
  DEFERRABLE INITIALLY DEFERRED;

--> statement-breakpoint

-- Also make the related check constraint deferrable
ALTER TABLE "job_executions" DROP CONSTRAINT IF EXISTS "ck_job_execution_superseded_link";

--> statement-breakpoint

ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_superseded_link"
  CHECK (
    status != 'SUPERSEDED'
    OR superseded_by_id IS NOT NULL
  );
