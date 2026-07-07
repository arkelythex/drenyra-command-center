# Drenyra — Migration to Agentic Paradigm (UI + Orchestration)
## Design Document · July 2026

> **Status:** Approved with corrections
> **Scope:** 7 phases across UI surfaces and agent orchestration
> **Philosophy:** Gentle-AI (Gentleman-Programming) — explicit rules, invisible memory, organic complexity
> **Root cause (record for project kickoff):** Both the UI duplication problem (8 features = same concept) and the orchestration opacity problem (agent status bar exposed to users) stem from the same root: **implicit rules where explicit rules are needed.** In the UI, each feature was created from scratch instead of extending an existing one. In orchestration, each sub-agent decides ad-hoc when to delegate. Same pattern, two layers. The fix is the same in both: **write the rule once, as config, not as prompt instructions that each agent interprets differently.**

---

## 0. Root Cause (keep this visible for the project)

| Layer | Symptom | Root Cause |
|-------|---------|------------|
| UI | 29 features with own routes, 8 duplicates | No explicit "board vs artifact vs tool" classification |
| Orchestration | Sub-agents decide ad-hoc when to delegate | No numerical delegation stop-rules in Geavon |
| UI | Agent status bar exposes "Validador SIRE idle" | Orchestration internals cross the user-facing boundary |
| Memory | Potential persistence only at end of flow | No per-node checkpoint rule |

**The same pattern repeats at every layer:** implicit decisions where explicit rules should exist. The migration makes every layer explicit — not by adding ceremony, but by writing each rule exactly once, in config, so every component refers to the same source of truth.

---

## 1. Seven Phases — Corrected Sequencing

| Phase | What | Risk | Gate before next |
|-------|------|------|-----------------|
| **0** | Lexori audit + forbidden-terms CI guardrail | Low/Medium | Auditoría documentada con resultado explícito. Si hay inconsistencia de norma entre sub-agentes → se resuelve antes de seguir. CI guardrail activo y probado. |
| **1** | Geavon rules (config) + remove 8 duplicate routes | Low | Correr 5-10 casos reales con las reglas nuevas. Comparar comportamiento contra el anterior. NO tocar barra de agentes todavía. |
| **1.5** | Replace agent bar → aggregated progress; move detail to Control Tower | Medium | Verificar que el progreso agregado NUNCA "miente" respecto al detalle. Correr en paralelo unos días si es posible. |
| **2** | Right panel: fixed tabs → artifact feed | Low | — |
| **3** | Mnevori per-node persistence + resume capability | Medium | Definir qué pasa si se reanuda un caso después de que cambió la norma aplicable (edge case de versionado que la fase 0 detectó). |
| **4** | Tools → skills (one at a time) | High | Criterio de aceptación explícito por tool migrada: delegación se dispara correctamente, artifact se renderiza bien, latencia aceptable — antes de migrar la siguiente. |
| **5** | Boards final audit (Ledger, Evidence, Invoices, Kardex) + approval-hub cross-case | Low | — |

> **Note on Phase 0 placement:** Phase 0 (Lexori audit) goes first because it has legal/fiscal risk. If Validador SIRE and Contabilizador are already applying different readings of the same SUNAT regulation within the same case — that's a fiscal accuracy bug with legal exposure, not an architecture topic. If it surfaces, everything else waits until it's fixed.

---

## 2. Phase 0 — Lexori Audit + CI Guardrail

### 2.1 Lexori audit

**Objective:** Verify that Lexori resolves applicable SUNAT/NIIF/PCGE rules **once per case**, and that every sub-agent within that case receives the **same exact citation** — not a re-interpretation.

**Method:**
1. Instrument a test case that involves 3+ sub-agents (e.g., Validador SIRE + Contabilizador + Gestor Evidencia)
2. Log the regulation citation each sub-agent receives
3. Compare: are they byte-identical? If not, which sub-agent diverged and why?
4. If divergence exists: document which regulation, which sub-agent, and the delta

**Outcome options:**
- **Clean:** All sub-agents receive identical citations. Lexori works as designed. Proceed to Phase 1.
- **Divergence found:** Fix the resolution pipeline before any other phase. The fix may involve adding a session-level cache keyed by `(caseId, regimenTributario, periodo)`, or ensuring Lexori returns the citation as a value object rather than letting each sub-agent re-query.

### 2.2 Forbidden-terms CI guardrail

**Objective:** Prevent English/orchestration-internal terms from appearing in user-facing UI copy.

**Implementation:**
- Add a script: `scripts/ci/check-forbidden-terms.ts`
- Forbidden terms list (expand as needed):
  - `swarm` / `Swarm`
  - `worktree` / `Worktree`
  - `idle`
  - `agent` (in user-facing UI context — allow in code/comments)
  - `cognitive` / `Cognitive`
  - `orchestrator` / `Orchestrator`
  - Any English term that names an internal component: `Ledger` (as displayed text, not route), `Gateway`, `Hub`, `Pipeline`
- The script scans `apps/web/src/**/*.tsx` and `apps/web/src/**/*.ts` for these terms in JSX string literals, excluding:
  - Route paths
  - Code comments
  - Test files
  - The copy registry if one exists
- Fail the build (`process.exit(1)`) if any term is found outside allowed locations
- Add to `package.json` as `"ci:forbidden-terms": "bun scripts/ci/check-forbidden-terms.ts"` and run it in CI

**Files to create:** `scripts/ci/check-forbidden-terms.ts`

---

## 3. Phase 1 — Geavon Rules + UI Route Cleanup

### 3.1 Geavon delegation stop-rules (config, not prompt)

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
    threshold: 4,
    action: "delegate",
  },
  {
    id: "multi-entry",
    trigger: "asientos_propuestos",
    threshold: 2,
    action: "delegate",
  },
  {
    id: "pre-submit",
    trigger: "declaracion_o_envio",
    threshold: "true",
    action: "pause-and-audit",
  },
  {
    id: "incident",
    trigger: "inconsistencia_detectada",
    threshold: "true",
    action: "pause-and-audit",
  },
  {
    id: "long-session",
    trigger: "tool_calls_acumuladas",
    threshold: 20,
    action: "reroute",
  },
];
```

**Files:** Create `packages/agents/src/geavon/delegation-rules.ts`. Export from `packages/agents/src/index.ts`.

### 3.2 Remove 8 duplicate UI routes

| Route to remove | Redirect to | Action |
|----------------|------------|--------|
| `/review-queue` | `/approvals` | Delete route file + remove from routeTree |
| `/review` | `/approvals` | Delete route file |
| `/inteligencia` | `/` or delete if unused | Delete route file + feature folder |
| `/threads/` + `/threads/$threadId` | `/drenyra/case/$threadId` | Delete route files (keep domain model) |
| `/drenyra/hub` (if duplicate of workspace) | `/drenyra/` | Remove route |
| `/evidence-v2` | `/evidence` | Remove feature folder |
| `/cognitive-hub` route (if exists) | remove | Remove route |

**Keep:** The underlying components (ToolApprovalCard, ToolExecutionTimeline, HubCommandDock components) — they are shared logic, not duplicates. Only remove the route/page that wraps them.

**Files to delete/modify:**
- `apps/web/src/routes/review-queue.tsx` + `apps/web/src/routes/review-queue/`
- `apps/web/src/routes/review.tsx`
- `apps/web/src/routes/inteligencia.tsx` + `apps/web/src/features/intelligence/` (verify deps first)
- `apps/web/src/routes/threads/` (keep `/drenyra/case/$threadId`)
- `apps/web/src/features/evidence-v2/`
- Regenerate route tree: `bun run codebase:index`

### 3.3 Gate: validate against real cases

Before Phase 1 is considered done:
1. Run 5-10 real cases through the system with the new delegation rules
2. Compare behavior against previous (log-based comparison)
3. Document any case where the rules fired incorrectly (false positive) or failed to fire (false negative)
4. Only proceed to Phase 1.5 when false negative rate is 0 and false positive rate is documented

### 3.4 What we do NOT do in Phase 1

- Do NOT touch the agent status bar in user UI
- Do NOT change sidebar nav items yet
- Do NOT redesign the right panel

---

## 4. Phase 1.5 — Agent Bar Replacement

### 4.1 Replace agent status bar with aggregated progress

**Current:** Bottom bar shows `Validador SIRE idle · Revisor CPE idle · Contabilizador idle · Gestor Evidencia idle`.

**Target:** User-facing area shows a single `CaseProgress` component: `3 de 4 verificaciones completas` or `Revisando...` / `Listo para tu revisión`.

### 4.2 Move detail to Control Tower

The individual agent status (`AgentPulse`, detailed per-agent state) moves to Control Tower — an admin/technical board visible to the firm admin, not to the everyday accountant.

### 4.3 Gate: parallel run verification

Before switching over:
1. Run CaseProgress alongside the detailed bar (hidden behind a dev flag)
2. Compare: does CaseProgress ever show a state that contradicts the detail?
3. Only remove the detailed bar when 0 contradictions are observed

The detailed bar code stays in the repo (in Control Tower) — it's not deleted, just relocated.

---

## 5. Phase 2 — Right Panel: Tabs → Artifact Feed

Currently: fixed tabs (Ledger/Journal/Documents/Missions).

Target: chronological feed of artifacts generated during the current case session:
- Tool execution results (tables, charts, diffs)
- Approval cards
- Evidence references

**Note:** `ledger` and `evidence` as full-board views remain available via sidebar — the artifact feed is the **ephemeral session view**, not the persistent record.

---

## 6. Phase 3 — Mnevori Per-Node Persistence

### 6.1 Current state (suspect)
Each node in the phase graph (OCR → classification → validation → proposal → approval) likely persists to Mnevori at the end of the full flow.

### 6.2 Target state
Each node persists its artifact **before returning control** to Geavon:

```
OCR → persist() → return
Classification → persist() → return
Validation → persist() → return
Proposal → persist() → return
Approval → persist() → return (final)
```

### 6.3 Resume mechanism
If the process is interrupted mid-flow, the next session should:
1. Index by `(ruc, caseId, phase)` 
2. Resume from the last persisted phase
3. Not reprocess completed phases

### 6.4 Versioning edge case
Define what happens if a case is resumed after the applicable regulation changed. Options:
- Invalidate all cached phase results and restart from OCR
- Mark cached results as "pre-regulation-change" and flag for re-validation
- Compare old vs new regulation delta and only re-run affected phases

This decision depends on what Phase 0's Lexori audit reveals about how often regulations change mid-case.

---

## 7. Phase 4 — Tools to Skills

### 7.1 Selection order
1. **Banking** (pilot — acotado, already has API and domain entity)
2. **Bills**
3. **Taxation**
4. **Credit/Debit notes** (merge under invoices domain)
5. **Payroll**
6. **Inventory**

### 7.2 Banking pilot pattern
- Keep domain logic (`apps/api/src/features/banking/`) as-is
- Remove route `/tesoreria/banking` and `apps/web/src/features/banking/` page-level code
- Expose as skill in Geavon: `conciliar_banco()` — returns inline artifact
- The inline artifact (reconciliation table) renders in the right panel feed
- `customers` and `vendors` remain as boards (data master, not tool-invocable)

### 7.3 Phase graph not forced for simple queries
- **Simple query** (e.g., "¿cuánto pagué de IGV en enero?") → agent responds directly with Korveth deterministic calculation
- **Substantial task** (e.g., monthly close, declaration generation) → agent **suggests** activating phase graph
- The suggestion is visible but doesn't require the user to know "phase graph" exists

### 7.4 Per-tool acceptance criteria
Each migrated tool must pass before the next:
- Delegation rule fires correctly for the tool's domain
- Artifact renders inline in the right panel with acceptable latency
- No regression in existing route-based access (redirects work)

---

## 8. Phase 5 — Boards Final Audit + Approval Hub

### 8.1 Legacy boards verification
Verify each remaining board meets the "board" criteria (must be openable without agent, legal/audit requirement):

- **Ledger** → Book of original entry / general ledger — legal audit requirement ✅ stays as board
- **Evidence** → Audit vault ✅ stays as board
- **Invoices** → Legal record of issued documents ✅ stays as board
- **Inventory/Kardex** → SUNAT mandatory book ✅ stays as board
- **Compliance** → SUNAT/SIRE status overview ✅ stays as board
- **Customers / Vendors** → Data master (CRM-like) ✅ stays as board

### 8.2 Approval-hub as cross-case board
**Approval-hub** (route `/approvals`) stays as a board but redefined per the original migration plan:
- It's the **cross-case approval inbox**: "todo lo pendiente de aprobar en todos mis casos"
- Useful for an accountant managing 20 companies
- The approval action itself (Approve/Reject) happens as an **inline artifact** within the thread of the corresponding case
- This board is just the index/inbox — not the action surface

### 8.3 Residual cleanup
- Remove any remaining v1/v2 duplicates not caught in Phase 1
- Verify `evidence-v2` fully removed
- Verify `settings` legacy page fully removed (only `/configuracion` remains)

---

## 9. Sidebar Target (end state after all phases)

```
Drenyra
├── Buscar casos... (⌘K)
├── CASOS (lista)
│
├── 📌 Ledger              → /ledger
├── 📌 Compliance          → /compliance
├── 📌 Aprobaciones       → /approvals
├── 📌 Clientes            → /customers
├── 📌 Proveedores         → /vendors
├── 📌 Evidencia           → /evidence
│
├── Configuración          → /configuracion
└── Control Tower          → /drenyra/control-tower (admin only)
```

Everything else (banking, bills, cashflow, taxation, payroll, invoices, inventory) is reached **from within a case**, via conversation or `@command` — never by navigating the sidebar.

---

## 10. Verification Gates

| Phase | Gate | How to verify |
|-------|------|---------------|
| 0 | Lexori audit clean + CI guardrail active | Audit document + `bun run ci:forbidden-terms` passes |
| 1 | 0 false negatives on delegation rules | 5-10 real cases logged |
| 1.5 | Aggregated progress never contradicts detail | Parallel run with dev flag |
| 2 | Artifact feed renders correctly | Manual visual check |
| 3 | Resume works mid-flow | Integration test |
| 4 | Each tool passes acceptance criteria | Per-tool checklist |
| 5 | All boards accessible without agent | Manual check |

---

## 11. Non-goals (explicitly out of scope)

- Rewriting the AI swarm backend (CognitiveApprovalStore, pairing, etc.)
- Changing the Thread domain entity
- Replacing the phase graph state machine
- Migrating to a different LLM provider
- Changing the database schema

---

## 12. Files Summary by Phase

### Phase 0
| File | Action |
|------|--------|
| `scripts/ci/check-forbidden-terms.ts` | **CREATE** |
| `package.json` | **EDIT** (add `ci:forbidden-terms` script) |

### Phase 1
| File | Action |
|------|--------|
| `packages/agents/src/geavon/delegation-rules.ts` | **CREATE** |
| `packages/agents/src/index.ts` | **EDIT** (export delegation rules) |
| `apps/web/src/routes/review-queue.tsx` | **DELETE** |
| `apps/web/src/routes/review-queue/index.tsx` | **DELETE** |
| `apps/web/src/routes/review.tsx` | **DELETE** |
| `apps/web/src/routes/inteligencia.tsx` | **DELETE** |
| `apps/web/src/features/intelligence/` | **DELETE** (verify deps) |
| `apps/web/src/routes/threads/index.tsx` | **DELETE** |
| `apps/web/src/routes/threads/$threadId.tsx` | **DELETE** |
| `apps/web/src/features/evidence-v2/` | **DELETE** |
| `apps/web/src/routeTree.gen.ts` | **REGENERATE** |
| `apps/web/src/features/approvals/` | **EDIT** (absorb review-queue logic) |

### Phase 1.5
| File | Action |
|------|--------|
| `apps/web/src/components/agentic/AgentHeartbeat.tsx` | **EDIT** → `CaseProgress` |
| `apps/web/src/features/control-tower/` | **CREATE** or **EDIT** (agent detail view) |

### Phase 2
| File | Action |
|------|--------|
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
| Same pattern for bills, taxation, credit/debit notes, payroll, inventory | |

### Phase 5
| File | Action |
|------|--------|
| Approval flow verification | Check |
| Residual cleanup from Phase 1 | Verify |
