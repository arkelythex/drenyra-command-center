# Architecture Overview (v0)

## Style
- Domain-Driven Design (DDD)
- Hexagonal (Ports and Adapters)
- Audit-first design
- Prefer modular monolith until scale forces decomposition

## Core concerns
- Trust and auditability
- Privacy by design (data minimization)
- Identity and access control (OIDC + RBAC on privileged actions)
- Inclusive UX (WhatsApp-first optional)
- Observability (logs/metrics/traces) from day one

## Recommended stack (implementation-agnostic)
- Postgres (system of record)
- Object storage for evidence (S3-compatible)
- Redis for caching/rate-limit
- Queue/event bus only if necessary (start simple)
