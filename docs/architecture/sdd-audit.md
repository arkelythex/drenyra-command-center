# SDD Audit — Estado actual

**Última actualización:** 2026-07-24
**Total SDDs registrados:** 79
**Clasificación por dominio y madurez**

---

## Resumen

| Métrica               | Cantidad |
| --------------------- | -------- |
| SDDs registrados      | 79       |
| Implementados/Applied | 43       |
| En revisión/activos   | 5        |
| Draft/Pendientes      | 20       |
| Archivados/Superseded | 9        |
| Bloqueados            | 1        |
| Sin estado            | 1        |

---

## Foundation & Cross-cutting (17 SDDs)

| SDD                                                 | Estado         | L-Nivel | Dominio   |
| --------------------------------------------------- | -------------- | ------- | --------- |
| `drenyra-h02-tenant-isolation`                      | review-pending | L3      | Tenant    |
| `drenyra-data-integrity`                            | ✅ implemented | L4      | Data      |
| `drenyra-observability`                             | ✅ implemented | L4      | Ops       |
| `drenyra-x1-cross-stack-contracts`                  | ✅ applied     | L3      | Contracts |
| `drenyra-x2-fiscal-property-testing`                | ✅ applied     | L3      | Testing   |
| `drenyra-x3-provider-architecture`                  | ✅ applied     | L3      | Platform  |
| `drenyra-x4-import-health`                          | ✅ applied     | L3      | Quality   |
| `drenyra-x5-benchmark-ci`                           | ✅ applied     | L3      | CI        |
| `drenyra-x6-supply-chain-security`                  | ✅ applied     | L3      | Security  |
| `drenyra-x7-developer-experience`                   | ✅ applied     | L3      | DX        |
| `drenyra-x8-architecture-decisions`                 | ✅ applied     | L3      | ADRs      |
| `drenyra-p3-testing`                                | ✅ applied     | L3      | Quality   |
| `drenyra-p4-ci-cd`                                  | ✅ applied     | L3      | CI/CD     |
| `drenyra-p5-code-quality`                           | ✅ applied     | L3      | Quality   |
| `drenyra-p6-package-health`                         | ✅ applied     | L3      | Packages  |
| `drenyra-s4-domain-boundary-audit`                  | 📦 archived    | L2      | Domain    |
| `monorepo-quality-baseline-and-balance-consistency` | ○ draft        | L1      | Quality   |

## Agent Runtime & AI (8 SDDs)

| SDD                               | Estado  | L-Nivel | Dominio   |
| --------------------------------- | ------- | ------- | --------- |
| `drenyra-h0-agentic-harness`      | ○ draft | L1      | Agent     |
| `drenyra-h1-fiscal-intelligence`  | ○ draft | L1      | Agent     |
| `drenyra-h2-sunat-platform`       | ○ draft | L1      | SUNAT     |
| `drenyra-h3-multi-country`        | ○ draft | L1      | Expansion |
| `drenyra-h4-agent-ux`             | ○ draft | L1      | UX        |
| `drenyra-fiscal-agent-discipline` | ○ draft | L1      | Agent     |
| `multi-agent-orchestration`       | ○ draft | L1      | Agent     |
| `autonomous-change-control-plane` | ○ draft | L1      | Agent     |

## Agentic Migration Waves (4 SDDs) — ejecutados

| SDD                                | Estado                | L-Nivel |
| ---------------------------------- | --------------------- | ------- |
| `drenyra-am1-eliminate-duplicates` | ✅ applied            | L3      |
| `drenyra-am2-artifact-feed`        | ✅ applied            | L3      |
| `drenyra-am3-features-to-tools`    | ✅ applied (archived) | L3      |
| `drenyra-am4-sidebar-reduction`    | ✅ applied            | L3      |

## North Star & Philosophy (4 SDDs)

| SDD                                         | Estado      | L-Nivel |
| ------------------------------------------- | ----------- | ------- |
| `drenyra-north-star-philosophy`             | 📦 archived | L4      |
| `drenyra-philosophy-docs-alignment`         | ✅ applied  | L3      |
| `drenyra-web-agentic-accounting-philosophy` | 📦 archived | L3      |
| `drenyra-cli-gentleman-fiscal-terminal`     | 📦 archived | L3      |

## UI/UX & Design System (12 SDDs)

| SDD                                     | Estado                | L-Nivel |
| --------------------------------------- | --------------------- | ------- |
| `drenyra-frontend-command-center-reset` | ✅ all-applied        | L3      |
| `drenyra-global-shell`                  | ✅ applied            | L3      |
| `drenyra-three-panel-layout`            | ✅ applied            | L3      |
| `drenyra-design-tokens-v4`              | ✅ applied            | L3      |
| `drenyra-component-states`              | ✅ applied            | L3      |
| `drenyra-fiscal-editorial-v3`           | 📦 archived           | L3      |
| `drenyra-typography-system`             | ✅ applied (archived) | L3      |
| `drenyra-sidebar-codex`                 | ✅ applied            | L3      |
| `drenyra-thread-system`                 | ✅ applied (archived) | L3      |
| `drenyra-agentic-shell`                 | ✅ applied            | L3      |
| `drenyra-agents-window`                 | ✅ applied (archived) | L3      |
| `drenyra-c1-css-modernization`          | ✅ applied            | L3      |

## Close, Accounting & Financial (5 SDDs)

| SDD                                   | Estado     | L-Nivel |
| ------------------------------------- | ---------- | ------- |
| `drenyra-cierre-flow`                 | ✅ applied | L3      |
| `drenyra-accounting-diff`             | ✅ applied | L3      |
| `drenyra-accountant-operating-system` | ⛔ blocked | L2      |
| `drenyra-accountant-interface`        | ○ draft    | L1      |
| `smart-reconciliation`                | ○ draft    | L1      |

## Evidence & Data (4 SDDs)

| SDD                        | Estado                 | L-Nivel |
| -------------------------- | ---------------------- | ------- |
| `drenyra-evidence-vault`   | 📦 archived            | L2      |
| `drenyra-evidence-vault-2` | ✅ applied             | L3      |
| `drenyra-vocabulary`       | ✅ verified (archived) | L4      |
| `drenyra-pi-extraction`    | ✅ verified (archived) | L4      |

## Performance, Quality & Modernization (12 SDDs)

| SDD                               | Estado                    | L-Nivel |
| --------------------------------- | ------------------------- | ------- |
| `drenyra-p1-fiscal-terminal`      | ✅ done (archived)        | L4      |
| `drenyra-p2-performance`          | ✅ applied                | L3      |
| `drenyra-p2b-perf-extended`       | ⚡ tasks                  | L2      |
| `drenyra-d1-dep-modernization`    | ✅ applied                | L3      |
| `drenyra-d2-data-engine`          | ✅ applied                | L3      |
| `drenyra-l1-legacy-cleanup`       | ✅ applied                | L3      |
| `drenyra-r1-eliminate-redundancy` | ✅ applied                | L3      |
| `drenyra-r2-deep-refactoring`     | ✅ applied                | L3      |
| `drenyra-s1-ai-consolidation`     | 📦 superseded             | L2      |
| `drenyra-s2-core-simplification`  | ✅ completed              | L3      |
| `drenyra-s3-api-type-migration`   | ✅ implemented (archived) | L4      |
| `drenyra-s5-go-cli-alignment`     | ✅ applied                | L3      |

## Docs, Security & Misc (13 SDDs)

| SDD                                  | Estado      | L-Nivel |
| ------------------------------------ | ----------- | ------- |
| `drenyra-s6-docs-cleanup`            | ✅ applied  | L3      |
| `drenyra-security-deploy`            | ✅ applied  | L3      |
| `drenyra-skills-automations`         | ✅ applied  | L3      |
| `drenyra-invoice-entity-unification` | ○ draft     | L1      |
| `drenyra-invoice-update-refactor`    | ○ draft     | L1      |
| `drenyra-api-contracts`              | ○ draft     | L1      |
| `drenyra-api-real-data`              | ○ draft     | L1      |
| `drenyra-control-tower`              | 📦 archived | L2      |
| `csv-batch-agent`                    | ○ draft     | L1      |
| `fiscal-agent-247`                   | 📦 archived | L2      |
| `fiscal-health-dashboard`            | ○ draft     | L1      |

---

## Clasificación por madurez L0–L4

| Nivel                 | Cantidad | SDDs                                                                                                |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| **L4** — Verified     | 4        | data-integrity, observability, s3-api-type-migration, p1-fiscal-terminal, vocabulary, pi-extraction |
| **L3** — Executable   | 34+      | Todos los "applied"/"completed"                                                                     |
| **L2** — Architecture | 6        | archived designs, accountant-operating-system, h0-h4 drafts                                         |
| **L1** — Requirements | 20       | Drafts sin implementar                                                                              |
| **L0** — Idea         | 0        | —                                                                                                   |

---

## Próximas acciones

1. Mover los 20 SDDs en L1 a agenda de priorización contra el Capability Map
2. Los 34 SDDs en L3 necesitan verificación post-implementación (L4)
3. Los 4 SDDs en L4 son referencia canónica — mantener actualizados
4. Worktrees legacy (`feat-ux-sdd-program`, `codex-command-center`) — limpiar
