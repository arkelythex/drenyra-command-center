# Drenyra Transformation — SDD Master Index

**Última actualización:** 2026-07-02
**Estrategia:** Frontend agentic-first + Backend production readiness
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

---

## Full Delivery Summary

| Área      | Plans  | PRs    | Líneas      |
| --------- | ------ | ------ | ----------- |
| Frontend  | 6      | 20     | ~7,200      |
| Backend   | 4      | 13     | ~3,300      |
| **Total** | **10** | **33** | **~10,500** |

---

## Recommended Execution Order

### Fase 0: Backend Foundation (paralelo con Frontend F1)

1. **B1: API Contracts** — CORS + response envelope (crítico para frontend)
2. **B3: Observability** — error handler + logging (independiente)

### Fase 1: Frontend Shell + Backend Integrity

3. **F1: Agentic Shell** (equipo UI)
4. **B2: Data Integrity** — type errors + FK + integration tests
5. **B4: Security & Deployment** — tenant audit + Docker + rate limiting

### Fase 2: Frontend Core (paralelo)

6. **F2: Thread System** (equipo UI)
7. **F5: Skills + Automations** (equipo UI)
8. **F6: Evidence Vault 2.0** (equipo UI)

### Fase 3: Frontend Experience

9. **F3: Agents Window** (equipo UI)
10. **F4: Accounting Diff + Review Queue** (equipo UI)

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

---

## Config

Ver `openspec/config.yaml` para configuración completa del proyecto.
