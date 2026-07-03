# Spec: Accounting Diff + Review Queue

**Última actualización:** 2026-07-02 | **Plan:** 4 de 6

---

## 1. Resumen

Sistema de diff contable (Antes/Después de asientos propuestos por agentes) + cola de revisión priorizada. Inspirado en GitHub PR diff y Codex App.

---

## 2. Requerimientos Funcionales

### 2.1 API — Diffs

| ID    | Endpoint                           | Descripción                                                   |
| ----- | ---------------------------------- | ------------------------------------------------------------- |
| RF-01 | `GET /api/diffs`                   | Listar diffs (filtro: thread, client, status, type, priority) |
| RF-02 | `GET /api/diffs/:id`               | Detalle del diff con before/after completo                    |
| RF-03 | `POST /api/diffs/:id/approve`      | Aprobar diff                                                  |
| RF-04 | `POST /api/diffs/:id/reject`       | Rechazar con motivo                                           |
| RF-05 | `POST /api/diffs/:id/request-info` | Pedir más sustento                                            |

### 2.2 API — Review Queue

| ID    | Endpoint                               | Descripción                           |
| ----- | -------------------------------------- | ------------------------------------- |
| RF-06 | `GET /api/review-queue`                | Listar cola (orden: priority, date)   |
| RF-07 | `GET /api/review-queue/stats`          | Stats: pendientes, críticos, vencidos |
| RF-08 | `POST /api/review-queue/batch-approve` | Aprobación masiva                     |

### 2.3 Frontend — Accounting Diff View

| ID    | Componente         | Descripción                                       |
| ----- | ------------------ | ------------------------------------------------- |
| RF-09 | AccountingDiffView | Split view Before/After con resaltado visual      |
| RF-10 | DiffProposalCard   | Card de propuesta: tipo, autor, thread link       |
| RF-11 | DiffImpactPanel    | Impacto fiscal: IGV, resultado, riesgo, confianza |
| RF-12 | DiffEvidencePanel  | Evidencia asociada: XML, CDR, PDF                 |
| RF-13 | DiffActionBar      | Acciones: Approve, Edit, Request info, Reject     |

### 2.4 Frontend — Review Queue

| ID    | Componente            | Descripción                                             |
| ----- | --------------------- | ------------------------------------------------------- |
| RF-14 | ReviewQueuePage       | Página principal con cola agrupada por prioridad        |
| RF-15 | ReviewQueueItem       | Item con prioridad, resumen, risk badge, acciones       |
| RF-16 | ReviewQueueFilter     | Filtros: prioridad, agente, cliente, periodo, tipo diff |
| RF-17 | ReviewHistoryTimeline | Timeline de revisiones pasadas                          |
| RF-18 | BatchApproveDialog    | Modal de aprobación masiva con confirmación             |

---

## 3. Tipos de Diff

| Tipo             | Descripción          | Visual                                    |
| ---------------- | -------------------- | ----------------------------------------- |
| `journal-entry`  | Nuevo asiento        | Antes: vacío / Después: débito+crédito    |
| `journal-modify` | Modificación asiento | Antes: cuenta/monto / Después: cambio     |
| `tax-impact`     | Impacto IGV/Renta    | Antes: sin IGV / Después: +S/180          |
| `reconciliation` | Match/unmatch        | Antes: pendiente / Después: emparejado    |
| `compliance`     | Hallazgo compliance  | Antes: sin validar / Después: observación |
| `risk`           | Riesgo fiscal        | Antes: no detectado / Después: alerta     |

---

## 4. Estados UI

| Componente         | Loading          | Vacío                  | Datos                 | Error          |
| ------------------ | ---------------- | ---------------------- | --------------------- | -------------- |
| DiffList           | Skeleton 3 rows  | "Sin diffs pendientes" | Lista agrupada        | Banner + retry |
| AccountingDiffView | Split skeleton   | "Selecciona un diff"   | Before/After + panels | Panel error    |
| ReviewQueue        | Skeleton         | "Cola vacía" + CTA     | Items priorizados     | Banner + retry |
| DiffActionBar      | Disabled         | —                      | Buttons contextuales  | Toast error    |
| BatchApproveDialog | Spinner en botón | —                      | Lista + confirmar     | Alert + retry  |

---

## 5. Archivos

```
packages/domain/src/diff/
  accounting-diff.ts      → AccountingDiff entity con state machine
  diff-id.ts              → branded type
  diff-type.ts            → enum (6 tipos)
  diff-status.ts          → enum (pending, approved, rejected, info_requested)
  diff-change.ts          → value object (before/after)
  diff-impact.ts          → value object (tax impact, risk, confidence)

packages/domain/src/review/
  review-queue-item.ts    → entity
  review-decision.ts      → value object

packages/persistence/src/schema/
  accounting-diffs.schema.ts
  review-queue.schema.ts

apps/api/src/features/diffs/
  diffs.types.ts, diffs.schemas.ts, diffs.service.ts, diffs.routes.ts, index.ts, __tests__/

apps/web/src/features/diffs/
  AccountingDiffView.tsx, DiffProposalCard.tsx, DiffImpactPanel.tsx,
  DiffEvidencePanel.tsx, DiffActionBar.tsx, diffs.api.ts, query-keys.ts, query-options.ts

apps/web/src/features/review-queue/
  ReviewQueuePage.tsx, ReviewQueueItem.tsx, ReviewQueueFilter.tsx,
  ReviewHistoryTimeline.tsx, BatchApproveDialog.tsx, review-queue.api.ts, review-queue.store.ts

apps/web/src/routes/diffs/index.tsx, routes/review-queue/index.tsx
```
