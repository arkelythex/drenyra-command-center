# Drenyra — Migration to Agentic Paradigm (UI + Orchestration)
## Design Document · July 2026

> **Status:** Approved for implementation
> **Scope:** 5 phases across UI surfaces and agent orchestration
> **Philosophy:** Gentle-AI (Gentleman-Programming) — explicit rules, invisible memory, organic complexity

---

## 0. Root Cause

Both the UI duplication problem (8 features = same concept) and the orchestration opacity problem (agent status bar exposed to users) stem from the same root: **implicit rules where explicit rules are needed.**

| Layer | Symptom | Root Cause |
|-------|---------|------------|
| UI | 29 features with own routes, 8 duplicates | No explicit "board vs artifact vs tool" classification |
| Orchestration | Sub-agents decide ad-hoc when to delegate | No numerical delegation stop-rules in Geavon |
| UI | Agent status bar exposes "Validador SIRE idle" | Orchestration internals cross the user-facing boundary |
| Memory | Potential persistence only at end of flow | No per-node checkpoint rule |

---

## 1. Five Phases — Execution Order

| Phase | What | Risk | Dependencies |
|-------|------|------|-------------|
| **1** | Geavon delegation rules + UI duplicate cleanup + remove agent bar | Low | None |
| **2** | Lexori single-resolution per case + right panel → artifact feed | Medium | Phase 1 |
| **3** | Mnevori per-node persistence + resume capability | Medium | Phase 1 |
| **4** | Convert tools (banking, bills, taxation, etc.) to agent-invocable skills | High | Phase 2-3 |
| **5** | Legacy boards (ledger, evidence, invoices) final audit pass | Low | Phase 1-4 |

---

## 2. Phase 1 — Geavon Rules + UI Cleanup

### 2.1 Geavon delegation stop-rules (config, not prompt)

Create `packages/agents/src/geavon/delegation-rules.ts` with 5 numerical rules:

```typescript
export interface DelegationRule {
  id: string;
  trigger: string;
  threshold: number | string;
  action: "delegate" | "pause-and-audit" | "reroute";
}

export const DELEGATION_RULES: DelegationRule[] = [
  {
    id: "multi-voucher",
    trigger: "comprobantes_a_procesar",
    threshold: 4,           // 4+ comprobantes → delegate
    action: "delegate",
  },
  {
    id: "multi-entry",
    trigger: "asientos_propuestos",
    threshold: 2,           // 2+ asientos en distintas cuentas → require fresh review
    action: "delegate",
  },
  {
    id: "pre-submit",
    trigger: "declaracion_o_envio",
    threshold: "true",      // Siempre correr verificación adversarial antes de enviar
    action: "pause-and-audit",
  },
  {
    id: "incident",
    trigger: "inconsistencia_detectada",
    threshold: "true",      // Periodo mal sync, RUC equivocado, etc.
    action: "pause-and-audit",
  },
  {
    id: "long-session",
    trigger: "tool_calls_acumuladas",
    threshold: 20,          // 20+ tool calls sin checkpoint
    action: "reroute",      // Pausar, resumir a Mnevori, re-planificar
  },
];
```

**Files:** Create `packages/agents/src/geavon/delegation-rules.ts`. Export from `packages/agents/src/index.ts`.

### 2.2 Remove 8 duplicate UI routes

| Route to remove | Redirect to | Action |
|----------------|------------|--------|
| `/review-queue` | `/approvals` | Delete route file + remove from routeTree |
| `/review` | `/approvals` | Delete route file |
| `/inteligencia` | `/` or delete if unused | Delete route file + feature folder |
| `/threads/` + `/threads/$threadId` | `/drenyra/case/$threadId` | Delete route files (keep domain model) |
| `/cognitive-hub` equivalent (check) | `/drenyra/case/$threadId` | Remove route |
| `/drenyra/hub` (if duplicate of workspace) | `/drenyra/` | Remove route |
| `/evidence-v2` | `/evidence` | Remove feature folder |

**Files to delete/modify:**
- `apps/web/src/routes/review-queue.tsx` + `apps/web/src/routes/review-queue/`
- `apps/web/src/routes/review.tsx`
- `apps/web/src/routes/inteligencia.tsx` + `apps/web/src/features/intelligence/` (verify deps first)
- `apps/web/src/routes/threads/` (keep `/drenyra/case/$threadId`)
- `apps/web/src/features/evidence-v2/`
- Regenerate route tree: `bun run codebase:index`

### 2.3 Remove agent status bar from user UI

**Current:** The bottom bar shows `Validador SIRE idle · Revisor CPE idle · Contabilizador idle · Gestor Evidencia idle`

**Target:** Replace with aggregated progress: `3 de 4 verificaciones completas` or `Revisando...` / `Listo para tu revisión`.

**Where:** The agent status bar component lives somewhere in the agentic shell. Find and replace:
- Find: `AgentHeartbeat.tsx` or similar
- The individual agent status (`AgentPulse`) stays in Control Tower (admin board)
- User-facing area gets a single `CaseProgress` component

### 2.4 Sidebar update

Current sidebar:
```
Herramientas · Automatizaciones · Skills · Observabilidad · Control Tower
```

Target sidebar:
```
Buscar... (⌘K)
CASOS (lista)
──
📌 Ledger              → /ledger
📌 Compliance          → /compliance
📌 Aprobaciones       → /approvals
📌 Clientes            → /customers
📌 Proveedores         → /vendors
📌 Evidencia           → /evidence
──
Configuración          → /configuracion
Control Tower          → /drenyra/control-tower (admin only)
```

**Files:** `apps/web/src/components/layout/Sidebar/Sidebar.data.ts` + `AgenticSidebarNavItems.tsx`

---

## 3. Phase 2 — Lexori + Right Panel

### 3.1 Lexori single-resolution per case

- Add session-level cache keyed by `(caseId, regimenTributario, periodo)`
- First access resolves the applicable SUNAT/NIIF/PCGE rules
- Subsequent access within same case returns cached citation
- Each sub-agent receives the **exact cited text**, not a paraphrase

### 3.2 Right panel → artifact feed

Currently: fixed tabs (Ledger/Journal/Documents/Missions)

Target: chronological feed of artifacts generated during the current case session:
- Tool execution results (tables, charts, diffs)
- Approval cards
- Evidence references

**Note:** `ledger` and `evidence` as full-board views remain available via sidebar — the artifact feed is the **ephemeral session view**, not the persistent record.

---

## 4. Phase 3 — Mnevori Per-Node Persistence

### 4.1 Current state (suspect)
Each node in the phase graph (OCR → classification → validation → proposal → approval) likely persists to Mnevori at the end of the full flow.

### 4.2 Target state
Each node persists its artifact **before returning control** to Geavon:

```
OCR → persist() → return
Classification → persist() → return
Validation → persist() → return
Proposal → persist() → return
Approval → persist() → return (final)
```

### 4.3 Resume mechanism
If the process is interrupted mid-flow, the next session should:
1. Index by `(ruc, caseId, phase)` 
2. Resume from the last persisted phase
3. Not reprocess completed phases

---

## 5. Phase 4 — Tools to Skills

### 5.1 Selection order
1. **Banking** (pilot — acotado, already has API and domain entity)
2. **Bills**
3. **Taxation**
4. **Credit/Debit notes** (merge under invoices domain)
5. **Payroll**
6. **Inventory**

### 5.2 Banking pilot pattern
- Keep domain logic (`apps/api/src/features/banking/`) as-is
- Remove route `/tesoreria/banking` and `apps/web/src/features/banking/` page-level code
- Expose as skill in Geavon: `conciliar_banco()` — returns inline artifact
- The inline artifact (reconciliation table) renders in the right panel feed
- `customers` and `vendors` remain as boards (data master, not tool-invocable)

### 5.3 Phase graph not forced for simple queries
- **Simple query** (e.g., "¿cuánto pagué de IGV en enero?") → agent responds directly with Korveth deterministic calculation
- **Substantial task** (e.g., monthly close, declaration generation) → agent **suggests** activating phase graph
- The suggestion is visible but doesn't require the user to know "phase graph" exists

---

## 6. Phase 5 — Legacy Boards Final Audit

Verify each remaining board:
- **Ledger** → Book of original entry / general ledger — legal audit requirement ✅ stays as board
- **Evidence** → Audit vault — must be openable without agent ✅ stays as board
- **Invoices** → Legal record of issued documents ✅ stays as board
- **Inventory/Kardex** → SUNAT mandatory book ✅ stays as board

Remove any remaining v1/v2 duplicates (e.g., `evidence-v2` cleanup from Phase 1).

---

## 7. Verification Gates

Each phase must pass before the next begins:

- **Phase 1:** `bun run typecheck` + `bun run test` (no regressions)
- **Phase 2:** Same + manual verification that Lexori returns same citation to all sub-agents in one case
- **Phase 3:** Integration test: interrupt mid-flow, resume, verify no re-processing
- **Phase 4:** Banking skill works via chat, not via route navigation
- **Phase 5:** All boards accessible without agent, all legal requirements met

---

## 8. Non-goals (explicitly out of scope)

- Rewriting the AI swarm backend (CognitiveApprovalStore, pairing, etc.)
- Changing the Thread domain entity
- Replacing the phase graph state machine
- Migrating to a different LLM provider
- Changing the database schema

---

## 9. Files Summary by Phase

### Phase 1
| File | Action |
|------|--------|
| `packages/agents/src/geavon/delegation-rules.ts` | **CREATE** |
| `packages/agents/src/index.ts` | **EDIT** (export delegation rules) |
| `apps/web/src/routes/review-queue.tsx` | **DELETE** |
| `apps/web/src/routes/review-queue/index.tsx` | **DELETE** |
| `apps/web/src/routes/review.tsx` | **DELETE** |
| `apps/web/src/routes/inteligencia.tsx` | **DELETE** |
| `apps/web/src/features/intelligence/` | **DELETE** (verify no deps) |
| `apps/web/src/routes/threads/index.tsx` | **DELETE** |
| `apps/web/src/routes/threads/$threadId.tsx` | **DELETE** |
| `apps/web/src/features/evidence-v2/` | **DELETE** |
| `apps/web/src/components/layout/Sidebar/Sidebar.data.ts` | **EDIT** (new nav items) |
| `apps/web/src/components/layout/Sidebar/components/SidebarNavItems.tsx` | **EDIT** (if needed) |
| `apps/web/src/components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx` | **EDIT** |
| `apps/web/src/components/agentic/AgentHeartbeat.tsx` | **EDIT** (remove agent list, add progress) |
| `apps/web/src/routeTree.gen.ts` | **REGENERATE** |
| `apps/web/src/features/approvals/` | **EDIT** (absorb review-queue logic) |

### Phase 2
| File | Action |
|------|--------|
| `packages/agents/src/lexori/cache.ts` | **CREATE** or **EDIT** |
| `apps/web/src/features/drenyra-workspace/components/` | **EDIT** (right panel → artifact feed) |

### Phase 3
| File | Action |
|------|--------|
| `packages/agents/src/mnevori/` | **EDIT** (per-node persist) |

### Phase 4
| File | Action |
|------|--------|
| `apps/web/src/routes/tesoreria/banking.tsx` | **DELETE** |
| `apps/web/src/features/banking/` page code | **REMOVE** (keep domain + API) |
| `packages/agents/src/geavon/skills/banking.skill.ts` | **CREATE** |
| Same pattern for bills, taxation, credit/debit notes, payroll, inventory |

### Phase 5
| File | Action |
|------|--------|
| Verification only + any residual cleanup from Phase 1 |
