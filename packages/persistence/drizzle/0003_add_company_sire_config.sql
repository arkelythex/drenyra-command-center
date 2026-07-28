-- CAP-SIRE-01 Phase C: Trust Layer — Per-company SIRE configuration
-- Additive migration: no existing columns modified

ALTER TABLE companies
  ADD COLUMN sire_materiality_threshold_pen NUMERIC(18, 2);  -- NULL = all rows critical (backward compatible)

ALTER TABLE companies
  ADD COLUMN sire_reversibility_window_hours INTEGER DEFAULT 24;  -- hours
