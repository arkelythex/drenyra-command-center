-- M4.2 Durable Missions — fenced multi-instance leases
--
-- mission_id is globally unique; company_id remains mandatory for tenant-scoped
-- lease operations and auditability.

CREATE TABLE IF NOT EXISTS "mission_leases" (
  "mission_id" uuid PRIMARY KEY REFERENCES "accounting_missions" ("id") ON DELETE CASCADE,
  "company_id" uuid NOT NULL REFERENCES "companies" ("id"),
  "expected_version" integer NOT NULL,
  "lease_owner" varchar(255) NOT NULL,
  "lease_token" varchar(64) NOT NULL,
  "lease_expires_at" timestamp with time zone NOT NULL,
  "fencing_token" integer NOT NULL,
  "acquired_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_leases_company_id_idx"
  ON "mission_leases" ("company_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_leases_expires_at_idx"
  ON "mission_leases" ("lease_expires_at");
