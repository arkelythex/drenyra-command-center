# ADR-0004: Stack baseline (Rust + Next.js + OpenTelemetry)

## Status
Accepted

## Decision
Use Rust (Axum) for the core API and domain-critical paths.
Use Next.js/TypeScript for web/admin product surfaces.
Use OpenTelemetry as vendor-neutral observability standard.

## Why
- Rust improves reliability and performance in audit-critical flows.
- Next.js improves product iteration speed.
- OpenTelemetry standardizes traces/metrics/logs across environments.
