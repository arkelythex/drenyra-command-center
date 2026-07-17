# Architecture Decision Records (ADR)

Use ADRs for irreversible or hard-to-reverse technical decisions.

## Status values
- Proposed
- Accepted
- Superseded
- Rejected

## Naming
`ADR-XXXX-short-title.md`

## Current ADRs
- ADR-0001: architecture style (DDD + Hexagonal, modular monolith first)
- ADR-0002: append-only audit log for sensitive actions
- ADR-0003: modular monolith first, service split by operational need
- ADR-0004: stack baseline (Rust + Next.js + OpenTelemetry)
- ADR-0005: avoid premature microservice decomposition
- ADR-0006: runtime integrations for MVP execution (sqlx + MinIO + CSV ingest)
- ADR-0007: supply-chain security automation baseline
- ADR-0008: release engineering baseline (semantic release + changelog automation)
- ADR-0009: operations and reliability baseline (SLOs + runbooks + alerts)
- ADR-0010: OIDC auth and RBAC baseline for admin/moderation endpoints
- ADR-0011: local Keycloak integration for OIDC validation
- ADR-0012: auth integration CI and auth observability metrics
- ADR-0013: local Prometheus and Grafana observability stack
- ADR-0014: domain SLO metrics and observability asset validation
- ADR-0015: workflow resolution metrics and HTTP transition integration checks
