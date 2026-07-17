# ADR-0006: Runtime integrations for MVP execution

## Status
Accepted

## Decision
Use Postgres via `sqlx` as runtime system of record, MinIO (S3-compatible) for evidence uploads via presigned URLs, and CSV-based ingestion for MVP-A bootstrap.

## Why
- Enables immediate end-to-end execution of both MVP tracks.
- Keeps architecture modular while avoiding early distributed-system overhead.
- Preserves upgrade path to managed S3 and scheduled ingestion jobs.
