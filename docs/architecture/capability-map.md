# Drenyra Capability Map

**Última actualización:** 2026-07-25 (expanded: +3 new areas, Treasury & Banking expanded from 4→11 capabilities)
**Content type:** Canonical — Capability Roadmap
**North star:** [Drenyra Product Philosophy](../products/drenyra-product-philosophy.md)
**Taxonomy:** [Program Taxonomy](./program-taxonomy.md)

> Cada capability es un nodo en el roadmap. Solo recibe un SDD cuando está cerca de ejecución.

---

## Foundation (F0)

Capacidades base que no deben romperse.

| ID           | Capability                           | SDD existente                            | Estado         |
| ------------ | ------------------------------------ | ---------------------------------------- | -------------- |
| CAP-FOUND-01 | Multi-tenancy e identity             | `drenyra-h02-tenant-isolation`           | review-pending |
| CAP-FOUND-02 | Auth, RBAC y permisos                | —                                        | ◌              |
| CAP-FOUND-03 | Organization/Company/RUC scoping     | `drenyra-h02-tenant-isolation`           | review-pending |
| CAP-FOUND-04 | Idempotencia canónica                | `ADR-009` + `drenyra-data-integrity`     | ✅ implemented |
| CAP-FOUND-05 | Outbox pattern y jobs                | `W2-06A`, `W2-07`                        | ✅ implemented |
| CAP-FOUND-06 | Domain contracts y tipos compartidos | `drenyra-x1-cross-stack-contracts`       | ✅ applied     |
| CAP-FOUND-07 | Observabilidad y telemetría          | `drenyra-observability`                  | ✅ implemented |
| CAP-FOUND-08 | Security baseline y threat model     | —                                        | ◌              |
| CAP-FOUND-09 | CI/CD y calidad                      | `drenyra-p4-ci-cd`, `drenyra-p3-testing` | ✅ applied     |
| CAP-FOUND-10 | Property-based testing               | `drenyra-x2-fiscal-property-testing`     | ✅ applied     |

---

## Ledger & Accounting Core

| ID            | Capability                                | SDD existente             | Estado         |
| ------------- | ----------------------------------------- | ------------------------- | -------------- |
| CAP-LEDGER-01 | PCGE (Plan Contable)                      | `drenyra-pcge-management` | ✅ applied     |
| CAP-LEDGER-02 | Journal Entry posting                     | `drenyra-pcge-management` | ✅ applied     |
| CAP-LEDGER-03 | Ledger inmutable con compensating entries | `drenyra-pcge-management` | 🟡 partial     |
| CAP-LEDGER-04 | Accounting periods lifecycle              | `drenyra-pcge-management` | ✅ applied     |
| CAP-LEDGER-05 | Exchange rates                            | `drenyra-pcge-management` | ✅ applied     |
| CAP-LEDGER-06 | Money value object y cálculos             | `packages/domain`         | ✅ implemented |
| CAP-LEDGER-07 | Accounting diff & materiality             | `drenyra-accounting-diff` | ✅ applied     |

---

## Evidence & Receipts

| ID          | Capability                     | SDD existente                                        | Estado     |
| ----------- | ------------------------------ | ---------------------------------------------------- | ---------- |
| CAP-EVID-01 | Evidence Graph                 | `drenyra-evidence-vault`, `drenyra-evidence-vault-2` | ✅ applied |
| CAP-EVID-02 | Receipt-Driven Execution (RED) | `drenyra-pcge-management` (RED feature)              | ✅ applied |
| CAP-EVID-03 | Fiscal Truth promotion         | `drenyra-evidence-vault-2`, `fiscal/truth/`          | ✅ applied |
| CAP-EVID-04 | Audit trail inmutable          | `drenyra-agent-audit-trail`                          | 🟡 partial |

---

## Documents & Tax Peru

| ID          | Capability                            | SDD existente                                   | Estado     |
| ----------- | ------------------------------------- | ----------------------------------------------- | ---------- |
| CAP-SIRE-00 | SIRE Reconciliation                   | `cap-sire-00` (worktree)                        | ⚡ active  |
| CAP-SIRE-01 | SIRE RCE proposal ingestion           | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-SIRE-02 | SIRE RVIE comparison                  | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-SIRE-03 | SIRE replacement candidate            | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-SIRE-04 | SIRE submission & CDR                 | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-SIRE-05 | SIRE UNKNOWN reconciliation           | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-SIRE-06 | SIRE evidence receipt                 | `drenyra-pcge-management` (SIRE batch)          | 🟡 partial |
| CAP-DOC-01  | CPE source document ingestion         | —                                               | ◌          |
| CAP-DOC-02  | UBL 2.1 / XML processing              | `drenyra-sunat`, `drenyra-electronic-invoicing` | ✅ applied |
| CAP-DOC-03  | Document series y correlativos        | `drenyra-pcge-management` (DOC-03 feature)      | ✅ applied |
| CAP-TAX-01  | IGV determination                     | `drenyra-pcge-management` (IGV calculator)      | ✅ applied |
| CAP-TAX-02  | Detracciones                          | —                                               | ◌          |
| CAP-TAX-03  | Retenciones y percepciones            | `drenyra-taxation`                              | ✅ applied |
| CAP-TAX-04  | Income Tax (Renta)                    | —                                               | ◌          |
| CAP-TAX-05  | PLE (Programa de Libros Electrónicos) | —                                               | ◌          |
| CAP-TAX-06  | SUNAT authentication & SOL            | `drenyra-h2-sunat-platform`                     | ○ draft    |

---

## Close & Reconciliation

| ID           | Capability                           | SDD existente                                 | Estado     |
| ------------ | ------------------------------------ | --------------------------------------------- | ---------- |
| CAP-CLOSE-01 | Monthly close workflow               | `drenyra-cierre-flow`                         | ✅ applied |
| CAP-CLOSE-02 | Bank reconciliation                  | `smart-reconciliation`                        | ○ draft    |
| CAP-CLOSE-03 | Variance analysis & gates            | `drenyra-pcge-management` (variance-analysis) | ✅ applied |
| CAP-CLOSE-04 | Materiality engine                   | `drenyra-pcge-management` (materiality)       | ✅ applied |
| CAP-CLOSE-05 | Correction, reversal & rectification | `drenyra-pcge-management` (corrections)       | ✅ applied |

---

## Agent Runtime & AI

| ID           | Capability                          | SDD existente                                            | Estado     |
| ------------ | ----------------------------------- | -------------------------------------------------------- | ---------- |
| CAP-AGENT-01 | Agent orchestration harness         | `drenyra-h0-agentic-harness`                             | ○ draft    |
| CAP-AGENT-02 | Capability matrix & deny-by-default | `drenyra-agent-capability-matrix`                        | ✅ active  |
| CAP-AGENT-03 | Agent skills & tools registry       | `drenyra-skills-automations`                             | ✅ applied |
| CAP-AGENT-04 | Multi-agent orchestration           | `multi-agent-orchestration`                              | ○ draft    |
| CAP-AGENT-05 | Agent context & memory              | `@drenyra/agent-memory`                                  | ✅ applied |
| CAP-AGENT-06 | AI safety & approval gates          | `drenyra-fiscal-agent-discipline`, `ai-tool-permissions` | 🟡 partial |
| CAP-AGENT-07 | Fiscal App Server (DFAS)            | `ADR-034` + DFAS spec                                    | ✅ active  |
| CAP-AGENT-08 | Agent evaluation & telemetry        | `ai-swarm/evaluation/`                                   | 🟡 partial |

---

## Studio & Platform

| ID          | Capability                | SDD existente                           | Estado      |
| ----------- | ------------------------- | --------------------------------------- | ----------- |
| CAP-STUD-01 | CLI — Fiscal Terminal     | `drenyra-cli-gentleman-fiscal-terminal` | ✅ archived |
| CAP-STUD-02 | API developer platform    | `drenyra-api-contracts`                 | ○ draft     |
| CAP-STUD-03 | Custom skills & workflows | —                                       | ◌           |
| CAP-STUD-04 | Model routing & providers | `drenyra-x3-provider-architecture`      | ✅ applied  |
| CAP-STUD-05 | Policy studio             | —                                       | ◌           |
| CAP-STUD-06 | Drenyra Studio (admin)    | —                                       | ◌           |

---

## Treasury & Banking

> CUENTA CON IMPLEMENTACIÓN PARCIAL: API banking (62 files, 19 tests), API banking-providers (8 files), API cashflow (9 files), WEB banking (44 files, 6 tests), WEB cashflow (19 files), Domain bank-account y bank-reconciliation. **No hay SDDs formales.**

| ID           | Capability                               | SDD existente                                  | Estado       |
| ------------ | ---------------------------------------- | ---------------------------------------------- | ------------ |
| CAP-TREAS-01 | Bank accounts & connectivity             | —                                              | 🟡 partial   |
| CAP-TREAS-02 | Bank transactions feed & import          | —                                              | 🟡 partial   |
| CAP-TREAS-03 | Bank reconciliation & matching           | `smart-reconciliation` (○ draft)               | 🟡 partial   |
| CAP-TREAS-04 | Auto-reconciliation engine               | —                                              | 🟡 partial   |
| CAP-TREAS-05 | Cashflow projection & forecasting        | —                                              | ◌            |
| CAP-TREAS-06 | Payments & disbursements                 | —                                              | ◌            |
| CAP-TREAS-07 | Liquidity management                     | —                                              | ◌            |
| CAP-TREAS-08 | Bank provider integrations (Belvo/Plaid) | —                                              | ◌            |
| CAP-TREAS-09 | CBDC / digital wallet                    | `apps/web/src/features/banking/cbdc/`          | 🟡 partial   |
| CAP-TREAS-10 | Treasury agent & automation              | `packages/infrastructure/src/agents/treasury/` | 🟡 partial   |
| CAP-TREAS-11 | Detracciones bancarias vinculadas        | `apps/api/src/features/detractions/`           | ⚡ exploring |

---

## UX & Design System

| ID        | Capability                         | SDD existente                                        | Estado     |
| --------- | ---------------------------------- | ---------------------------------------------------- | ---------- |
| CAP-UX-01 | Design tokens & theme system       | `drenyra-design-tokens-v4`                           | ✅ applied |
| CAP-UX-02 | Application shell & navigation     | `drenyra-three-panel-layout`, `drenyra-global-shell` | ✅ applied |
| CAP-UX-03 | Fiscal workspace & command center  | `drenyra-frontend-command-center-reset`              | ✅ applied |
| CAP-UX-04 | Evidence rail & approval inspector | —                                                    | ◌          |
| CAP-UX-05 | Accounting diff workspace          | —                                                    | ◌          |
| CAP-UX-06 | Accessibility & keyboard           | —                                                    | ◌          |
| CAP-UX-07 | Responsive & density modes         | `drenyra-component-states`                           | ✅ applied |
| CAP-UX-08 | Component library & Storybook      | —                                                    | ◌          |
| CAP-UX-09 | Onboarding & empty states          | `apps/web/src/features/onboarding/` (16 files)       | 🟡 partial |
| CAP-UX-10 | Print layouts & PDF reports        | —                                                    | ◌          |

---

## Invoicing, Purchases & AP

> NO EXISTÍA COMO SECCIÓN EN EL CAPABILITY MAP. Código existente detectado: API billing (64 files, 14 tests), API vendors (12 files), WEB invoices (87 files, 21 tests), WEB bills (20 files), WEB vendors (15 files), WEB credit-notes (10 files), WEB debit-notes (10 files).

| ID        | Capability                         | SDD existente                                         | Estado     |
| --------- | ---------------------------------- | ----------------------------------------------------- | ---------- |
| CAP-AP-01 | CPE ingestion & document reception | —                                                     | ◌          |
| CAP-AP-02 | Electronic invoicing (UBL 2.1)     | `drenyra-sunat`, `drenyra-electronic-invoicing`       | ✅ applied |
| CAP-AP-03 | Invoice lifecycle (emitted)        | `apps/api/src/features/billing/invoice/`              | 🟡 partial |
| CAP-AP-04 | Bill reception & AP (received)     | `apps/api/src/features/billing/bill/`                 | 🟡 partial |
| CAP-AP-05 | Credit & debit notes               | `apps/web/src/features/credit-notes/`, `debit-notes/` | 🟡 partial |
| CAP-AP-06 | Purchase orders                    | —                                                     | ◌          |
| CAP-AP-07 | Vendor/supplier management         | `apps/api/src/features/vendors/`, WEB vendors         | 🟡 partial |
| CAP-AP-08 | AP aging & payment scheduling      | —                                                     | ◌          |
| CAP-AP-09 | AP approval workflow               | —                                                     | ◌          |
| CAP-AP-10 | Retentions & perceptions on AP     | `drenyra-taxation`                                    | ✅ applied |
| CAP-AP-11 | Detractions on AP                  | —                                                     | ◌          |
| CAP-AP-12 | Supplier portal / self-service     | —                                                     | ◌          |
| CAP-AP-13 | Document series management         | `drenyra-pcge-management` (DOC-03)                    | ✅ applied |

---

## Reporting & Financial Statements

> NO EXISTÍA COMO SECCIÓN EN EL CAPABILITY MAP. Código existente: API reports (19 files, 4 tests), API dashboard (19 files), API cfo-analytics (9 files), API analytics (18 files), WEB dashboard (71 files, 9 tests), WEB cognitive-hub (152 files, 15 tests), Application financial-reports (balance-sheet, income-statement, trial-balance generators). Estado: "baseline slice, not final accounting authority".

| ID         | Capability                            | SDD existente                                 | Estado     |
| ---------- | ------------------------------------- | --------------------------------------------- | ---------- |
| CAP-RPT-01 | Profit & Loss statement               | API reports                                   | 🟡 partial |
| CAP-RPT-02 | Balance Sheet                         | API reports + `balance-sheet.generator.ts`    | 🟡 partial |
| CAP-RPT-03 | Cash Flow statement                   | API reports + `income-statement.generator.ts` | 🟡 partial |
| CAP-RPT-04 | Trial Balance                         | `trial-balance.generator.ts`                  | 🟡 partial |
| CAP-RPT-05 | Sales by customer report              | API reports                                   | 🟡 partial |
| CAP-RPT-06 | General ledger & journal detail       | —                                             | ◌          |
| CAP-RPT-07 | Cost center / profit center reporting | —                                             | ◌          |
| CAP-RPT-08 | Multi-company consolidated reporting  | —                                             | ◌          |
| CAP-RPT-09 | Period comparison & variance analysis | `drenyra-pcge-management` (variance-analysis) | ✅ applied |
| CAP-RPT-10 | Budget vs actual                      | —                                             | ◌          |
| CAP-RPT-11 | PLE (Programa Libros Electrónicos)    | —                                             | ◌          |
| CAP-RPT-12 | CFO analytics dashboard               | API cfo-analytics (9 files)                   | 🟡 partial |
| CAP-RPT-13 | Exportable reports (PDF/XLS)          | —                                             | ◌          |
| CAP-RPT-14 | Report scheduler & distribution       | —                                             | ◌          |
| CAP-RPT-15 | Custom report builder                 | —                                             | ◌          |

---

## Risk, Audit & Internal Controls

> NO EXISTÍA COMO SECCIÓN EN EL CAPABILITY MAP. Código existente detectado: API compliance (17 files, 9 tests), API governance-audit (7 files), API agent-audit-trail (30 files, 8 tests), API pse-compliance (5 files), WEB compliance (79 files, 8 tests), WEB audit (8 files), WEB control-tower (4 files), Domain audit-ledger (hash-chain), Infrastructure compliance/pre-audit agents.

| ID          | Capability                                | SDD existente                                         | Estado     |
| ----------- | ----------------------------------------- | ----------------------------------------------------- | ---------- |
| CAP-RISK-01 | Immutable audit trail (hash chain)        | `drenyra-agent-audit-trail` + domain audit-ledger     | 🟡 partial |
| CAP-RISK-02 | Governance audit log                      | API governance-audit (7 files)                        | 🟡 partial |
| CAP-RISK-03 | Compliance monitoring & alerts            | API compliance (17 files) + WEB compliance (79 files) | 🟡 partial |
| CAP-RISK-04 | PSE (Platform Stability & Efficiency)     | API pse-compliance (5 files)                          | 🟡 partial |
| CAP-RISK-05 | Control tower dashboard                   | WEB control-tower (4 files) + domain entity           | 🟡 partial |
| CAP-RISK-06 | Fiscal risk matrix                        | —                                                     | ◌          |
| CAP-RISK-07 | Internal controls (segregation, 4-eyes)   | —                                                     | ◌          |
| CAP-RISK-08 | Anomaly detection (AI-assisted)           | Infrastructure agents/compliance, agents/pre-audit    | 🟡 partial |
| CAP-RISK-09 | Policy enforcement engine                 | —                                                     | ◌          |
| CAP-RISK-10 | Audit report generation                   | —                                                     | ◌          |
| CAP-RISK-11 | Compliance runbooks & evidence collection | —                                                     | ◌          |
| CAP-RISK-12 | SUNAT compliance verification             | `drenyra-sunat` + SIRE capabilities                   | 🟡 partial |
| CAP-RISK-13 | Security incident response                | —                                                     | ◌          |

---

## Leyenda

| Símbolo                | Significado                                |
| ---------------------- | ------------------------------------------ |
| ✅ implemented/applied | Capacidad con SDD implementado y evidencia |
| ⚡ active              | En ejecución activa                        |
| ○ draft                | SDD existe pero en etapas tempranas        |
| ◌                      | Capacidad identificada, sin SDD aún        |

---

**Próximo paso:** [Auditar SDDs existentes](./sdd-audit.md) contra esta taxonomía y clasificarlos por nivel de madurez L0–L4.
