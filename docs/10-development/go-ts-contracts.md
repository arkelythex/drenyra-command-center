# Go CLI ↔ TypeScript Contract Alignment

**Última actualización:** 2026-07-05
**Propósito:** Documentar los contratos compartidos entre `apps/drenyra-cli` (Go) y los packages TypeScript, para que ambas implementaciones sigan el mismo modelo conceptual.

---

## 1. Delegation Graph — Agent Hierarchy

Ambas implementaciones definen el mismo grafo de delegación de agentes.

### Go source
`apps/drenyra-cli/internal/delegation/graph.go` → `var Agents map[string]Agent`

### TS source (canonical)
`packages/agents/src/agents/registry.ts` → `AGENT_REGISTRY`, `getAgentById()`, `getAgentsByTier()`

### Contract

```go
type Agent struct {
    ID       string   // Unique agent identifier (e.g. "fiscal-sunat-agent")
    Tier     string   // "tier0" (root) through "tier3b" (leaf sub-agent)
    Label    string   // Human-readable description
    MaySpawn []string // IDs of agents this agent can delegate to
    Parent   string   // Parent agent ID (empty for tier0)
    Leaf     bool     // True if agent cannot delegate further
}
```

```typescript
// Equivalent TS interface in packages/agents/src/agents/types.ts
interface UnifiedAgentEntry {
  id: string;
  tier: AgentTier;       // "tier0" | "tier1" | "tier2" | "tier3" | "tier3b"
  label: string;
  maySpawn?: string[];
  parent?: string;
  leaf?: boolean;
  system: AgentSystem;   // Origin system (cli-delegation, drenyra-core, etc.)
  capabilities: string[];
}
```

### Alignment status

| Agent Go ID | Agent TS ID | Status |
|---|---|---|
| drenyra-orchestrator | ✅ | Consistent |
| drenyra-sdd-orchestrator | ✅ | Consistent |
| fiscal-command-orchestrator | ✅ | Consistent |
| ai-swarm-orchestrator | ✅ | Consistent |
| latin-moderno-orchestrator | ✅ | Consistent |
| cerno-agent through capsa-agent | ✅ | Consistent |
| fiscal-sunat-agent | ✅ | Present in `registry.ts` |
| fiscal-ledger-agent | ✅ | Present in `registry.ts` |
| fiscal-reconcile-agent | ✅ | Present in `registry.ts` |
| swarm-codegen-agent | ✅ | Present in `registry.ts` |
| swarm-test-agent | ✅ | Present in `registry.ts` |
| swarm-review-agent | ✅ | Present in `registry.ts` |

---

## 2. Memory Model — Persistent Agent Memory

Ambas implementaciones usan un modelo de memoria plana estilo Hermes.

### Go source
`apps/drenyra-cli/internal/memory/` → `Snapshot`, `store.go`, `session.go`

### TS source
`packages/memory/src/` → Unified memory subsystem (post S1 consolidation)

### Contract

```go
type Snapshot struct {
    Memory        string // Core memory content (system facts)
    User          string // User-specific memory content
    MemoryBlocks  string // Hermes system-prompt block (§MEMORY)
    UserBlocks    string // Hermes system-prompt block (§USER)
    MemoryPath    string // Path to MEMORY.md file
    UserPath      string // Path to USER.md file
    MemoryUsed    int    // Characters used
    UserUsed      int
    MemoryLimit   int    // Max characters (default 2200)
    UserLimit     int    // Max characters (default 1375)
    MemoryEntries int    // Number of §-delimited entries
    UserEntries   int
}
```

### Alignment

| Concepto | Go | TS | Status |
|---|---|---|---|
| Flat-file memory (MEMORY.md) | ✅ `memory/store.go` | ✅ `@drenyra/memory` | Consistent |
| §-delimited entries | ✅ | ✅ | Consistent |
| Session snapshot | ✅ `memory/session.go` | ✅ | Consistent |
| SQLite local store | ✅ `memorystore/` | N/A (TS usa Drizzle) | ✅ Go-specific |
| History log (history.jsonl) | ✅ `history/` | ✅ `@drenyra/memory` | Consistent |

---

## 3. Workflow Catalog — Built-in Workflows

### Go source
`apps/drenyra-cli/internal/workflow/catalog.go` → `var catalog map[string]Template`

### TS source
`packages/agents/src/mastra/workflows/` → Mastra workflow definitions

### Contract

```go
type Template struct {
    ID          string // Unique workflow identifier
    Description string // Human-readable purpose
    RootAgentID string // Primary orchestrating agent
    Template    string // Prompt template with {{VARIABLES}}
}
```

### Canonical workflows

| ID | Root Agent | Purpose | Go | TS |
|---|---|---|---|---|
| architecture-check | ai-swarm-orchestrator | Check architecture boundaries | ✅ | ❌ |
| fiscal-compliance | fiscal-command-orchestrator | Run fiscal compliance check | ✅ | ❌ |
| code-generation | ai-swarm-orchestrator | Generate code from spec | ✅ | ❌ |
| test-generation | ai-swarm-orchestrator | Generate tests | ✅ | ❌ |
| code-review | ai-swarm-orchestrator | Review code changes | ✅ | ❌ |
| document-generation | latin-moderno-orchestrator | Generate documentation | ✅ | ❌ |
| evidence-gathering | fiscal-command-orchestrator | Gather audit evidence | ✅ | ❌ |
| reconciliation | fiscal-command-orchestrator | Reconcile bank/ledger | ✅ | ❌ |
| tax-calculation | fiscal-command-orchestrator | Calculate tax obligations | ✅ | ❌ |
| monthly-close | fiscal-command-orchestrator | Execute monthly close | ✅ | ❌ |

**Hallazgo:** TS solo tiene `compliance-check.ts`. Go tiene 10 workflows que no existen en TS. Esto es asimétrico: Go implementa workflows que TS no conoce.

**Recomendación:** Evaluar si los workflows deben existir en TS (si el backend TS debe ejecutarlos) o si son solo del CLI. Si son del CLI, documentar como Go-specific en lugar de faltantes.

---

## 4. Router — Model/Provider Routing

### Go source
`apps/drenyra-cli/internal/router/router.go`

### TS source
`packages/ai/src/providers/model-router-types.ts`

### Contract

```go
type RouterConfig struct {
    Provider    string // "openai" | "anthropic" | "google" | "deepseek" | "openrouter"
    Model       string // Model identifier (e.g. "gpt-4o", "claude-sonnet-4")
    MaxTokens   int
    Temperature float64
    Capability  string // "CHAT" | "CODING" | "ANALYSIS" | etc.
}
```

```typescript
// Equivalent TS in packages/ai/src/providers/model-router-types.ts
type ModelRegistration = {
  providerName: ProviderName;
  modelName: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  // ...
}
```

### Alignment status

| Field | Go | TS | Status |
|---|---|---|---|
| Provider | ✅ `Provider` string | ✅ `ProviderName` union | Consistent |
| Model | ✅ `Model` string | ✅ `modelName` string | Consistent |
| MaxTokens | ✅ | ✅ | Consistent |
| Temperature | ✅ `Temperature` float | ✅ (in request builder) | Consistent |
| Capability | ✅ `Capability` string | ✅ `ModelCapability` union | Consistent |

---

## 5. Harness — Agent Execution

### Go source
`apps/drenyra-cli/internal/harness/` → HTTP client to TS harness API

### TS source
`packages/agents/src/harness/` → `DrenyraHarness`, `AgentHandler`

### Contract

```go
type HarnessRequest struct {
    AgentID string                 // Target agent
    Input   string                 // User input / task description
    Context map[string]interface{} // Tenant context (companyId, RUC, etc.)
}

type HarnessResponse struct {
    Output    string `json:"output"`
    AgentID   string `json:"agentId"`
    Status    string `json:"status"`    // "completed" | "failed" | "requires_approval"
    Error     string `json:"error,omitempty"`
    DurationMs int64 `json:"durationMs,omitempty"`
}
```

### Alignment

| Field | Go | TS | Status |
|---|---|---|---|
| Agent ID | ✅ | ✅ | Consistent |
| Input/Task | ✅ | ✅ | Consistent |
| Context (tenant) | ✅ | ✅ | Consistent |
| Response shape | ✅ | ✅ | Consistent |

---

## Audit Results

### ✅ Aligned
- **Delegation Graph**: Agents Go ↔ TS están sincronizados (12/12 agentes)
- **Memory Model**: Hermes-style flat-file memory consistente entre Go y TS
- **Router**: Model/provider routing contracts consistentes
- **Harness**: Agent execution request/response shape consistente

### ❌ Misalignment found
- **Workflows**: Go tiene 10 workflows que TS no conoce. Solo `compliance-check` existe en TS.
  - **Riesgo**: Comportamiento asimétrico — el CLI puede ejecutar workflows que el backend TS no entiende
  - **Recomendación inmediata**: Documentar qué workflows deben vivir en TS vs. cuáles son Go-only

### Recommended next step

Crear un ADR (Architecture Decision Record) sobre el modelo de workflows:
- ¿Los workflows deben ejecutarse en Go (CLI) o en TS (API)?
- ¿O ambos? Si ambos, crear definiciones Mastra en TS para los 10 faltantes.
