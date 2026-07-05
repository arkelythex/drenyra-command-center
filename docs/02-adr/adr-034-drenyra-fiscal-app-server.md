# ADR-034: Drenyra Fiscal App Server (DFAS)

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team  
**Canonical repo:** `github.com/drenyra/Drenyra` (this file)  
**Extends:** [ADR-033 Platform-Product Split](https://github.com/drenyra/Drenyra/blob/main/docs/02-adr/adr-033-platform-product-split.md) (Drenyra repo)  
**Supersedes:** Partial unification of ADR-026 runtime surfaces and dual-surface Brain transport layers

> **Note:** ADR-032 = Korveth. ADR-033 = Platform vs Product split (Drenyra). **ADR-034 = DFAS** (Drenyra product harness protocol).

## Context

Within the [Platform vs Product split](https://github.com/drenyra/Drenyra/blob/main/docs/02-adr/adr-033-platform-product-split.md), Drenyra is the **Codex App equivalent** — harness + clients ship from this repo. Drenyra is the **ChatGPT Platform equivalent** — shell, IAM, MF host.

Drenyra today exposes **four parallel runtime entry points**:

- Brain threads (`/api/drenyra/brain/*`)
- Runtime runs with SSE (`/api/drenyra/runs/*`)
- Command envelopes (`/api/drenyra/commands/*`)
- Harness execution (`/api/fiscal-command-center/harness/*`)

Each surface (Web, CLI, API partners) integrates differently. OpenAI solved this with the **Codex App Server** — bidirectional JSON-RPC, thread management, item streaming, server-initiated approvals.

Drenyra cannot copy Codex verbatim: fiscal operations require **mandatory scope**, **evidence chains**, **deterministic promotion boundaries**, and **period-level orchestration**.

## Decision

Introduce the **Drenyra Fiscal App Server (DFAS)** as the canonical transport and runtime composition layer **in this repo only**.

### 1. Protocol

- **Wire format:** JSON-RPC 2.0 over WebSocket (primary), SSE (fallback), NDJSON stdio (CLI).
- **Version:** `DFAS_PROTOCOL_VERSION = "1.0.0"` in `packages/domain/src/drenyra/dfas-protocol-types.ts`.
- **Messages:** `thread/*`, `turn/*`, `item/*`, `approval/*` — see [DFAS Spec](../01-architecture/drenyra-fiscal-app-server-2026.md).
- **Item stream:** Evidence-native items: evidence, gates, envelopes, capability decisions, approvals, truth promotions.

### 2. Unified Runtime Kernel

Single composition module at `apps/api/src/features/drenyra/kernel/`:

| Component | Wraps |
|---|---|
| `FiscalThreadManager` | Brain threads + run metadata |
| `TurnController` | Turn lifecycle + approval pause/resume |
| `DelegationRouter` | `@drenyra/harness` tier graph |
| `OrchestrationRouter` | Transaction layer (Mastra) + Period layer (phase orchestrator) |
| `CapabilityGuard` | `evaluateDrenyraCapability` |
| `SkillInjector` | Lexori skill registry |
| `TruthPromotionBoundary` | Fiscal Truth Engine only |

REST endpoints remain **compat layer v0**. DFAS WebSocket at `/api/drenyra/v1/ws` is **v1**.

### 3. MCP is not the primary transport

MCP remains for **external tool connectors** (SUNAT, ERPNext). Drenyra `os-supervisor` registers Drenyra MCP plugins at platform level. DFAS is for **Drenyra clients** (Digits web, CLI, automations).

### 4. Fiscal Guardian

Auto-approval for low-risk `read` / `explain` / `draft`. `material_action` **never** auto-approved. Policies: `packages/domain/src/drenyra/guardian-policies.ts`.

### 5. Repo ownership (aligned with ADR-033)

| Artifact | Canonical location |
|---|---|
| DFAS ADR, spec, SDD tasks | **Drenyra** `docs/` |
| Domain contracts (`dfas-*`, `guardian-*`, `skills-types`) | **Drenyra** `packages/domain/src/drenyra/` |
| Runtime kernel implementation | **Drenyra** `apps/api/src/features/drenyra/kernel/` |
| Drenyra copies | **Deprecated mirrors** — no new DFAS code |

## Platform ↔ Product boundary

```text
Drenyra shell (MF host)  →  loads Drenyra remoteEntry.js
Drenyra web/CLI (clients)   →  DFAS / REST v0  →  kernel  →  orchestrator + engram
Drenyra os-supervisor    →  OPA gates / approvals policy (cross-repo)
```

Fase 1 (platform split): MF remote + REST API. **Fase 2 (this ADR implementation):** full DFAS WebSocket.

## Migration phases

1. **Phase 0:** Spec + domain contracts + kernel design — ✅ complete
2. **Phase 1:** Domain contracts hardened + Lexori TS loader
3. **Phase 2:** Kernel v0 + WebSocket endpoint
4. **Phase 3:** Web/CLI DFAS clients
5. **Phase 4:** Guardian + replay API
6. **Phase 5:** Public MCP surface (platform registers plugin)

## References

- [Product topology](../canon/product-topology.md)
- [DFAS Protocol Spec](../01-architecture/drenyra-fiscal-app-server-2026.md)
- [Sync playbook](../05-development/drenyra-repo-sync.md)
- [SDD Tasks](../superpowers/specs/drenyra-fiscal-app-server-tasks-2026.md)
- Drenyra [drenyra-connection.md](https://github.com/drenyra/Drenyra/blob/main/docs/cross-repo/drenyra-connection.md)
- [OpenAI Codex App Server](https://openai.com/index/unlocking-the-codex-harness/)
