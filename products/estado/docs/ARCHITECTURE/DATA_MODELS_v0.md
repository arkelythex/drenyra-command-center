# Data Models v0 (storage-agnostic)

## Storage
- Postgres: system of record
- Object storage: evidence blobs
- Redis: caching and rate limits
- Optional search index for public read models

## Suggested tables
- dataset_sources, dataset_versions, expense_records
- reports, evidence, verification_cases, publications
- audit_events (append-only)
- retention_policies
