-- Migration 0012: SPOT detraction profiles by operation type
-- Created: 2026-02-20
-- Sources:
-- - SUNAT Anexo 3 (services/construction rates)
-- - SUNAT transporte de bienes por via terrestre (rate + threshold)

INSERT INTO "tax_rules" ("code", "name", "category", "sunat_resolution")
VALUES
  ('DETRACCION_SPOT_SERVICES', 'SPOT - demas servicios gravados con IGV', 'withholding', 'RS-183-2004/SUNAT'),
  ('DETRACCION_SPOT_TRANSPORT', 'SPOT - transporte de bienes por via terrestre', 'withholding', 'RS-073-2006/SUNAT'),
  ('DETRACCION_SPOT_CONSTRUCTION', 'SPOT - contratos de construccion', 'withholding', 'RS-183-2004/SUNAT')
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "sunat_resolution" = EXCLUDED."sunat_resolution";

WITH selected_rule AS (
  SELECT "id" FROM "tax_rules" WHERE "code" = 'DETRACCION_SPOT_SERVICES'
)
INSERT INTO "tax_rule_versions"
  ("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
  selected_rule."id",
  0.120000,
  70000,
  'PEN',
  DATE '2025-01-01',
  NULL,
  '{"legal_basis":"SUNAT Anexo 3 - Demas servicios gravados con IGV"}'::jsonb
FROM selected_rule
WHERE NOT EXISTS (
  SELECT 1
  FROM "tax_rule_versions" v
  WHERE v."rule_id" = selected_rule."id"
    AND v."effective_from" = DATE '2025-01-01'
);

WITH selected_rule AS (
  SELECT "id" FROM "tax_rules" WHERE "code" = 'DETRACCION_SPOT_TRANSPORT'
)
INSERT INTO "tax_rule_versions"
  ("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
  selected_rule."id",
  0.040000,
  40000,
  'PEN',
  DATE '2025-01-01',
  NULL,
  '{"legal_basis":"SUNAT transporte de bienes por via terrestre"}'::jsonb
FROM selected_rule
WHERE NOT EXISTS (
  SELECT 1
  FROM "tax_rule_versions" v
  WHERE v."rule_id" = selected_rule."id"
    AND v."effective_from" = DATE '2025-01-01'
);

WITH selected_rule AS (
  SELECT "id" FROM "tax_rules" WHERE "code" = 'DETRACCION_SPOT_CONSTRUCTION'
)
INSERT INTO "tax_rule_versions"
  ("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
  selected_rule."id",
  0.040000,
  70000,
  'PEN',
  DATE '2025-01-01',
  NULL,
  '{"legal_basis":"SUNAT Anexo 3 - Contratos de construccion"}'::jsonb
FROM selected_rule
WHERE NOT EXISTS (
  SELECT 1
  FROM "tax_rule_versions" v
  WHERE v."rule_id" = selected_rule."id"
    AND v."effective_from" = DATE '2025-01-01'
);
