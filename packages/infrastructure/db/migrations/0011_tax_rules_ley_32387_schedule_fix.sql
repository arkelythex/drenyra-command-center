-- Migration 0011: Align IGV/IPM component schedule with Ley 32387 (official SUNAT timeline)
-- Created: 2026-02-20
-- Notes:
-- - Keeps VAT total at 18%
-- - Corrects component windows to start on 2026-01-01 (not 2025-07-01)

DELETE FROM "tax_rule_versions" v
USING "tax_rules" r
WHERE v."rule_id" = r."id"
  AND r."code" IN ('IGV_COMPONENT', 'IPM_COMPONENT');

WITH selected_rule AS (
  SELECT "id" AS rule_id
  FROM "tax_rules"
  WHERE "code" = 'IGV_COMPONENT'
)
INSERT INTO "tax_rule_versions"
  ("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
  selected_rule.rule_id,
  seed."rate",
  NULL,
  'PEN',
  seed."effective_from",
  seed."effective_to",
  seed."metadata"
FROM selected_rule
CROSS JOIN (
  VALUES
    (0.160000::numeric, DATE '2011-03-01', DATE '2026-01-01', '{"legal_basis":"pre-Ley-32387"}'::jsonb),
    (0.155000::numeric, DATE '2026-01-01', DATE '2027-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.150000::numeric, DATE '2027-01-01', DATE '2028-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.145000::numeric, DATE '2028-01-01', DATE '2029-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.140000::numeric, DATE '2029-01-01', NULL, '{"legal_basis":"Ley-32387"}'::jsonb)
) AS seed("rate", "effective_from", "effective_to", "metadata");

WITH selected_rule AS (
  SELECT "id" AS rule_id
  FROM "tax_rules"
  WHERE "code" = 'IPM_COMPONENT'
)
INSERT INTO "tax_rule_versions"
  ("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
  selected_rule.rule_id,
  seed."rate",
  NULL,
  'PEN',
  seed."effective_from",
  seed."effective_to",
  seed."metadata"
FROM selected_rule
CROSS JOIN (
  VALUES
    (0.020000::numeric, DATE '2011-03-01', DATE '2026-01-01', '{"legal_basis":"pre-Ley-32387"}'::jsonb),
    (0.025000::numeric, DATE '2026-01-01', DATE '2027-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.030000::numeric, DATE '2027-01-01', DATE '2028-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.035000::numeric, DATE '2028-01-01', DATE '2029-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
    (0.040000::numeric, DATE '2029-01-01', NULL, '{"legal_basis":"Ley-32387"}'::jsonb)
) AS seed("rate", "effective_from", "effective_to", "metadata");
