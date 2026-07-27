# SDD Proposal: drenyra-invoicing-ap — Invoicing, Purchases & Accounts Payable

| Field              | Value                       |
| ------------------ | --------------------------- |
| **Change ID**      | `drenyra-invoicing-ap`      |
| **SDD Phase**      | Proposal                    |
| **Status**         | Draft                       |
| **Author**         | SDD Proposer (el Gentleman) |
| **Created**        | 2026-07-25                  |
| **Target**         | Invoicing, Purchases & AP   |
| **Capabilities**   | CAP-AP-01 → CAP-AP-13       |
| **Artifact Store** | openspec + engram           |

---

## Executive Summary

Drenyra has significant invoicing/AP code (API billing 64 files, 14 tests; WEB invoices 87 files, 21 tests; WEB bills 20 files; API vendors 12 files; WEB vendors 15 files; credit/debit notes; retentions/perceptions ✅; detractions partial) pero **0 SDDs formales** para el área. Esta propuesta formaliza lo existente y construye los gaps en 4 fases.

## Product Decisions (validadas con stakeholder)

| Decisión                         | Respuesta                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Fase 1 alcance**               | Docs + tests only — no fixes, no refactors                                                        |
| **Complejidad aprobación AP**    | Simple — one approver                                                                             |
| **Detracciones: timing cálculo** | Al registro de factura (no al pago)                                                               |
| **Payment scheduling**           | Solo calendario interno — sin generación de archivos bancarios                                    |
| **Purchase order depth**         | Spend tracking + bill matching. Sin integración presupuestal con chart of accounts desde el día 1 |

---

## Scope & Fases

### Dependencia Bloqueante

`drenyra-invoice-entity-unification` (○ draft) y `drenyra-invoice-update-refactor` (○ draft) deben completarse primero.

### Fase 1: Formalizar AR/AP existente (docs + tests only)

- Documentar AR lifecycle (facturas emitidas, OSE, PDF, notas crédito/débito)
- Documentar AP lifecycle (bills recibidas, status transitions, payment application)
- Harden test coverage existente (sin fixes de bugs)
- Actualizar capability map

### Fase 2: AP Approval Workflow (one approver)

- Nuevo BillApproval entity
- approval_rules table
- Approval API: submit → review → approve/reject (single approver)
- Audit trail

### Fase 3: Purchase Order Integration

- Nuevo PurchaseOrder entity (DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED)
- PO→Bill matching
- Spend tracking

### Fase 4: AP Aging & Payment Scheduling

- Real-time aging buckets (reemplazar MOCK_AGING_DATA)
- Payment calendar interno
- Batch payment runs
- Detracciones vinculadas al AP bill flow (cálculo al registrar factura)

### Diferido

- Supplier portal / self-service
- Inbound CPE ingestion automation
- Advanced procurement

## Review Workload Forecast

| Fase              | Líneas estimadas | Archivos |
| ----------------- | ---------------- | -------- |
| 0 (dependencia)   | ~600             | ~22      |
| 1 (formalizar)    | ~200             | ~15      |
| 2 (aprobación)    | ~800             | ~20      |
| 3 (PO)            | ~1000            | ~25      |
| 4 (aging + pagos) | ~700             | ~15      |
| **Total**         | **~3,300**       | **~97**  |

## Risks

| Riesgo                                     | Severidad | Mitigación                                                   |
| ------------------------------------------ | --------- | ------------------------------------------------------------ |
| Entity unification rompe flujos existentes | HIGH      | Completar SDDs primero; full test suite gate                 |
| Detracciones mal calculadas                | HIGH      | Reusar tabla SPOT; property-based tests                      |
| 4 fases exceden review budget              | MEDIUM    | Chained PRs por fase; cada una reviewable independientemente |

## Next Steps

1. ✅ Product decisions validated
2. ⏳ Completar drenyra-invoice-entity-unification + drenyra-invoice-update-refactor
3. ⏳ SDD Spec: Fase 1 — formalización
4. ⏳ SDD Spec: Fase 2 — approval workflow
