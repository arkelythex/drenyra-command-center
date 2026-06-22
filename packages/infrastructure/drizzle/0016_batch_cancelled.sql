-- Migration: Add "cancelled" status to batch_runs and batch_run_items
-- Drizzle text({ enum: [...] }) creates CHECK constraints, so we
-- need to drop and recreate them with the new value included.

ALTER TABLE batch_runs DROP CONSTRAINT batch_runs_status_check;
ALTER TABLE batch_runs ADD CONSTRAINT batch_runs_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial', 'cancelled'));

ALTER TABLE batch_run_items DROP CONSTRAINT batch_run_items_status_check;
ALTER TABLE batch_run_items ADD CONSTRAINT batch_run_items_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
