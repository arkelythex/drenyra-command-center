# Drenyra Product Topology

**Status:** Active  
**Date:** 2026-06-30  
**Repo:** `github.com/drenyra/Drenyra`

## What this repo is

Drenyra is the **flagship fiscal product** of DRENYRA — **Codex** (deterministic engine) + **Digits** (web/CLI surfaces).

It is **not** the platform mother. Identity federation, OS shell, and multi-vertical app directory live in [Drenyra](https://github.com/drenyra/Drenyra).

## Design reference

Inspired by **OpenAI Codex App**:

- **Harness:** `packages/drenyra-orchestrator`, `packages/drenyra-engram`
- **Clients:** `apps/web` (Digits), `apps/drenyra-cli` (TUI)
- **Deterministic core:** `packages/domain` (Korveth / tax-calculator, SIRE-bench)

## Canonical layout

```text
Drenyra/
├── apps/
│   ├── web/              → Digits SPA (MF remote in prod)
│   ├── api/              → Fiscal API
│   ├── data-engine/      → SIRE / analytics
│   └── drenyra-cli/      → Go TUI
├── packages/
│   ├── drenyra-orchestrator/
│   ├── drenyra-harness/
│   ├── agents/
│   ├── domain/ (incl. agent types)
│   └── application/
└── e2e/                  → Product smoke tests
```

## Platform integration

Drenyra shell loads this repo via Module Federation in production. See [drenyra-connection.md](https://github.com/drenyra/Drenyra/blob/main/docs/cross-repo/drenyra-connection.md) (platform repo).

## Harness evolution (ADR-034)

Fase 1 uses REST (`/brain`, `/runs`, `/commands`). Fase 2 introduces **DFAS** — JSON-RPC App Server with evidence-native item stream. Spec: [ADR-034](../02-adr/adr-034-drenyra-fiscal-app-server.md).

## Related ADR

- [ADR-034: Drenyra Fiscal App Server (DFAS)](../02-adr/adr-034-drenyra-fiscal-app-server.md) — this repo
- Drenyra [ADR-033 Platform-Product Split](https://github.com/drenyra/Drenyra/blob/main/docs/02-adr/adr-033-platform-product-split.md)
