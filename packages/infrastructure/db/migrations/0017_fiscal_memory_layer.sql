CREATE TABLE IF NOT EXISTS fiscal_memories (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  company_id text NOT NULL,
  ruc text NOT NULL,
  period text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  evidence_refs jsonb NOT NULL,
  tags jsonb NOT NULL,
  created_by text NOT NULL,
  approved_by text,
  source_agent_id text,
  related_memory_ids jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fiscal_memory_revisions (
  id text PRIMARY KEY,
  memory_id text NOT NULL REFERENCES fiscal_memories(id),
  revision_number integer NOT NULL,
  changed_by text NOT NULL,
  change_reason text NOT NULL,
  previous_value jsonb NOT NULL,
  next_value jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiscal_memories_company_period_idx ON fiscal_memories(company_id, period);
CREATE INDEX IF NOT EXISTS fiscal_memories_company_category_idx ON fiscal_memories(company_id, category);
CREATE INDEX IF NOT EXISTS fiscal_memories_company_severity_idx ON fiscal_memories(company_id, severity);
CREATE INDEX IF NOT EXISTS fiscal_memories_ruc_period_idx ON fiscal_memories(ruc, period);
CREATE INDEX IF NOT EXISTS fiscal_memories_status_idx ON fiscal_memories(status);
CREATE INDEX IF NOT EXISTS fiscal_memories_scope_idx ON fiscal_memories(tenant_id, company_id, ruc);
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_memory_revisions_memory_revision_idx ON fiscal_memory_revisions(memory_id, revision_number);
CREATE INDEX IF NOT EXISTS fiscal_memory_revisions_memory_idx ON fiscal_memory_revisions(memory_id);
