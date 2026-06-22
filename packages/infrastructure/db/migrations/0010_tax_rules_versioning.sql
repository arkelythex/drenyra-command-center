-- Migration 0010: Versioned Tax Rules (Peru 2026)
-- Purpose: temporal tax engine baseline for VAT components and detracciones
-- Created: 2026-02-20

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS "tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"sunat_resolution" varchar(50),
	"created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tax_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rule_id" uuid NOT NULL REFERENCES "tax_rules"("id") ON DELETE CASCADE,
	"rate" numeric(10, 6),
	"threshold_cents" integer,
	"threshold_currency" varchar(3) NOT NULL DEFAULT 'PEN',
	"effective_from" date NOT NULL,
	"effective_to" date,
	"metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
	"created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tax_rules_category_idx"
	ON "tax_rules" ("category");

CREATE INDEX IF NOT EXISTS "tax_rule_versions_rule_effective_from_idx"
	ON "tax_rule_versions" ("rule_id", "effective_from");

CREATE INDEX IF NOT EXISTS "tax_rule_versions_effective_window_idx"
	ON "tax_rule_versions" ("effective_from", "effective_to");

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'tax_rule_versions_no_overlap'
	) THEN
		ALTER TABLE "tax_rule_versions"
		ADD CONSTRAINT "tax_rule_versions_no_overlap"
		EXCLUDE USING gist (
			"rule_id" WITH =,
			daterange("effective_from", COALESCE("effective_to", 'infinity'::date), '[)') WITH &&
		);
	END IF;
END $$;

INSERT INTO "tax_rules" ("code", "name", "category", "sunat_resolution")
VALUES
	('VAT_TOTAL', 'IGV + IPM total', 'tax', 'LEY-32387'),
	('IGV_COMPONENT', 'Componente IGV', 'tax', 'LEY-32387'),
	('IPM_COMPONENT', 'Componente IPM', 'tax', 'LEY-32387'),
	('DETRACCION_SPOT', 'Sistema SPOT detracciones', 'withholding', 'ANEXOS-SPOT')
ON CONFLICT ("code") DO UPDATE
SET
	"name" = EXCLUDED."name",
	"category" = EXCLUDED."category",
	"sunat_resolution" = EXCLUDED."sunat_resolution";

-- VAT total stays at 18%
WITH selected_rule AS (
	SELECT "id" FROM "tax_rules" WHERE "code" = 'VAT_TOTAL'
)
INSERT INTO "tax_rule_versions"
	("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
	selected_rule."id",
	0.180000,
	NULL,
	'PEN',
	DATE '2011-03-01',
	NULL,
	'{"legal_basis":"IGV+IPM total"}'::jsonb
FROM selected_rule
WHERE NOT EXISTS (
	SELECT 1
	FROM "tax_rule_versions" v
	WHERE v."rule_id" = selected_rule."id"
		AND v."effective_from" = DATE '2011-03-01'
);

-- IGV component timeline (Ley 32387 schedule)
WITH selected_rule AS (
	SELECT "id" FROM "tax_rules" WHERE "code" = 'IGV_COMPONENT'
)
INSERT INTO "tax_rule_versions"
	("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
	selected_rule."id",
	seed."rate",
	NULL,
	'PEN',
	seed."effective_from",
	seed."effective_to",
	seed."metadata"
FROM selected_rule
CROSS JOIN (
	VALUES
		(0.160000::numeric, DATE '2011-03-01', DATE '2025-07-01', '{"legal_basis":"pre-Ley-32387"}'::jsonb),
		(0.155000::numeric, DATE '2025-07-01', DATE '2027-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
		(0.150000::numeric, DATE '2027-01-01', DATE '2029-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
		(0.160000::numeric, DATE '2029-01-01', NULL, '{"legal_basis":"Ley-32387"}'::jsonb)
) AS seed("rate", "effective_from", "effective_to", "metadata")
WHERE NOT EXISTS (
	SELECT 1
	FROM "tax_rule_versions" v
	WHERE v."rule_id" = selected_rule."id"
		AND v."effective_from" = seed."effective_from"
);

-- IPM component timeline (Ley 32387 schedule)
WITH selected_rule AS (
	SELECT "id" FROM "tax_rules" WHERE "code" = 'IPM_COMPONENT'
)
INSERT INTO "tax_rule_versions"
	("rule_id", "rate", "threshold_cents", "threshold_currency", "effective_from", "effective_to", "metadata")
SELECT
	selected_rule."id",
	seed."rate",
	NULL,
	'PEN',
	seed."effective_from",
	seed."effective_to",
	seed."metadata"
FROM selected_rule
CROSS JOIN (
	VALUES
		(0.020000::numeric, DATE '2011-03-01', DATE '2025-07-01', '{"legal_basis":"pre-Ley-32387"}'::jsonb),
		(0.025000::numeric, DATE '2025-07-01', DATE '2027-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
		(0.030000::numeric, DATE '2027-01-01', DATE '2029-01-01', '{"legal_basis":"Ley-32387"}'::jsonb),
		(0.020000::numeric, DATE '2029-01-01', NULL, '{"legal_basis":"Ley-32387"}'::jsonb)
) AS seed("rate", "effective_from", "effective_to", "metadata")
WHERE NOT EXISTS (
	SELECT 1
	FROM "tax_rule_versions" v
	WHERE v."rule_id" = selected_rule."id"
		AND v."effective_from" = seed."effective_from"
);

-- Generic SPOT baseline threshold (S/ 700)
WITH selected_rule AS (
	SELECT "id" FROM "tax_rules" WHERE "code" = 'DETRACCION_SPOT'
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
	'{"legal_basis":"SPOT general threshold"}'::jsonb
FROM selected_rule
WHERE NOT EXISTS (
	SELECT 1
	FROM "tax_rule_versions" v
	WHERE v."rule_id" = selected_rule."id"
		AND v."effective_from" = DATE '2025-01-01'
);
