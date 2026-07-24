# Drenyra Product Topology

**Status:** Active  
**Date:** 2026-07-24  
**Repo:** `github.com/drenyra/Drenyra`  
**North star:** [Drenyra Financial Engineering Environment](../docs/products/drenyra-product-philosophy.md)

## What this repo is

Drenyra is the **verifiable financial operating system for businesses, accountants and governments** — a Financial Engineering Environment (FEE) that applies software engineering rigor (Ledger-as-Git, FSD, RED, CI/CD, agents, specs, receipts) to accounting.

It is **not** the platform mother. Identity federation, OS shell, and multi-vertical app directory live in [Drenyra](https://github.com/drenyra/Drenyra).

## FEE model applied to this repo

| Software Engineering | Drenyra                                     |
| -------------------- | ------------------------------------------- |
| Repository Git       | Workspace financiero                        |
| Commit               | Cambio contable atómico                     |
| Diff                 | Diferencia financiera explicada             |
| Branch               | Escenario, borrador o propuesta             |
| Pull request         | Paquete de revisión contable (RED)          |
| CI/CD                | Validaciones contables + fiscales           |
| Tests                | Invariantes financieras                     |
| Specs                | Fiscal Specification-Driven Execution (FSD) |

## Canonical layout

```text
Drenyra/
├── apps/
│   ├── web/              → Fiscal command center SPA
│   ├── api/              → Fiscal API (Elysia vertical slices)
│   ├── data-engine/      → SIRE / analytics (Python + Polars)
│   └── cli/              → Go TUI — Fiscal Terminal
├── packages/
│   ├── drenyra-orchestrator/
│   ├── domain/           → Framework-free entities, fiscal rules
│   ├── application/      → Use cases, DTOs, validators
│   ├── persistence/      → Drizzle schemas, repos, tenant scope
│   └── ...
└── e2e/                  → Product smoke tests
```

## Platform integration

Drenyra shell loads this repo via Module Federation in production. See [drenyra-connection.md](https://github.com/drenyra/Drenyra/blob/main/docs/cross-repo/drenyra-connection.md) (platform repo).

## Harness evolution (ADR-034)

Fase 1 uses REST (`/brain`, `/runs`, `/commands`). Fase 2 introduces **DFAS** — JSON-RPC App Server with evidence-native item stream. Spec: [ADR-034](../02-adr/adr-034-drenyra-fiscal-app-server.md).

## Related ADR

- [ADR-034: Drenyra Fiscal App Server (DFAS)](../02-adr/adr-034-drenyra-fiscal-app-server.md)
- Drenyra [ADR-033 Platform-Product Split](https://github.com/drenyra/Drenyra/blob/main/docs/02-adr/adr-033-platform-product-split.md)
