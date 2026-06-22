---
last-verified: 2026-06-20
source-of-truth: packages/agent-memory/package.json
auto-generated: false
---

# @arkelythex/agent-memory

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

Scoped memory store utilities for ARKELYTHEX agent sessions. This package gives agents a persistence boundary so they can remember what they learned across turns — without coupling to any specific storage backend.

## Purpose

`@arkelythex/agent-memory` provides the persistence boundary used by agent orchestration code to save and search agent observations without coupling callers to a specific storage backend.

The package keeps memory records scoped by agent, session, organization, company, and RUC context so Drenyra workflows can remain evidence-first and tenant-aware.

## Exports

```ts
export { InMemoryAgentMemoryStore } from "@arkelythex/agent-memory";
export { createMemoryApi } from "@arkelythex/agent-memory";
```

## Storage implementations

- `InMemoryAgentMemoryStore` — deterministic in-process store for tests and local orchestration.
- `BunSqliteAgentMemoryStore` — internal Bun SQLite-backed store for local durable sessions.

## Usage

```ts
import {
	InMemoryAgentMemoryStore,
	createMemoryApi,
} from "@arkelythex/agent-memory";

const store = new InMemoryAgentMemoryStore();
const memory = createMemoryApi(store);

await memory.save({
	agentId: "drenyra.supervisor",
	scope: {
		organizationId: "org_001",
		companyId: "company_001",
		companyRuc: "20608451231",
	},
	type: "observation",
	content: "Invoice evidence requires human approval before SUNAT submission.",
	metadata: { source: "supervisor-review" },
});
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `test` | `vitest run` | Runs store and API tests. |
| `typecheck` | `tsc --noEmit` | Verifies package TypeScript contracts. |

## Quick Reference

| Necesidad | Qué usar |
|-----------|----------|
| Guardar una observación de agente | `memory.save({ agentId, scope, type, content })` |
| Buscar memorias previas | `memory.search({ query, scope })` |
| Sesiones locales persistentes | `BunSqliteAgentMemoryStore` |
| Tests | `InMemoryAgentMemoryStore` |

## Safety notes

- Do not store secrets, production credentials, or raw customer-sensitive documents in agent memory.
- Treat AI-produced memories as advisory evidence, not automatic fiscal decisions.
- Material fiscal actions still require explicit human approval.
