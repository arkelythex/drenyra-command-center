# ADR-0001: Architecture Style

## Status
Accepted

## Context
The platform needs high trust, changing public processes, and long-term maintainability.

## Decision
Use DDD + Hexagonal (Ports and Adapters).
Prefer modular monolith first.
Introduce CQRS read models when dashboards/search demand it.

## Consequences
- Domain rules are stable and testable.
- Adapters are replaceable (DB, bots, auth).
- Supports an audit-first approach.
- Requires discipline in module boundaries.
