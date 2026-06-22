CREATE TABLE IF NOT EXISTS platform_mcp_audit_events (
  id varchar(96) PRIMARY KEY,
  operation varchar(24) NOT NULL,
  outcome varchar(24) NOT NULL,
  tool_name varchar(128) NOT NULL,
  company_id varchar(128) NOT NULL,
  company_ruc varchar(11) NOT NULL,
  organization_id varchar(128) NOT NULL,
  period varchar(7) NOT NULL,
  country_code varchar(2) NOT NULL DEFAULT 'PE',
  actor_id varchar(128) NOT NULL,
  redaction_status varchar(24) NOT NULL,
  reason varchar(64) NOT NULL,
  occurred_at timestamp NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  message text NOT NULL
);

CREATE INDEX IF NOT EXISTS pmcp_audit_scope_idx
  ON platform_mcp_audit_events (company_id, company_ruc, period);

CREATE INDEX IF NOT EXISTS pmcp_audit_tool_outcome_idx
  ON platform_mcp_audit_events (tool_name, outcome);
