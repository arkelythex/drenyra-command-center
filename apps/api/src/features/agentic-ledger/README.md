# Agentic Ledger (Perú) — API Feature

**Status:** Draft | **Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

## Overview

This feature exposes the **Agentic Ledger** entry points in the API.

v1 focuses on **bank ingestion** for accountant workflows (CSV/normalized rows), building toward:
- Always-on reconciliation
- Close automation
- Compliance exports (SIRE/PLE) traceable to evidence

## Routes

- `POST /api/agentic-ledger/ingest/bank`

### CSV formats (v1)

- `GENERIC`: `date,description,amount,type,reference?`
- `BCP`: header-based export (supports `Cargo/Abono` or signed amounts)
- `INTERBANK` / `BBVA` / `SCOTIABANK`: header-based heuristics (works for common exports; share a sample if it fails)

## Mermaid (Flow)

```mermaid
flowchart TD
  A[CSV/Normalized Rows] --> B[API: ingest/bank]
  B --> C[Banking Storage (bank_transactions)]
  C --> D[Agentic Ledger proposals (next)]
```

## Edge Cases Covered

- Duplicate rows in the same upload → best-effort dedupe (v1).
- Partial failures → returns imported count (errors logged).

## References

- ADR: `docs/02-adr/adr-011-agentic-ledger-peru.md`
- Feature spec: `docs/03-features/agentic-ledger/README.md`
- API reference: `docs/04-api/agentic-ledger.md`

---

- [Gentleman Philosophy](../../../../docs/meta/gentleman-philosophy.md)
