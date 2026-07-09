# Tasks: Accountant Interface

> **Phase**: tasks
> **Depende de**: spec (A1, A2, A3) + design
> **Estimación**: ~1900 líneas, 6 PRs encadenados

---

## Review Workload Forecast

| Métrica                 | Valor                    |
| ----------------------- | ------------------------ |
| Estimated lines         | ~1900                    |
| Estimated files         | ~30                      |
| Hot paths               | fiscal, compliance, auth |
| Chained PRs recommended | **Yes** — 6 PRs          |
| Decision needed         | Auto-chain por fase      |

**Estrategia**: auto-chain por fase (cada fase = PR independiente mergeable a main)

---

## Task Inventory

### Phase 1: A1 Query Engine (CLI + API)

#### F1-1: `packages/fiscal-query-engine` — types + classifier

- [ ] Crear `packages/fiscal-query-engine/package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] Implementar `src/types.ts` (QueryInput, QueryResult, IntentClassification, IntentKind)
- [ ] Implementar `src/intent-registry.ts` (pattern list + keyword matching)
- [ ] Implementar `src/classifier.ts` (pattern-first, AI-fallback)
- [ ] Implementar `src/pipeline-router.ts` (intent → fiscal pipeline mapping)
- [ ] Implementar `src/evidence-formatter.ts` (pipeline output → markdown + JSON)
- [ ] Implementar `src/response-builder.ts` (QueryResult builder)
- [ ] Implementar `src/index.ts` (barrel exports)
- **Tests**: classifier.test.ts, pipeline-router.test.ts, evidence-formatter.test.ts

#### F1-2: CLI command `drenyra consulta`

- [ ] Crear `apps/cli/internal/cmd/consulta.go`
- [ ] Implementar parseo de flags (--ruc, --periodo, --json, --mode)
- [ ] Implementar formato de output (texto legible + JSON)
- [ ] Implementar error handling (ambiguo, insufficient evidence)
- [ ] Registrar en root.go
- **Tests**: consulta_test.go

#### F1-3: API endpoint `POST /api/consulta`

- [ ] Crear `apps/api/src/features/consulta/routes.ts`
- [ ] Crear Zod schemas para input/output
- [ ] Integrar con fiscal-query-engine
- [ ] Tests de integración

**PR #1**: F1-1 + F1-2 + F1-3 (~600 líneas)

---

### Phase 2: A2 Approval Workflow (CLI)

#### F2-1: `packages/fiscal-approval` — types + engine + gate

- [ ] Crear `packages/fiscal-approval/package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] Implementar `src/types.ts` (Recommendation, ApprovalStatus, ApprovalAction, ApprovalGateConfig)
- [ ] Implementar `src/recommendation-engine.ts` (pipeline output → Recommendation)
- [ ] Implementar `src/approval-gate.ts` (GatekeeperCheck con polling + timeout)
- [ ] Implementar `src/approval-store.ts` (evidence store wrapper)
- [ ] Implementar `src/audit-trail.ts` (registro de approval/reject)
- [ ] Implementar `src/index.ts` (barrel exports)
- **Tests**: recommendation-engine.test.ts, approval-gate.test.ts, approval-store.test.ts

#### F2-2: CLI commands `drenyra aprobar|rechazar|recomendaciones`

- [ ] Crear `apps/cli/internal/cmd/aprobar.go`
- [ ] Implementar `drenyra recomendaciones` (list pending)
- [ ] Implementar `drenyra aprobar <id>` (approve + execute)
- [ ] Implementar `drenyra rechazar <id> --motivo` (reject with reason, motivo required)
- [ ] Implementar `drenyra recomendacion <id>` (detail)
- [ ] Implementar `drenyra historial` (history log)
- [ ] Registrar en root.go
- **Tests**: aprobar_test.go

**PR #2**: F2-1 + F2-2 (~500 líneas)

---

### Phase 3: A3 Web Panel

#### F3-1: Shared types

- [ ] Agregar types en `packages/shared/src/consulta/types.ts`
- [ ] Agregar API client helpers

#### F3-2: API endpoints para approval + dashboard

- [ ] `GET /api/approval/pending` — list pending
- [ ] `GET /api/approval/:id` — detail
- [ ] `POST /api/approval/:id/approve` — approve
- [ ] `POST /api/approval/:id/reject` — reject
- [ ] `GET /api/accountant/summary` — dashboard summary
- **Tests**: routes tests

#### F3-3: Dashboard page

- [ ] `AccountantLayout.tsx` (sidebar fiscal)
- [ ] Route `/accountant` — dashboard with summary cards + pending widget
- [ ] Component: `FiscalSummaryCard.tsx`
- [ ] Component: `PendingApprovalWidget.tsx`

#### F3-4: Consulta page

- [ ] Route `/accountant/consulta` — query input + results
- [ ] `ConsultaInput.tsx` (text input con ejemplos dinámicos)
- [ ] `QueryResult.tsx` (result cards with evidence)
- [ ] `EvidenceList.tsx` (expandible source list)
- [ ] `CreateRecommendationButton.tsx` → crea y redirige a approval

#### F3-5: Approval pages

- [ ] Route `/accountant/approval` — listado con cards
- [ ] `RecommendationCard.tsx`
- [ ] Route `/accountant/approval/:id` — detalle con evidencia + aprobar/rechazar
- [ ] `ApproveButton.tsx`
- [ ] `RejectForm.tsx` (motivo required, validación frontend)
- [ ] `EvidenceTimeline.tsx` (pipeline phases timeline)

#### F3-6: Evidence viewer

- [ ] Route `/accountant/evidence/:id` — full evidence detail
- [ ] `EvidenceViewer.tsx` (CDR hash, sources, confidence, phase results)
- [ ] `EvidenceSourceRow.tsx`

**PR #3**: F3-1 + F3-2 + F3-3 + F3-4 (~450 líneas)
**PR #4**: F3-5 + F3-6 (~350 líneas)

---

## Dependencias entre PRs

```
PR #1 (A1 Query Engine)
  ↓ depende de
PR #2 (A2 Approval Workflow)
  ↓ depende de (API endpoints)
PR #3 (Web: Dashboard + Consulta)
  ↓ depende de
PR #4 (Web: Approval + Evidence)
```

## Criterios de Done

- [ ] Todos los tests pasan (`bun run test && bun run typecheck`)
- [ ] `drenyra consulta "IGV de julio 2026"` funciona
- [ ] `drenyra aprobar REC-001` funciona
- [ ] POST /api/consulta responde con JSON
- [ ] Dashboard web muestra resumen fiscal
- [ ] Approval web aprueba/rechaza
- [ ] Evidence viewer muestra artifacts
- [ ] Compliance gates no rotos (tests existentes pasan)
