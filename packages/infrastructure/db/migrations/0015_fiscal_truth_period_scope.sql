-- Fiscal Truth period scoping for SUNAT/SIRE/PLE correctness.
-- Existing rows are marked with a non-operational legacy period so they cannot
-- be confused with a real YYYY-MM fiscal period during scoped reads.
ALTER TABLE fiscal_evidence_nodes
  ADD COLUMN IF NOT EXISTS period varchar(7) NOT NULL DEFAULT '1970-01';

ALTER TABLE fiscal_truth_events
  ADD COLUMN IF NOT EXISTS period varchar(7) NOT NULL DEFAULT '1970-01';

ALTER TABLE fiscal_evidence_edges
  ADD COLUMN IF NOT EXISTS period varchar(7) NOT NULL DEFAULT '1970-01';

ALTER TABLE fiscal_replay_checkpoints
  ADD COLUMN IF NOT EXISTS period varchar(7) NOT NULL DEFAULT '1970-01';

CREATE INDEX IF NOT EXISTS fen_scope_period_node_idx
  ON fiscal_evidence_nodes (node_id, company_id, company_ruc, period);

CREATE INDEX IF NOT EXISTS fte_aggregate_scope_period_idx
  ON fiscal_truth_events (aggregate_id, company_id, company_ruc, period);

CREATE INDEX IF NOT EXISTS fee_from_scope_period_idx
  ON fiscal_evidence_edges (from_node_id, company_id, company_ruc, period);

CREATE INDEX IF NOT EXISTS frc_aggregate_scope_period_idx
  ON fiscal_replay_checkpoints (aggregate_id, company_id, company_ruc, period);
