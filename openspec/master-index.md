# Drenyra Transformation — SDD Master Index

**Última actualización:** 2026-07-04
**Estrategia:** Frontend agentic-first + Backend production readiness + Structural quality (S1–S6)
**Review budget:** 400 líneas por PR · **Chained PR strategy:** auto-forecast
**Artifact store:** both (openspec + engram)

---

## Dependency Graph

```text
FRONTEND (equipo UI):
Plan F1: Agentic Shell ──────────────────────────────────┐
  │                                                       │
  ├── ▶ Plan F2: Thread System ────────────────────────┐ │
  │      │                                              │ │
  │      └── ▶ Plan F4: Accounting Diff + Review Queue ─┤ │
  │                                                     │ │
  ├── ▶ Plan F3: Agents Window ─────────────────────────┤ │
  │                                                     │ │
  ├── ▶ Plan F5: Skills + Automations ── (parallel) ───┤ │
  │                                                     │ │
  └── ▶ Plan F6: Evidence Vault 2.0 ──── (parallel) ───┘ │
                                                          │
BACKEND (el Gentleman):                                   │
  Plan B1: API Contracts ◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘
  Plan B2: Data Integrity & Quality
  Plan B3: Observability & Operations
  Plan B4: Security & Deployment
                                                          │
STRUCTURAL (el Gentleman):                                │
  S1: AI/Agent Ecosystem Consolidation ◀━━━━ blocks ──── S2
  S2: Core Package Simplification
  S3: API Type Inline → Package Migration
  S4: Domain Boundary Audit ◀━━━━ blocks ──── S1
  S5: Go CLI Pattern Alignment ◀━━━ blocks ──── S1, S4
  S6: Documentation & Navigation Cleanup ◀━━ blocks S1,S3,S4
```

---

## Frontend Plans (equipo UI)

| #   | Plan                     | Changes                                                   | PRs   | Est. lines | Bloqueado por |
| --- | ------------------------ | --------------------------------------------------------- | ----- | ---------- | ------------- |
| F1  | **Agentic Shell**        | Sidebar, layout, command bar, palette, inspector, routing | 3 PRs | ~950       | B1 (CORS)     |
| F2  | **Thread System**        | Threads domain, API, "Let's Close" UI, timeline           | 3 PRs | ~1,100     | F1            |
| F3  | **Agents Window**        | Multi-agent grid, tabs, session cards, timeline, risk     | 3 PRs | ~1,000     | F1            |
| F4  | **Accounting Diff**      | Diff view, review queue, approval flow, impact panel      | 3 PRs | ~1,150     | F1, F2        |
| F5  | **Skills + Automations** | Skills library, automation engine, wizard, logs           | 4 PRs | ~1,500     | F1            |
| F6  | **Evidence Vault 2.0**   | Lineage system, validation, batch ops, deep integration   | 4 PRs | ~1,500     | F1            |

## Backend Plans (el Gentleman)

| #   | Plan                            | Changes                                                        | PRs   | Est. lines | Bloqueado por |
| --- | ------------------------------- | -------------------------------------------------------------- | ----- | ---------- | ------------- |
| B1  | **API Contracts & Type Safety** | Response envelope, type exports, CORS, OpenAPI                 | 3 PRs | ~850       | —             |
| B2  | **Data Integrity & Quality**    | Fix 50 type errors, Evidence FK, integration tests, migrations | 4 PRs | ~1,100     | B1 (opcional) |
| B3  | **Observability & Operations**  | Global error handler, logging, health, metrics                 | 3 PRs | ~600       | —             |
| B4  | **Security & Deployment**       | Tenant audit, rate limiting, Docker, env, validation           | 3 PRs | ~750       | B3 (logging)  |

## Structural Plans (el Gentleman)

| #   | Plan                                    | Changes                                                    | PRs   | Est. lines | Bloqueado por |
| --- | --------------------------------------- | ---------------------------------------------------------- | ----- | ---------- | ------------- |
| S1  | **AI/Agent Ecosystem Consolidation**    | Consolidar 5 packages AI/Agent en 3 (ai, agents, memory)   | 5 PRs | ~1,800     | —             |
| S2  | **Core Package Simplification**         | Merge drenyra-core → domain/agents                         | 1 PR  | ~150       | S1            |
| S3  | **API Type Inline → Package Migration** | Mover types de apps/api/src/types/ a packages              | 2 PRs | ~400       | —             |
| S4  | **Domain Boundary Audit**               | Auditar packages/domain/, limpiar boundaries               | 2 PRs | ~350       | S1            |
| S5  | **Go CLI Pattern Alignment**            | Alinear contratos Go ↔ TS (memoria, delegación, workflows) | 2 PRs | ~500       | S1, S4        |
| S6  | **Documentation & Navigation Cleanup**  | Fix CODEX-MAP duplicado, unificar MAP.md                   | 1 PR  | ~100       | S1, S3, S4    |

---

## Full Delivery Summary

| Área       | Plans  | PRs    | Líneas      |
| ---------- | ------ | ------ | ----------- |
| Frontend   | 6      | 20     | ~7,200      |
| Backend    | 4      | 13     | ~3,300      |
| Structural | 6      | 13     | ~3,300      |
| **Total**  | **16** | **46** | **~13,800** |

---

## Recommended Execution Order

### Fase 0: Backend Foundation + Structural Foundation (paralelo)

1. **S3: API Type Migration** — independiente, quick win, destraba types limpios
2. **B1: API Contracts** — CORS + response envelope (crítico para frontend)
3. **B3: Observability** — error handler + logging (independiente)

### Fase 1: Structural Core

1. **S1: AI/Agent Ecosystem Consolidation** — el cambio más grande, destraba S2/S4/S5/S6
2. **S2: Core Package Simplification** — depende de S1
3. **S4: Domain Boundary Audit** — depende de S1

### Fase 2: Frontend Shell + Structural Continuation (paralelo)

1. **F1: Agentic Shell** (equipo UI)
2. **S5: Go CLI Pattern Alignment** — depende de S1, S4
3. **B2: Data Integrity** — type errors + FK + integration tests

### Fase 3: Frontend Core + Final Structural (paralelo)

1. **F2: Thread System** (equipo UI)
2. **F5: Skills + Automations** (equipo UI)
3. **S6: Documentation Cleanup** — último, después de todos los cambios estructurales
4. **B4: Security & Deployment** — tenant audit + Docker + rate limiting

### Fase 4: Frontend Experience

1. **F3: Agents Window** (equipo UI)
2. **F4: Accounting Diff + Review Queue** (equipo UI)
3. **F6: Evidence Vault 2.0** (equipo UI)

---

## Paths

### Frontend

| Plan | Change dir                                     | Proposal      |
| ---- | ---------------------------------------------- | ------------- |
| F1   | `openspec/changes/drenyra-agentic-shell/`      | `proposal.md` |
| F2   | `openspec/changes/drenyra-thread-system/`      | `proposal.md` |
| F3   | `openspec/changes/drenyra-agents-window/`      | `proposal.md` |
| F4   | `openspec/changes/drenyra-accounting-diff/`    | `proposal.md` |
| F5   | `openspec/changes/drenyra-skills-automations/` | `proposal.md` |
| F6   | `openspec/changes/drenyra-evidence-vault-2/`   | `proposal.md` |

### Backend

| Plan | Change dir                                  | Proposal      |
| ---- | ------------------------------------------- | ------------- |
| B1   | `openspec/changes/drenyra-api-contracts/`   | `proposal.md` |
| B2   | `openspec/changes/drenyra-data-integrity/`  | `proposal.md` |
| B3   | `openspec/changes/drenyra-observability/`   | `proposal.md` |
| B4   | `openspec/changes/drenyra-security-deploy/` | `proposal.md` |

### Structural

| Plan | Change dir                                           | Proposal      |
| ---- | ---------------------------------------------------- | ------------- |
| S1   | `openspec/changes/drenyra-s1-ai-consolidation/`      | `proposal.md` |
| S2   | `openspec/changes/drenyra-s2-core-simplification/`   | `proposal.md` |
| S3   | `openspec/changes/drenyra-s3-api-type-migration/`    | `proposal.md` |
| S4   | `openspec/changes/drenyra-s4-domain-boundary-audit/` | `proposal.md` |
| S5   | `openspec/changes/drenyra-s5-go-cli-alignment/`      | `proposal.md` |
| S6   | `openspec/changes/drenyra-s6-docs-cleanup/`          | `proposal.md` |

---

## Config

Ver `openspec/config.yaml` para configuración completa del proyecto.
