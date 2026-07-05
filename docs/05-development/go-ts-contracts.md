# Go ↔ TypeScript Shared Contracts

**Última actualización:** 2026-07-04

> Este documento define los contratos compartidos entre el Go CLI (`apps/drenyra-cli/`) y los packages TypeScript del backend. Ambas implementaciones deben respetar estos contratos — no la implementación particular de cada lado.

---

## 1. Agent Delegation Graph

**Go:** `internal/delegation/graph.go` — `Agent` struct, `Agents` map
**TS:** `packages/domain/src/agents/registry.ts` — `AgentRegistry`, `agentRegistry`

### Contrato compartido

```text
Agent {
  id: string          // Stable kebab-case (e.g. "fiscal-sunat-agent")
  tier: string        // "tier0" | "tier1" | "tier2" | "tier3" | "tier3b"
  label: string       // Human-readable description
  maySpawn: string[]  // Agent IDs this agent can delegate to
  parent?: string     // Parent agent ID (optional for root)
  leaf?: boolean      // True if cannot spawn children
}
```

### Reglas

- Los agent IDs deben coincidir exactamente entre Go y TS
- `maySpawn` define el grafo de delegación — no agregar edges que no existan en el otro lado
- El tier define profundidad máxima de delegación (tier0 = root, tier3b = leaf)

---

## 2. Memory Model

**Go:** `internal/memory/`, `internal/memorystore/`
**TS:** `packages/memory/src/` (`@drenyra/memory`)

### Contrato compartido — MemoryRecord

```text
MemoryRecord {
  id: string
  scope: "agent" | "session" | "global"
  key: string
  value: string
  metadata?: Record<string, unknown>
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Contrato compartido — SessionStore

```text
SessionStore {
  saveRunState(runId, state): Promise<void>
  getRunState(runId): Promise<RunState | null>
  listRunStates(filter): Promise<RunState[]>
  appendEvent(runId, event): Promise<void>
  getEvents(runId): Promise<Event[]>
}
```

### Notas de implementación

| Aspecto        | Go                                                                     | TS                                               |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| Persistencia   | SQLite via modernc.org/sqlite (`drenyra.db`) + flat-file (`MEMORY.md`) | SQLite via `better-sqlite3` + in-memory fallback |
| Memoria agente | Hermes-style flat-file con `§` delimitador                             | `MemoryStore` con interfaces unificadas          |
| Sesiones       | `history.jsonl` append-log                                             | `SqliteSessionStore` en `@drenyra/memory`     |
| Búsqueda       | FTS5 en SQLite local                                                   | FTS5 en SQLite local (misma estrategia)          |

---

## 3. Workflow Catalog

**Go:** `internal/workflow/catalog.go` — `Template` struct, `catalog` map
**TS:** `packages/drenyra-orchestrator/src/mastra/workflows/` — Mastra workflows

### Contrato compartido — Workflow Template

```text
WorkflowTemplate {
  id: string              // Stable kebab-case
  description: string     // One-line purpose
  rootAgentId: string     // Agent that starts this workflow
  template: string        // Prompt template with {{CONTEXT}} placeholder
}
```

### Workflows canónicos

| ID                   | Go              | TS (Mastra)                  | Descripción                   |
| -------------------- | --------------- | ---------------------------- | ----------------------------- |
| `architecture-check` | ✅ `catalog.go` | —                            | Check architecture boundaries |
| `code-review`        | ✅ `catalog.go` | —                            | AI code review                |
| `fiscal-analysis`    | —               | ✅ `complianceCheckWorkflow` | SUNAT compliance              |
| `sire-report`        | —               | ✅ (planned)                 | SIRE electronic books         |

> **Nota:** Go tiene ~10 workflows definidos como templates de prompt. TS tiene workflows implementados como Mastra state machines. No hay duplicación de implementación — son enfoques complementarios. El catálogo de IDs debe mantenerse sincronizado.

---

## 4. LLM Model Router

**Go:** `internal/router/router.go` — `ResolvedModel`, `Resolve()`
**TS:** `packages/ai/src/providers/model-router-types.ts` — `ModelCapability`, `ModelRegistration`

### Contrato compartido — Model Resolution

```text
ResolvedModel {
  agentId: string
  model: string           // Model name (e.g. "gpt-5.3-codex")
  provider: string        // Provider name (e.g. "openai", "anthropic")
  reasoningEffort?: string // "low" | "medium" | "high"
  fallback?: string[]     // Fallback model chain
}
```

### Proveedores compartidos

| Provider   | Go               | TS                             |
| ---------- | ---------------- | ------------------------------ |
| openai     | ✅ `config.yaml` | ✅ `@drenyra/ai`            |
| anthropic  | ✅ `config.yaml` | ✅ `@drenyra/ai`            |
| google     | ✅ `config.yaml` | ✅ `@drenyra/ai`            |
| deepseek   | ✅ `config.yaml` | ✅ `@drenyra/ai`            |
| openrouter | ✅ `config.yaml` | ✅ `@drenyra/ai/openrouter` |

---

## 5. Harness HTTP API

**Go:** `internal/harness/client.go` — HTTP client → `@drenyra/harness` API
**TS:** `apps/api/src/features/drenyra-harness/harness.routes.ts`

### API Surface

```text
POST /harness/execute
  Body: { task: string, rootAgentId?: string, autoSpawn?: boolean, metadata?: object }
  Response: { traceId, rootAgentId, status, tree, executiveSummary }

POST /harness/spawn
  Body: { agentId: string, task: string, depth?: number, parentRunId?: string }
  Response: { runId, agentId, status, result?, children? }

GET  /harness/agents
  Response: { agents: Agent[], maxDepth: number }
```

---

## Mantenimiento

1. Este documento se actualiza cuando se cambia cualquiera de los contratos compartidos
2. Los PRs que toquen `internal/delegation/`, `internal/memory/`, `internal/workflow/`, `internal/router/` en Go DEBEN verificar este documento
3. Los PRs que toquen `packages/agents/`, `packages/memory/`, `packages/ai/` en TS DEBEN verificar este documento
4. Nuevos workflows en Go deben tener su ID registrado aquí antes de merge
