# @arkelythex/ecosystem — Drenyra Ecosystem Integration

Connector framework for integrating Drenyra with best-in-class open source tools.

## Philosophy

Drenyra does NOT rebuild ERP, workflow, analytics, OCR, or AI agents.
Drenyra ORCHESTRATES them through a unified connector framework.

> Drenyra is for accounting what Gentle AI is for software engineering.

## Architecture

```
Drenyra Core (proprietary) ←→ Connector Framework ←→ Open Source Ecosystem
  - SUNAT Engine              - ConnectorPort          - ERPNext (GL, AR/AP)
  - Fiscal Truth Engine       - ConnectorRegistry      - Docling (OCR)
  - Two Brains                - BaseConnector          - N8N (workflows)
  - Tenant Isolation          - Circuit Breaker        - Dify (AI agents)
  - Fiscal Event Bridge       - Health Checks          - DuckDB (analytics)
  - UBL 2.1 / SIRE / PLE                             - Neo4j (knowledge graph)
```

## Connectors

| Connector | Status | Purpose | Config Env Prefix |
|---|---|---|---|
| ERPNext | Phase 1 | General ledger, AR/AP, trial balance | `DRENYRA_ERPNEXT_*` |
| DuckDB | Phase 1 | Analytics OLAP, cashflow/SIRE/IGV views | `DRENYRA_DUCKDB_*` |
| Docling | Phase 2 | Document understanding, table extraction | `DRENYRA_DOCLING_*` |
| N8N | Phase 2 | Workflow automation | `DRENYRA_N8N_*` |
| Dify | Phase 2 | AI agent orchestration, RAG | `DRENYRA_DIFY_*` |
| Temporal | Phase 3 | Durable execution | `DRENYRA_TEMPORAL_*` |
| Neo4j | Phase 3 | GraphRAG, knowledge graph | `DRENYRA_NEO4J_*` |

## Usage

```typescript
import { getConnectorRegistry, ErpnextConnector } from "@arkelythex/ecosystem";

const registry = getConnectorRegistry();
const erpnext = new ErpnextConnector();
registry.register(erpnext);

await registry.connectAll();

// Post a journal entry from a fiscal event
const result = await erpnext.execute({
  type: "journal_entry.create",
  data: { postingDate, company, accounts },
});

// Check ecosystem health
const health = await registry.healthCheck();
```

## Core Moat (Never Delegated)

These capabilities remain proprietary to Drenyra:
- SUNAT RUC validation (Módulo 11)
- IGV calculation (18%)
- Detracciones / Retenciones SPOT
- UBL 2.1 XML generation + signing
- OSE/SUNAT API integration + CDR processing
- Fiscal Truth Engine (evidence graph, append-only state)
- SIRE/PLE generation
- Tenant/RUC isolation
- Two Brains Architecture (Core + AI Brain separation)
- Fiscal Event Bridge (NATS canonical events)
