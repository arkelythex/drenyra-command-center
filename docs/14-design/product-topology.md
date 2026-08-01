# Drenyra Product Topology

**Status:** Active  
**Date:** 2026-08-01  
**Repo:** `github.com/drenyra/Drenyra`  
**North star:** [Drenyra Financial Engineering Environment](../01-foundation/product-philosophy.md)

## What this repo is

Drenyra is the **verifiable financial operating system for businesses, accountants and governments** — a Financial Engineering Environment (FEE) that applies software engineering rigor (Ledger-as-Git, FSD, RED, CI/CD, agents, specs, receipts) to accounting.

It is **not** the platform mother. Identity federation, OS shell, and multi-vertical app directory live in [Drenyra](https://github.com/drenyra/Drenyra).

## Drenyra-AI is not a layer of Drenyra

Drenyra-AI is an **independent accounting agent operating system**, not an internal layer of this repo. It is the verifiable operating system for accounting agents: it coordinates humans and AI, enforces accounting and fiscal policies, validates every operation, and preserves auditable evidence before posting, closing, or filing.

| | Drenyra-AI | Drenyra |
| --- | --- | --- |
| Role | Ecosystem (framework, runtime, agents, skills, receipts, authority) | Visual and operational surface |
| Works | Standalone — CLI, API, other ERPs, other SaaS, external agents, integrations | Consumes Drenyra-AI as its accounting command center |
| Analogy | Gentle AI | OpenCode / Claude Code |

Its product protocol is **RDA — Receipt-Driven Accounting**, built on the RED receipt mechanism this repo already implements in its runtime (RDA defines *what* must be evidenced; RED implements *how* it is signed and verified). See [Drenyra-AI — Accounting Agent Operating System](../01-foundation/drenyra-ai-aos.md).

**Drenyra-Pi** is the Pi-native harness that executes the RDA protocol — it turns Pi into a disciplined accounting operator (accounting persona, context panel, specialized agents, accounting skills, model routing, and safety guards layered over the Drenyra-AI runtime), exactly as Gentle Pi is the Pi-native harness for Gentle AI. The joint thesis: Drenyra-AI supplies the protocol, operational intelligence, and verifiable authority; Drenyra-Pi turns Pi into the disciplined accounting terminal that executes that protocol; Drenyra is the visual surface where professionals and companies supervise, review, and authorize. See [Drenyra-Pi — Pi-Native Accounting Operations Harness](../01-foundation/drenyra-pi-harness.md).

**Drenyra-Engram** is the institutional accounting memory — the layer that remembers what the organization knows and can prove about its accounting: policies, criteria, learned exceptions, and approved decisions, kept with provenance, validity windows, and strict company isolation. It never replaces the ledger, the evidence store, or the receipt ledger: memory orients the work; only evidence, current policies, and professional approval authorize it. See [Drenyra-Engram — Institutional Accounting Memory](../01-foundation/drenyra-engram.md).

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

Fase 1 uses REST (`/brain`, `/runs`, `/commands`). Fase 2 introduces **DFAS** — JSON-RPC App Server with evidence-native item stream. Spec: [ADR-034](../11-adr/adr-034-drenyra-fiscal-app-server.md).

## Related ADR

- [ADR-034: Drenyra Fiscal App Server (DFAS)](../11-adr/adr-034-drenyra-fiscal-app-server.md)
- Drenyra [ADR-033 Platform-Product Split](https://github.com/drenyra/Drenyra/blob/main/docs/02-adr/adr-033-platform-product-split.md)
