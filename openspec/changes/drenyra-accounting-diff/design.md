# Design: Accounting Diff + Review Queue

**Última actualización:** 2026-07-02 | **Plan:** 4 de 6

---

## 1. Enfoque Técnico

Domain entities en packages/domain (stateless, framework-free) + API feature vertical en apps/api + frontend features en apps/web. Sigue el mismo patrón que Threads y Agents.

---

## 2. Arquitectura Backend

### 2.1 Domain entities

```
packages/domain/src/diff/
  accounting-diff.ts    → class AccountingDiff con state machine
                          estados: pending → approved | rejected | info_requested
                          métodos: approve(), reject(reason), requestInfo(question)
  diff-id.ts            → DiffId = Brand<string, "DiffId">
  diff-type.ts          → enum DiffType (journalEntry, journalModify, taxImpact, reconciliation, compliance, risk)
  diff-status.ts        → DiffStatus enum
  diff-change.ts        → DiffChange { field: string, before: unknown, after: unknown }
  diff-impact.ts        → DiffImpact { taxImpact?: Money, riskScore: number, confidence: number }
  index.ts              → barrel

packages/domain/src/review/
  review-queue-item.ts  → ReviewQueueItem entity, status: pending | reviewed | escalated
  review-decision.ts    → ReviewDecision { reviewerId, action, comment, timestamp }
  index.ts              → barrel
```

### 2.2 API feature

```
apps/api/src/features/diffs/
  diffs.types.ts        → DTOs: DiffDTO, DiffDetailDTO, ReviewQueueItemDTO, ReviewQueueStatsDTO
  diffs.schemas.ts      → Elysia t.Object schemas
  diffs.service.ts      → Bridge class (similar a agents.service.ts)
  diffs.routes.ts       → 8 endpoints con companyScopeGuard
  index.ts              → barrel
  __tests__/            → service tests
```

### 2.3 Edén Treaty shape

```
/api/diffs              GET  → { data: DiffDTO[], total }
/api/diffs/:id          GET  → DiffDetailDTO
/api/diffs/:id/approve  POST → { success }
/api/diffs/:id/reject   POST → { success }
/api/diffs/:id/request-info POST → { success }
/api/review-queue         GET → { data: ReviewQueueItemDTO[] }
/api/review-queue/stats   GET → ReviewQueueStatsDTO
/api/review-queue/batch-approve POST → { approved: number, failed: number }
```

---

## 3. Arquitectura Frontend

### 3.1 File tree

```
apps/web/src/features/diffs/
  diffs.types.ts         → DTOs frontend
  diffs.api.ts           → Eden Treaty client (8 funciones)
  query-keys.ts          → TanStack Query keys
  query-options.ts       → Query options
  AccountingDiffView.tsx → Split view Before/After
  DiffProposalCard.tsx   → Card de propuesta
  DiffImpactPanel.tsx    → Impacto fiscal
  DiffEvidencePanel.tsx  → Evidencia
  DiffActionBar.tsx      → Botones de acción
  index.ts               → barrel

apps/web/src/features/review-queue/
  review-queue.types.ts   → DTOs
  review-queue.api.ts     → API client
  review-queue.store.ts   → Zustand store (filters, selected)
  ReviewQueuePage.tsx     → Página principal
  ReviewQueueItem.tsx     → Item con prioridad
  ReviewQueueFilter.tsx   → Filtros
  ReviewHistoryTimeline.tsx → Timeline
  BatchApproveDialog.tsx  → Modal
  index.ts                → barrel

apps/web/src/routes/
  diffs/index.tsx         → createFileRoute lazy → AccountingDiffView
  review-queue/index.tsx  → createFileRoute lazy → ReviewQueuePage
```

### 3.2 Component design

**AccountingDiffView**: Split panel. Left=Before, Right=After. Green highlight for additions, red for removals. Estado no-selection muestra placeholder "Selecciona un diff de la cola". Loading muestra split skeleton.

**DiffActionBar**: Botones contextuales por status. Pending→[Approve, Request Info, Reject]. Approved→[View Only]. Rejected→[View Only, Reopen]. Los botones llaman a diffs.api y muestran toast con resultado.

**ReviewQueuePage**: Lista agrupada por prioridad (CRITICAL, HIGH, MEDIUM, LOW). Cada grupo colapsable. Use TanStack Query con polling 10s. Filtros en la parte superior.

**BatchApproveDialog**: Modal con checklist de items pendientes. Select All / Deselect All. Botón "Approve Selected (N)". Confirmación con resumen. Llamada a review-queue.api.batchApprove.

---

## 4. Routes

```
/diffs/         → AccountingDiffView (puede abrirse desde RightInspector)
/review-queue/  → ReviewQueuePage (ruta principal)
```

Las rutas se registran via TanStack Router codegen. Se linkean desde la AgenticSidebar y desde el AgenticCommandBar.

---

## 5. RightInspector Integration

El AccountingDiffView puede mostrar el diff en el RightInspector en lugar de página completa. Usa `useAgenticShell().openInspector({ type: 'diff', id: diffId })` para activarlo. El Inspector tiene panel `InspectorDiffPanel.tsx` (nuevo).

---

## 6. Entrega

**Estrategia:** auto-chain — 3 PRs

| PR | Scope | Archivos | Líneas |
|----|-------|----------|--------|
| PR1 | Domain entities + persistence schemas + API endpoints + tests | ~14 | ~450 |
| PR2 | Frontend diffs: AccountingDiffView + DiffProposalCard + DiffImpactPanel + DiffEvidencePanel + DiffActionBar | ~10 | ~400 |
| PR3 | Frontend review-queue: ReviewQueuePage + ReviewQueueItem + filters + batch approve + timeline | ~8 | ~350 |
