# Solicitud: Reporting & Financial Statements

**Change ID:** `drenyra-reporting-financials`
**Created:** 2026-07-24
**Status:** proposal
**Author:** el-gentleman
**Drenyra Fiscal SDD Phase:** solicitud

---

## Executive Summary

El módulo de Reports existe como baseline montado (19 archivos, 4 tests, 4 endpoints) pero opera con agregación PEN-only y no tiene autoridad contable final. Los clientes ya piden PLE (deadline regulatorio 2026), consolidación multi-empresa, centro de costos, y un builder de reportes personalizados. Esta iniciativa eleva Reporting de "baseline montado" a "plataforma de estados financieros" en tres fases, priorizando compliance regulatorio y demandas reales de clientes.

---

## Business Problem

**Pain & opportunity:**

- El módulo actual solo agrega en PEN, sin exchange-rate normalization, lo que lo inhabilita para operaciones multi-moneda reales.
- No existe General Ledger como primitivo fundacional de reporting — los reportes consultan invoices/bills directamente sin una capa de ledger unificado.
- Clientes con grupos empresariales (2-4 RUCs) no pueden consolidar estados financieros; cada empresa se reporta aislada.
- PLE (Programa de Libros Electrónicos) tiene deadline SUNAT 2026 y los clientes ya lo exigen. No tenerlo es riesgo de compliance y pérdida de contratos.
- No hay builder de reportes personalizados — cada nuevo reporte requiere desarrollo backend.
- No hay versionado de endpoints — cualquier evolución de schema rompe consumidores.

**Why now:** PLE deadline es inminente. Los clientes están decidiendo plataforma contable ahora. Sin PLE + multi-empresa, Drenyra pierde el segmento de firmas contables y grupos empresariales.

---

## Current-State Gap

### Lo que existe hoy

| Componente              | Endpoint                             | Estado                                                    |
| ----------------------- | ------------------------------------ | --------------------------------------------------------- |
| Profit & Loss           | `GET /api/reports/profit-loss`       | Baseline — agrega invoices PAID + bills PAID en PEN       |
| Balance Sheet           | `GET /api/reports/balance-sheet`     | Baseline — activos/pasivos/patrimonio con totales planos  |
| Cash Flow               | `GET /api/reports/cash-flow`         | Baseline — operativo/inversión/financiamiento en PEN      |
| Sales by Customer       | `GET /api/reports/sales-by-customer` | Baseline — agrupado por cliente en PEN                    |
| General Ledger (ledger) | `GET /api/ledger/general`            | Existe en módulo ledger separado — no integrado a reports |
| Trial Balance (ledger)  | `GET /api/ledger/trial-balance`      | Existe en módulo ledger separado — no integrado a reports |
| Export ledger PDF/XLSX  | `POST /api/ledger/export/{pdf,xlsx}` | Solo para general ledger, no para reports                 |

### Lo que falta

1. **PLE (Programa Libros Electrónicos):** No existe. Requiere generación de libros fiscalmente válidos en formato SUNAT (Libro Diario, Libro Mayor, Registro de Compras, Registro de Ventas).
2. **Versionado de API:** No existe — `/api/reports/*` sin prefijo de versión. Consumidores se rompen con cualquier cambio de schema.
3. **General Ledger integrado a reporting:** Existe en módulo `ledger` separado pero no está acoplado como primitivo de reporting. Reports consultan invoices/bills directo.
4. **Consolidación multi-empresa:** No existe. Cada reporte scoped a un solo `companyId`.
5. **Budget vs Actual:** No existe.
6. **Cost Center / Profit Center:** No existe reporting por centro de costo/beneficio.
7. **Exportable PDF/XLSX para reports:** Solo existe para ledger, no para P&L, Balance Sheet, Cash Flow, Sales by Customer.
8. **Custom Report Builder:** No existe. Todo reporte nuevo requiere ciclo de desarrollo.
9. **Report Scheduler & Distribution:** No existe. Reportes solo bajo demanda.

---

## Scope

### Phase 1 — Compliance & Foundation (URGENTE)

| #   | Capability                             | ID          | Rationale                                                                                                  |
| --- | -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **PLE (Programa Libros Electrónicos)** | CAP-RPT-PLE | Deadline SUNAT 2026. Clientes piden. Compliance risk si no está.                                           |
| 2   | **API Versioning** (`/v1/reports/...`) | CAP-RPT-VER | Permite evolucionar schemas sin romper consumidores. Previo a cualquier cambio de contrato.                |
| 3   | **General Ledger primitivo**           | CAP-RPT-06  | Fundación de reporting contable. Unifica queries de invoices, bills, y transactions en una capa de ledger. |
| 4   | **Multi-company consolidation**        | CAP-RPT-08  | Clientes operan grupos con 2-4 RUCs. Sin esto no pueden ver su posición financiera consolidada.            |

**Deliverables Phase 1:**

- Endpoints versionados bajo `/api/v1/reports/*` con contratos estables
- Módulo PLE que genera Libro Diario, Libro Mayor, Registro de Compras, y Registro de Ventas en formato SUNAT (txt estructurado + PDF firmable)
- General Ledger query unificado como fuente canónica para reports (migrando P&L, Balance Sheet, Cash Flow a leer del ledger)
- Multi-company consolidation queries con eliminación de transacciones inter-company y reportes consolidados (P&L, Balance Sheet)

**PLE acceptance criteria:**

- Libro Diario: asientos contables con formato 5.1 del PLE
- Libro Mayor: cuenta contable → movimientos acumulados por mes
- Registro de Compras: invoices recibidos con IGV, detracciones, retenciones
- Registro de Ventas: invoices emitidos con IGV, series SUNAT
- Todos los archivos pasan validación de estructura SUNAT vigente
- CDR hash y SUNAT response code almacenados por archivo generado

### Phase 2 — Planning & Analysis

| #   | Capability                      | ID         | Rationale                                                                                                                |
| --- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 5   | **Budget vs Actual**            | CAP-RPT-10 | Planeamiento financiero. Clientes necesitan comparar presupuesto contra ejecutado.                                       |
| 6   | **Cost Center / Profit Center** | CAP-RPT-07 | Reporting por centro de costo/beneficio. Requerido por firmas y grupos con múltiples unidades de negocio.                |
| 7   | **Exportable reports PDF/XLSX** | CAP-RPT-13 | Export de P&L, Balance Sheet, Cash Flow, Sales by Customer. Ya existe infraestructura en ledger-mvp para general ledger. |

**Deliverables Phase 2:**

- Budget vs actual: CRUD de budgets (anual, mensual, por cuenta), comparación contra ledger real
- Cost center tagging en transactions, reports agrupados por cost center / profit center
- PDF/XLSX export para: P&L, Balance Sheet, Cash Flow, Sales by Customer, Trial Balance (reutilizando infraestructura ledger-mvp de export)

### Phase 3 — Self-Service & Automation

| #   | Capability                          | ID         | Rationale                                                             |
| --- | ----------------------------------- | ---------- | --------------------------------------------------------------------- |
| 8   | **Custom Report Builder**           | CAP-RPT-15 | Demanda real de clientes. Cada firma tiene formatos y KPIs distintos. |
| 9   | **Report Scheduler & Distribution** | CAP-RPT-14 | Automatización de envío recurrente (email, dashboard, webhook).       |

**Deliverables Phase 3:**

- Report builder: wizard de selección de cuentas, períodos, centros de costo, formato (tabular/P&L-style/comparativo)
- Templates guardables y compartibles por empresa/firma
- Scheduler: CRON de generación, distribución por email (PDF/XLSX adjunto), webhook para integraciones
- Dashboard widget embebible con reportes programados

---

## Non-Goals (Explicit Scope Boundaries)

- **No reemplazar ledger-mvp:** El módulo ledger-mvp (SIRE Autopilot, NPIF, Monitor Fiscal) sigue siendo el dueño de la lógica fiscal. PLE consume datos del ledger; no reimplementa SIRE.
- **No modificar `analytics` ni `dashboard` en esta iniciativa:** Reports se mantiene como superficie independiente. La reconciliación con analytics/dashboard es un follow-up separado.
- **No migrar a multi-moneda real aún:** Phase 1 mantiene PEN como moneda base. La exchange-rate normalization se addressa como follow-up.
- **No builder visual drag-and-drop:** El custom report builder de Phase 3 es un wizard guiado, no un IDE de reportes. Un builder visual completo sería una iniciativa separada.
- **No integración con SUNAT API en vivo en Phase 1:** PLE genera archivos offline validables. La presentación automática ante SUNAT es un follow-up.

---

## Affected Areas

### Code

| Área                                 | Impacto                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `apps/api/src/features/reports/`     | Refactor significativo: versionado, nuevos endpoints, nuevos queries                                |
| `apps/api/src/features/ledger/`      | General Ledger se promueve a primitivo compartido; reports lo consume                               |
| `apps/api/src/features/ledger-mvp/`  | Infraestructura de export PDF/XLSX se extrae a shared concern                                       |
| `packages/domain/`                   | Nuevos value objects: `PleBook`, `Budget`, `CostCenter`, `ConsolidationGroup`                       |
| `packages/persistence/`              | Nuevas tablas: `ple_generations`, `budgets`, `cost_centers`, `report_templates`, `report_schedules` |
| `apps/api/src/api-module-surface.ts` | Registro de nuevas rutas versionadas                                                                |

### Teams & Workflows

- **Contadores:** PLE cambia su flujo de cierre mensual — de generar libros manualmente a generarlos desde Drenyra
- **Firmas contables:** Multi-company consolidation + PLE + custom reports = pueden manejar todo su portfolio de clientes desde Drenyra
- **Soporte:** Versionado de API + scheduler reducen tickets de "el reporte no carga" y "necesito este reporte todos los lunes"

### Data

- **PLE:** Nueva tabla `ple_generations` con hash CDR, SUNAT response, período, RUC
- **Budgets:** Nueva tabla `budgets` con período, cuenta, monto, tenant isolation
- **Cost Centers:** Nueva tabla `cost_centers` + FK en `transactions`
- **Scheduler:** Nueva tabla `report_schedules` + `report_generation_log`
- **Migration:** Datos existentes de invoices/bills no requieren migración — el ledger unificado los lee in-place

---

## Risks

| Riesgo                                                                                     | Severidad | Mitigación                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PLE deadline regulatorio** — no llegar a 2026 con PLE funcional                          | CRITICAL  | Phase 1 priorizado absoluto. Scope mínimo: Libro Diario + Libro Mayor + Registro Compras + Registro Ventas. Si hay que cortar, se corta multi-company antes que PLE.          |
| **Versionado confunde consumidores** — migración de `/api/reports/*` a `/api/v1/reports/*` | HIGH      | Old endpoints se mantienen con deprecation header (Sunset: 2027-01-01). Documentación clara de migración. Logging de consumidores legacy.                                     |
| **Multi-company requiere ledger multi-empresa** — los datos pueden no estar listos         | HIGH      | La consolidación se implementa con feature flag `MULTI_COMPANY_CONSOLIDATION`. Si el ledger no tiene datos multi-empresa, el endpoint devuelve `not_ready` con mensaje claro. |
| **PLE genera archivos fiscalmente inválidos** — validación SUNAT rechaza                   | MEDIUM    | Test suite con fixtures SUNAT conocidos. Validación estructural pre-generación. Compliance chain `ple-validation` con gate antes de permitir descarga.                        |
| **Custom report builder sobrecarga la DB** — queries ad-hoc no optimizados                 | MEDIUM    | Templates pre-definen columnas y filtros; no hay SQL arbitrario. Los queries generados pasan por query builder tipado con límites de complejidad.                             |

---

## Rollback & Sunset

- **API versioning:** `/api/reports/*` legacy se mantiene funcional con deprecation warning hasta 2027-01-01. Si hay incidente en `/v1/reports/*`, se desvía tráfico al legacy con feature flag.
- **PLE:** Si PLE genera archivos inválidos, se desactiva el endpoint con feature flag `PLE_ENABLED=false` sin afectar otros endpoints de reports.
- **Multi-company:** Feature flag `MULTI_COMPANY_CONSOLIDATION`. Rollback a single-company sin pérdida de datos.
- **Budget / Cost Center / Builder / Scheduler:** Cada uno tiene feature flag independiente. Rollback granular.

---

## Success Criteria

1. **PLE funcional** — genera los 4 libros electrónicos con formato SUNAT válido (validado contra fixtures conocidos)
2. **Endpoints versionados** — `/api/v1/reports/*` sirve todos los reportes existentes + nuevos con contratos estables; endpoints legacy siguen funcionales
3. **General Ledger unificado** — P&L, Balance Sheet, y Cash Flow consultan el ledger como fuente canónica (no invoices/bills directo)
4. **Consolidación multi-empresa** — un grupo de 3 RUCs puede obtener P&L y Balance Sheet consolidados con eliminación inter-company
5. **Budget vs Actual** — budget se crea, se compara contra ledger real, diferencia se expone en endpoint
6. **Cost Center reporting** — P&L y Trial Balance se pueden filtrar/agrupar por centro de costo
7. **Export PDF/XLSX** — cualquier reporte (P&L, BS, CF, Sales by Customer, Trial Balance) se exporta en ambos formatos
8. **Custom Report Builder** — un usuario no-técnico crea un reporte seleccionando cuentas, período, centros de costo; lo guarda como template
9. **Report Scheduler** — un reporte se programa (diario/semanal/mensual), se genera automáticamente, y se envía por email

---

## Dependencies

| Dependencia                                     | Estado               | Impacto si no está                                                 |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `ledger` module (General Ledger, Trial Balance) | Existe               | Sin ledger, P&L/BS/CF siguen con queries directos a invoices/bills |
| `ledger-mvp` export infra (PDF/XLSX)            | Existe               | Reutilizar en vez de reconstruir                                   |
| `companyScopeGuard` (RUC isolation)             | Existe               | Requerido para multi-company consolidation                         |
| `Money` value object (`@drenyra/domain`)        | Existe               | Usado para todos los cálculos monetarios                           |
| `fiscal-compliance-pipeline` chains             | Existen parcialmente | PLE requiere chain `ple-generation` + `ple-validation` nuevos      |

---

## User Decisions (Captured)

> Estas decisiones fueron recolectadas en ronda de preguntas de proposal y están incorporadas al scope.

1. **PLE en Phase 1, no Phase 2** — deadline regulatorio 2026. Clientes ya piden PLE. Es el ítem más urgente del initiative.
2. **API versioning** — `/v1/reports/...` como prefijo. Endpoints legacy mantenidos con deprecation.
3. **Multi-company adelantado** — mayoría de clientes opera grupos con 2-4 RUCs. La consolidación sube de prioridad.
4. **Custom report builder adelantado** — demanda real de clientes. Pasó de Phase 4 a Phase 3.
5. **No preguntar de nuevo sobre estas decisiones** — están baked in.

---

## Open Questions (for spec phase)

1. **PLE exact format:** ¿SUNAT requiere txt plano (formato 5.1 actual) o ya hay migración a XML/XSD? Verificar normativa vigente 2026.
2. **Multi-company inter-company elimination:** ¿Solo eliminación de cuentas por cobrar/pagar entre RUCs del grupo, o también revenue/expense elimination?
3. **Custom report builder scope:** ¿Solo financial statements o también operational reports (inventory, payroll)?
4. **Cost center hierarchy:** ¿Jerarquía plana (lista de tags) o jerarquía tree (parent/child cost centers)?
5. **PLE filing automation:** ¿La presentación automática ante SUNAT (PLE-SUNAT bridge) va como follow-up inmediato post-Phase-1 o espera a Phase 2+?
