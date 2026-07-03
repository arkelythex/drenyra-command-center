# SDD Proposal: Accounting Diff + Review Queue

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** 4 de 6
**Bloqueado por:** Plan 1 (Agentic Shell) — necesita Inspector + palette + routing
**Depende de:** Plan 2 (Threads) — los diffs se asocian a threads

---

## Executive Summary

Crear el **Accounting Diff** — la pieza central de Drenyra que hace que la contabilidad se sienta como revisar un PR de código. Cada cambio propuesto por un agente se muestra como un diff: **Antes / Después** de asientos contables, con impacto fiscal, evidencia adjunta, riesgo, y acciones de aprobación.

Complemento: la **Review Queue** — cola de aprobación donde el contador revisa todos los cambios pendientes, priorizados por riesgo y urgencia.

---

## Problem

Actualmente no hay una forma unificada de ver **qué cambió** cuando un agente propone algo. El contador tiene que abrir módulos separados, comparar manualmente, y no hay trazabilidad de "esto cambió porque el agente X encontró Y evidencia y produjo Z asiento". Sin diff, no hay confianza en la IA.

---

## Solution

### Pantalla: Accounting Diff

Inspirada en el diff de GitHub PR + Codex App:

```txt
Diff: Cierre Jun 2026 · Andrés Capital SAC

Factura F001-2841 — Proforma #3 de 12 → Siguiente

┌─────────────────────────────────────────────────────────┐
│ ANTES                          DESPUÉS                  │
│                                                        │
│ Compra no registrada           Débito 60 Compras       │
│ IGV no reconocido                   S/ 1,000.00        │
│ Proveedor sin pasivo           Débito 4011 IGV CF      │
│ No aparece en cierre                S/ 180.00          │
│                                Crédito 42 Proveedores   │
│                                     S/ 1,180.00        │
│                                                        │
│                                SIRE: ✔ Validado         │
│                                Evidencia: XML, PDF, CDR │
└─────────────────────────────────────────────────────────┘

Impacto
├─ IGV crédito fiscal: +S/ 180.00
├─ Resultado mensual:  -S/ 1,000.00
└─ Riesgo: Bajo · Confianza: 92%

[ Aprobar ] [ Editar ] [ Pedir sustento ] [ Rechazar ]
```

### Pantalla: Review Queue

La cola de revisión es la pantalla más importante para el contador:

```txt
Review Queue ── Pendientes de aprobación

═══ CRÍTICA ═══
[!] Gasto sin sustento — Agroexport Norte     [ Revisar ]
    S/ 12,300 sin XML/CDR · Riesgo: Alto
    Propuesto por: SIRE Agent · Thread: #2841

═══ ALTA ═══
[!] IGV observado — Andrés Capital SAC        [ Revisar ]
    18 comprobantes no coinciden con SIRE
    Propuesto por: SIRE Agent · Thread: #2840

═══ MEDIA ═══
[i] Conciliación BCP — Nova SAC              [ Revisar ]
    152 movimientos emparejados, 3 sin match
    Propuesto por: Reconciliation Agent · Thread: #2839

═══ BAJA ═══
[·] Provisión sugerida — Luna EIRL           [ Revisar ]
    S/ 4,800 cobranza dudosa · Riesgo: Medio
    Propuesto por: Tax Risk Agent · Thread: #2838
```

### Componentes nuevos

1. **AccountingDiffView** — Vista de diff lado a lado (Antes/Después) con resaltado de cambios.
2. **DiffProposalCard** — Card de propuesta individual dentro del diff.
3. **DiffImpactPanel** — Panel de impacto fiscal: IGV, resultado, riesgo, confianza.
4. **DiffEvidencePanel** — Panel de evidencia asociada al cambio (XML, CDR, PDF, banco).
5. **DiffActionBar** — Barra de acciones: Approve, Edit, Request justification, Reject.
6. **ReviewQueuePage** — Página principal de cola de aprobación.
7. **ReviewQueueItem** — Item individual en la cola con prioridad, resumen, acciones.
8. **ReviewQueueFilter** — Filtros: prioridad, agente, cliente, periodo, estado.
9. **ReviewHistoryTimeline** — Timeline de revisiones (quién aprobó qué, cuándo, con qué comentario).
10. **BatchApproveDialog** — Diálogo de aprobación masiva con confirmación.

### Tipos de diff contable

| Tipo             | Descripción                       | Ejemplo                      |
| ---------------- | --------------------------------- | ---------------------------- |
| `journal-entry`  | Nuevo asiento contable propuesto  | Débito/Crédito               |
| `journal-modify` | Modificación de asiento existente | Cambio de cuenta o monto     |
| `tax-impact`     | Cambio en cálculo de IGV/Renta    | IGV crédito fiscal: +S/180   |
| `reconciliation` | Match/unmatch de conciliación     | 152 movimientos emparejados  |
| `compliance`     | Hallazgo de compliance            | 18 CPE no coinciden con SIRE |
| `risk`           | Detección de riesgo fiscal        | Gasto sin sustento           |

### API endpoints nuevos

| Endpoint                          | Método | Propósito                                         |
| --------------------------------- | ------ | ------------------------------------------------- |
| `/api/diffs`                      | GET    | Listar diffs (filtro por thread, cliente, estado) |
| `/api/diffs/:id`                  | GET    | Detalle del diff con before/after                 |
| `/api/diffs/:id/approve`          | POST   | Aprobar diff                                      |
| `/api/diffs/:id/reject`           | POST   | Rechazar diff (con motivo)                        |
| `/api/diffs/:id/request-info`     | POST   | Pedir más sustento                                |
| `/api/review-queue`               | GET    | Listar cola de revisión                           |
| `/api/review-queue/stats`         | GET    | Stats: pendientes, críticos, vencidos             |
| `/api/review-queue/batch-approve` | POST   | Aprobar múltiples items                           |

### Dominio nuevo

```
packages/domain/src/
  diff/
    accounting-diff.ts       → AccountingDiff entity
    diff-id.ts              → DiffId (branded)
    diff-type.ts            → DiffType enum
    diff-status.ts          → DiffStatus enum
    diff-change.ts          → DiffChange value object (before/after)
    diff-impact.ts          → DiffImpact value object

  review/
    review-queue-item.ts    → ReviewQueueItem entity
    review-decision.ts      → ReviewDecision value object
```

---

## Architecture

```tsx
// Review Queue Page
<AgenticLayout>
  <main>
    <ReviewQueuePage>
      <ReviewQueueFilter />
      <ReviewQueueList>
        <ReviewQueueItem priority="critical" />
        <ReviewQueueItem priority="high" />
        <ReviewQueueItem priority="medium" />
        <ReviewQueueItem priority="low" />
      </ReviewQueueList>
    </ReviewQueuePage>
  </main>
  <RightInspector />    {/* Muestra detalle del item seleccionado */}
</AgenticLayout>

// Diff Detail (modal o inspector)
<AccountingDiffView>
  <DiffProposalCard />
  <div className="diff-split">
    <div className="before" />
    <div className="after" />
  </div>
  <DiffImpactPanel />
  <DiffEvidencePanel />
  <DiffActionBar />
</AccountingDiffView>
```

---

## Dependencies

- **Bloqueado por**: Plan 1 (layout + routing + right inspector)
- **Depende de**: Plan 2 (threads) — los diffs y reviews se asocian a threads
- **Paralelo parcial**: Plan 3 (agents window puede linkear a diffs)
- **Independiente de**: Plans 5, 6

---

## Delivery

**Estrategia:** auto-chain — 3 PRs

| PR  | Scope                                                                                   | Archivos | Líneas |
| --- | --------------------------------------------------------------------------------------- | -------- | ------ |
| PR1 | Domain entities (diff + review) + persistence + API                                     | 10-12    | ~400   |
| PR2 | AccountingDiffView + DiffProposalCard + DiffImpactPanel + DiffEvidencePanel + ActionBar | 8-10     | ~400   |
| PR3 | ReviewQueuePage + ReviewQueueItem + filters + batch approve + timeline                  | 10-12    | ~350   |

**Riesgos:**

- El diff contable requiere datos estructurados "antes/después" que pueden no existir aún en los agentes.
- La aprobación debe ser inmutable — una vez aprobado, no se puede revertir sin un nuevo diff.
- Batch approve necesita transaccionalidad para no dejar estado inconsistente.

---

## Non-goals

- No se implementa la generación de diffs por agentes (es responsabilidad de drenyra-orchestrator)
- No se implementan skills ni automations (Plan 5)
- No se implementa el vault de evidencia (Plan 6)
- No se implementan threads (Plan 2) — solo se referencian
