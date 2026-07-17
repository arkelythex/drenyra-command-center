# MVP-A: Transparencia Municipal (Audit-first)

## Problem
Citizens cannot verify in a simple and traceable way how municipal budgets are spent.

## Hypothesis
If we publish an audited dashboard with source and dataset traceability, trust and usage will increase, measured by:
- recurring visits
- exploration time per category
- citizen reports that use data-based evidence

## Scope v0
- Ingestion: open data + official CSV/Excel + documented legal scraping
- Normalization: category taxonomy + deduplication
- Ledger: immutable register of dataset versions + checksums
- Read models: public dashboard + public API

## Domain entities
- DatasetSource(id, type, url, owner, license)
- DatasetVersion(id, source_id, checksum, ingested_at)
- ExpenseRecord(id, version_id, entity, amount, category, date, supplier?, doc_ref?)
- PublicMetric(id, name, computed_at, value)
- AuditEvent(id, actor, action, target, timestamp, metadata)

## APIs (v0)
- GET /public/expenses?entity=&category=&from=&to=
- GET /public/datasets
- GET /public/datasets/{id}/versions
- GET /public/audit/datasets/{id}
- POST /admin/ingest/run (protected)

## Non-goals
- No corruption prediction engine
- No publication of personal data
