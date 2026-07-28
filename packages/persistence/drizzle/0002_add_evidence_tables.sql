-- Phase B: Evidence Core — evidence_nodes and evidence_edges tables
-- CAP-SIRE-01 / REQ-B-001, REQ-B-002, REQ-B-003
-- Additive migration: no existing columns, tables, or constraints are modified.

-- evidence_nodes: SIRE-derived artifact provenance
CREATE TABLE evidence_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    artifact_id VARCHAR(255),
    period VARCHAR(7) NOT NULL,
    company_id UUID NOT NULL,
    hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX evidence_nodes_company_period_idx
    ON evidence_nodes (company_id, period);

-- evidence_edges: directed links between evidence nodes
CREATE TABLE evidence_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id UUID NOT NULL REFERENCES evidence_nodes(id),
    to_node_id UUID NOT NULL REFERENCES evidence_nodes(id),
    edge_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX evidence_edges_edge_type_idx
    ON evidence_edges (edge_type);

-- REQ-B-003: Append-only enforcement
-- Application role is denied UPDATE and DELETE on evidence tables.
-- Corrections must create new nodes + supersedes edges.
REVOKE UPDATE, DELETE ON evidence_nodes FROM app_role;
REVOKE UPDATE, DELETE ON evidence_edges FROM app_role;
