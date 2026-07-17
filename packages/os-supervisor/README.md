# @arkelythex/os-supervisor

**Last updated:** 2026-06-24

The OS Supervisor is the cross-vertical AI orchestration foundation of the ARKELYTHEX Operating System — routing user intents to vertical agents, enforcing approval policies, providing shared knowledge retrieval, and recording every agent execution for audit.

---

## Tutorial — First integration in 2 minutes

The fastest way to use the OS Supervisor in your code:

```typescript
import {
  OSSupervisorAgent,
  VerticalAgentRegistry,
  GeneralizedIntentDetector,
  createDrenyraAgent,
} from "@arkelythex/os-supervisor";

// 1. Register vertical agents
const registry = new VerticalAgentRegistry();
registry.register(createDrenyraAgent());

// 2. Configure intent detection
const detector = new GeneralizedIntentDetector();
detector.registerVerticalRules("drenyra", [
  { pattern: /invoice|factura|igv|sunat/i, action: "fiscal:query", priority: 10 },
  { pattern: /./, action: "general", priority: 1 },
]);

// 3. Create the supervisor
const supervisor = new OSSupervisorAgent(registry, detector);

// 4. Route an intent
const result = await supervisor.handleInput("check invoice status", {
  tenantId: "t1",
  userId: "u1",
  organizationId: "o1",
  companyId: "c1",
  ruc: "20123456789",
  traceId: "tr-1",
  vertical: "drenyra",
});

console.log(result.success);   // true
console.log(result.vertical);  // "drenyra"
```

> **What just happened?** The supervisor detected `"check invoice status"` as a Drenyra fiscal intent, resolved the `drenyra-main` agent from the registry, delegated execution, and returned the result with traceability metadata.

---

## Explanation — Why the OS Supervisor exists

### The two-brains architecture

ARKELYTHEX follows a **two-brains architecture** (ADR-026):

| Brain | Technology | Responsibility |
|-------|-----------|----------------|
| **Core Fiscal Brain** | Bun + Elysia + Drizzle | Synchronous fiscal logic, invoice lifecycle, SUNAT compliance, audit trails |
| **AI Engine Brain** | Python + FastAPI + LangGraph | Asynchronous AI pipeline: classification, reconciliation, anomaly detection |

The **OS Supervisor** sits above both brains as a *meta-orchestrator*. It doesn't replace either brain — it routes intents to the appropriate vertical agent, which may draw on either brain or both.

### Why not just call agents directly?

Five verticals (Drenyra, Andino, Admin, Edge, Kuse) each have their own agent. Without a supervisor, every caller needs to know:

- Which vertical handles what
- What approval level each action requires
- Where to find relevant knowledge
- How to trace execution

The OS Supervisor centralizes these cross-cutting concerns into a single, testable entry point.

---

## How-to guides

### Configure approval tiers

Each vertical agent declares an `approvalLevel`. The `OSApprovalGateEngine` enforces it:

```typescript
import {
  OSApprovalGateEngine,
  InMemoryApprovalStore,
} from "@arkelythex/os-supervisor";

const store = new InMemoryApprovalStore();
const gate = new OSApprovalGateEngine(store);
const supervisor = new OSSupervisorAgent(registry, detector, {
  approvalGate: gate,
});

const result = await supervisor.handleInput("launch drone", context);
// result.approvalRequired === true
// result.requestId → pass to gate.approve() or gate.reject()

await gate.approve(result.requestId, "user-42", "Mission authorized");
```

| Level | Behavior | Example |
|-------|----------|---------|
| `auto` | No checks, executes immediately | List invoices |
| `notify` | Executes, logs notification | Create draft invoice |
| `gate` | Blocks, requires human approval | Launch drone |
| `policy_gate` | Blocks, requires approval + governance review | Submit SIRE filing |

### Wire OPA for declarative policies

The `OPAPolicyEngine` delegates to an Open Policy Agent server:

```typescript
import { OPAPolicyEngine } from "@arkelythex/os-supervisor/policy";

const opa = new OPAPolicyEngine({
  opaUrl: process.env.OPA_URL ?? "http://localhost:8181",
});

const gate = new OSApprovalGateEngine(store, opa);

// OPA is optional — falls back to built-in rules when unavailable
```

OPA policies live in `policies/*.rego` and are loaded on OPA server startup.

### Query the RAG engine

The shared RAG engine provides per-namespace knowledge retrieval:

```typescript
import { InMemoryRagStore, OSKnowledgeNamespace } from "@arkelythex/os-supervisor/rag";

const store = new InMemoryRagStore();
await store.index({
  id: "doc_1",
  namespace: OSKnowledgeNamespace.SUNAT,
  source: "sunat-law",
  title: "IGV Rate",
  content: "IGV rate is 18% on taxable operations",
});

const results = await store.query({
  query: "What is IGV?",
  namespace: OSKnowledgeNamespace.SUNAT,
  maxResults: 5,
});
```

For production, use `QdrantRagStore` with Ollama embeddings (falls back to keyword scoring when embeddings unavailable).

### Enable traceability

```typescript
import { InMemoryAgentRunStore } from "@arkelythex/os-supervisor/traceability";

const runStore = new InMemoryAgentRunStore();
const supervisor = new OSSupervisorAgent(registry, detector, {
  runStore,  // enables audit trail
});

// Each execution records:
// - id, vertical, userId, prompt, response
// - tools, approvalStatus, riskLevel
// - tokensUsed, durationMs, timestamp
```

### Wire the event bus

```typescript
import { PlatformEventBus } from "@arkelythex/core/events";

const bus = new PlatformEventBus();
const gate = new OSApprovalGateEngine(store, opa, bus);

const supervisor = new OSSupervisorAgent(registry, detector, {
  approvalGate: gate,
  eventBus: bus,
});

// Events: os.agent.executed, os.approval.requested, os.approval.resolved
```

For production, use `NatsPlatformEventBus` for NATS JetStream persistence.

---

## Reference

### Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OSSupervisorAgent                         │
│  handleInput(input, context)                                 │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ IntentDetect  │→ │ Registry       │→ │ Agent.execute  │  │
│  │ (regex → OS)  │  │ (OSAgentPort)  │  │ (LangChain)    │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
│                          │                    │              │
│                          ▼                    ▼              │
│              ┌────────────────────┐  ┌───────────────┐      │
│              │ OSApprovalGateEngine│ │ IAgentRunStore │      │
│              │ (4 tiers + OPA)    │  │ (traceability) │      │
│              └────────────────────┘  └───────────────┘      │
│                          │                    │              │
│                          ▼                    ▼              │
│              ┌────────────────────┐  ┌───────────────┐      │
│              │ IRagStore          │  │ PlatformEventBus     │
│              │ (6 namespaces)     │  │ (observability)│     │
│              └────────────────────┘  └───────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Modules

| Path | Responsibility | Status |
|------|---------------|--------|
| `src/supervisor/` | `OSSupervisorAgent` — intent routing + delegation | ✅ Real |
| `src/intent/` | `GeneralizedIntentDetector` — regex intent resolution | ✅ Real |
| `src/registry/` | `VerticalAgentRegistry` — agent discovery | ✅ Real |
| `src/agents/` | 5 LangChain agents (Drenyra, Andino, Admin, Edge, Kuse) with lazy `ChatAnthropic` | ✅ Real |
| `src/approval/` | `OSApprovalGateEngine` + `InMemoryApprovalStore` — 4-tier approval | ✅ Real |
| `src/policy/` | `OPAPolicyEngine` — OPA policy delegation with fallback | ✅ Real |
| `src/rag/` | `InMemoryRagStore` + `QdrantRagStore` + `EmbeddingService` — 6 namespaces | ✅ Real |
| `src/traceability/` | `InMemoryAgentRunStore` — execution audit store | ✅ Real |
| `src/telemetry/` | OpenTelemetry tracing (`traceSupervisor`, `traceApproval`, `traceRagQuery`, `traceAgentExecution`) | ✅ Real |
| `src/types/` | All OS type definitions (agent, approval, vertical, traceability) | ✅ Real |
| `policies/` | 6 Rego policy files (drenyra, andino, admin, edge, kuse, os) | ✅ Real |

### Vertical agents

| Agent | ID | Capabilities | Approval level |
|-------|----|-------------|----------------|
| **Drenyra** | `drenyra-main` | fiscal:invoice, fiscal:tax, fiscal:sunat, fiscal:reporting | varies by action |
| **Andino Lab** | `andino-main` | drone:telemetry, drone:mission, crop:analysis, field:monitoring | varies by action |
| **Admin** | `admin-main` | hr:employee, hr:contract | varies by action |
| **Edge Traz Agro** | `edge-main` | trace:event, provenance:verify | varies by action |
| **Kuse Cowork** | `kuse-main` | cowork:booking, cowork:space | varies by action |

Agents use **lazy model initialization**: `ChatAnthropic` is only instantiated when the agent is first called, and gracefully degrades to an error message when `ANTHROPIC_API_KEY` is unset.

### RAG namespaces

| Namespace | Content |
|-----------|---------|
| `sunat` | Tax regulations, UBL 2.1, IGV rules (Drenyra) |
| `drone` | Drone operations, flight zones, regulations (Andino) |
| `labor` | Labor law, HR policies, employee contracts (Admin) |
| `policies` | Internal customer policies |
| `procedures` | Operational procedures |
| `catalog` | Product/service catalog |

### Environment variables

| Variable | Required | Default | Used by |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | No | — | LangChain agents (graceful degradation) |
| `OPA_URL` | No | `http://localhost:8181` | `OPAPolicyEngine` |
| `QDRANT_URL` | No | `http://localhost:6333` | `QdrantRagStore` |
| `QDRANT_API_KEY` | No | — | `QdrantRagStore` (Cloud auth) |
| `OLLAMA_URL` | No | `http://localhost:11434` | Embedding service |
| `EMBEDDING_MODEL` | No | `nomic-embed-text` | Embedding service |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | `http://localhost:4318/v1/traces` | OpenTelemetry exporter |
| `NODE_ENV` | No | `development` | Telemetry environment |

### Exports

```typescript
// Main entry point
import {
  OSSupervisorAgent,
  OSSupervisorOptions,
  OSSupervisorResult,

  GeneralizedIntentDetector,
  IntentRule,

  VerticalAgentRegistry,

  createDrenyraAgent,
  createAndinoAgent,
  createAdminAgent,
  createEdgeAgent,
  createKuseAgent,

  OSApprovalGateEngine,
  InMemoryApprovalStore,
  OSApprovalLevel,
  OSApprovalRequest,

  OPAPolicyEngine,

  InMemoryRagStore,
  QdrantRagStore,
  QdrantRagStoreConfig,
  OSKnowledgeNamespace,
  OSRagDocument,
  OSRagQuery,
  OSRagSearchResult,
  IRagStore,

  InMemoryAgentRunStore,
  OSAgentRun,
  AgentRunStats,

  OSAgentPort,
  OSAgentContext,
  OSAgentResult,
  OSAgentMetrics,
  OSIntent,
  VerticalType,
} from "@arkelythex/os-supervisor";

// Subpath exports
export {
  OPAPolicyEngine,
  PolicyEvaluationInput,
  PolicyEvaluationResult,
} from "@arkelythex/os-supervisor/policy";
```

### Public API types

| Type | Description |
|------|-------------|
| `OSAgentPort<TTask, TOutput>` | Interface every vertical agent implements: `id`, `name`, `description`, `vertical`, `capabilities`, `approvalLevel?`, `execute()` |
| `OSAgentContext` | Context envelope: `tenantId`, `userId`, `organizationId`, `companyId`, `ruc`, `traceId`, `vertical`, `rag?`, `runStore?` |
| `OSAgentResult<T>` | Result envelope: `success`, `data`, `metrics`, `errors`, `warnings` |
| `OSIntent` | Detected intent: `vertical`, `action`, `confidence`, `originalInput` |
| `VerticalType` | Enum: `drenyra`, `andino`, `admin`, `edge-traz-agro`, `kuse` |
| `OSApprovalLevel` | `"auto"` \| `"notify"` \| `"gate"` \| `"policy_gate"` |
| `OSKnowledgeNamespace` | `"sunat"` \| `"drone"` \| `"labor"` \| `"policies"` \| `"procedures"` \| `"catalog"` |

---

## Testing

Run all 111 tests:

```bash
bun vitest run packages/os-supervisor
```

Watch mode:

```bash
bun vitest packages/os-supervisor
```

Coverage (from the repo root):

```bash
bun vitest run --coverage packages/os-supervisor
```

### Test categories

| Test file | What it covers |
|-----------|---------------|
| `tests/intent-detector.test.ts` | Regex matching, priority ordering, fallback to Drenyra |
| `tests/vertical-registry.test.ts` | Agent registration, resolution, duplicate detection |
| `tests/supervisor-agent.test.ts` | Full routing loop, empty input, fallback behavior |
| `tests/agent-port-interface.test.ts` | Interface contract compliance |
| `tests/approval-gate.test.ts` | 4-tier evaluation, state transitions |
| `tests/approval-state-machine.test.ts` | Approve/reject/cancel lifecycle |
| `tests/opa-engine.test.ts` | OPA query, fallback rules, health check |
| `tests/rag-store.test.ts` | Index, query, remove, list, clear |
| `tests/agent-run-store.test.ts` | Record, getById, list, stats |
| `tests/nats-event-bridge.test.ts` | Event bus integration |
| `tests/e2e-full-chain.test.ts` | All 5 verticals end-to-end through supervisor + gate + store |
| `src/__tests__/types.test.ts` | Type-level tests |
| `src/__tests__/cross-vertical.integration.test.ts` | Multi-vertical routing |
| `src/__tests__/nats-bridge.integration.test.ts` | NATS bridge integration |
| `src/agents/__tests__/agent-stubs.test.ts` | Agent factory compliance |
| `src/approval/__tests__/approval-gate-engine.test.ts` | Gate engine edge cases |
| `src/approval/__tests__/approval-store.test.ts` | Store state machine |
| `src/intent/__tests__/intent-detector.test.ts` | Pattern matching |
| `src/policy/__tests__/opa-policy-engine.test.ts` | Policy evaluation |
| `src/policy/__tests__/opa-integration.test.ts` | OPA integration |
| `src/rag/__tests__/in-memory-rag-store.test.ts` | In-memory store |
| `src/rag/__tests__/qdrant-rag-store.test.ts` | Qdrant store |
| `src/rag/__tests__/rag-types.test.ts` | Type-level RAG tests |
| `src/registry/__tests__/vertical-agent-registry.test.ts` | Registry edge cases |
| `src/supervisor/__tests__/os-supervisor-agent.test.ts` | Supervisor edge cases |
| `src/supervisor/__tests__/event-bus-integration.test.ts` | Bus wiring |
| `src/traceability/__tests__/agent-run-store.test.ts` | Run store |

### Key properties

- **111 tests, all passing** — run `bun vitest run packages/os-supervisor` to verify
- No external services needed for core tests — `InMemory*` implementations allow pure unit testing
- Integration tests (`opa-integration`, `nats-bridge`, `full-chain`) require Docker services
- OPA tests gracefully skip when OPA server is unavailable

---

## Related documents

| Document | Location | Content |
|----------|----------|---------|
| **ADR Index** | [docs/superpowers/adr/README.md](../../docs/superpowers/adr/README.md) | 15 ADRs (OS-001 to OS-015) |
| **OS Design Doc** | [docs/superpowers/specs/2026-06-23-arkelythex-os-superapp-design.md](../../docs/superpowers/specs/2026-06-23-arkelythex-os-superapp-design.md) | Full architecture design |
| **ADR-OS-007** | ../../docs/superpowers/adr/ | Approval gate architecture |
| **ADR-OS-010** | ../../docs/superpowers/adr/ | OPA policy architecture |
| **ADR-026** | ../../docs/adr/ | Two-brains architecture |
| **SDK Package** | [packages/sdk/README.md](../sdk/README.md) | `@arkelythex/sdk` for vertical integrations |
| **Andino Bridge** | [packages/andino-bridge/README.md](../andino-bridge/README.md) | NATS bridge for Andino vertical |
| **Implementation Plans** | [docs/superpowers/plans/](../../docs/superpowers/plans/) | Phase plans F0–F7 |
