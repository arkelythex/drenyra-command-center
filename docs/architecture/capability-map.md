# Drenyra Capability Map

**Última actualización:** 2026-07-24
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
| CAP-LEDGER-01 | PCGE (Plan Contable)                      | —                         | ◌              |
| CAP-LEDGER-02 | Journal Entry posting                     | —                         | ◌              |
| CAP-LEDGER-03 | Ledger inmutable con compensating entries | —                         | ◌              |
| CAP-LEDGER-04 | Accounting periods lifecycle              | —                         | ◌              |
| CAP-LEDGER-05 | Exchange rates                            | —                         | ◌              |
| CAP-LEDGER-06 | Money value object y cálculos             | `packages/domain`         | ✅ implemented |
| CAP-LEDGER-07 | Accounting diff & materiality             | `drenyra-accounting-diff` | ✅ applied     |

---

## Evidence & Receipts

| ID          | Capability                     | SDD existente                                        | Estado     |
| ----------- | ------------------------------ | ---------------------------------------------------- | ---------- |
| CAP-EVID-01 | Evidence Graph                 | `drenyra-evidence-vault`, `drenyra-evidence-vault-2` | ✅ applied |
| CAP-EVID-02 | Receipt-Driven Execution (RED) | —                                                    | ◌          |
| CAP-EVID-03 | Fiscal Truth promotion         | —                                                    | ◌          |
| CAP-EVID-04 | Audit trail inmutable          | —                                                    | ◌          |

---

## Documents & Tax Peru

| ID          | Capability                            | SDD existente               | Estado    |
| ----------- | ------------------------------------- | --------------------------- | --------- |
| CAP-SIRE-00 | SIRE Reconciliation                   | `cap-sire-00` (worktree)    | ⚡ active |
| CAP-SIRE-01 | SIRE RCE proposal ingestion           | —                           | ◌         |
| CAP-SIRE-02 | SIRE RVIE comparison                  | —                           | ◌         |
| CAP-SIRE-03 | SIRE replacement candidate            | —                           | ◌         |
| CAP-SIRE-04 | SIRE submission & CDR                 | —                           | ◌         |
| CAP-SIRE-05 | SIRE UNKNOWN reconciliation           | —                           | ◌         |
| CAP-SIRE-06 | SIRE evidence receipt                 | —                           | ◌         |
| CAP-DOC-01  | CPE source document ingestion         | —                           | ◌         |
| CAP-DOC-02  | UBL 2.1 / XML processing              | —                           | ◌         |
| CAP-DOC-03  | Document series y correlativos        | —                           | ◌         |
| CAP-TAX-01  | IGV determination                     | —                           | ◌         |
| CAP-TAX-02  | Detracciones                          | —                           | ◌         |
| CAP-TAX-03  | Retenciones y percepciones            | —                           | ◌         |
| CAP-TAX-04  | Income Tax (Renta)                    | —                           | ◌         |
| CAP-TAX-05  | PLE (Programa de Libros Electrónicos) | —                           | ◌         |
| CAP-TAX-06  | SUNAT authentication & SOL            | `drenyra-h2-sunat-platform` | ○ draft   |

---

## Close & Reconciliation

| ID           | Capability                           | SDD existente          | Estado     |
| ------------ | ------------------------------------ | ---------------------- | ---------- |
| CAP-CLOSE-01 | Monthly close workflow               | `drenyra-cierre-flow`  | ✅ applied |
| CAP-CLOSE-02 | Bank reconciliation                  | `smart-reconciliation` | ○ draft    |
| CAP-CLOSE-03 | Variance analysis & gates            | —                      | ◌          |
| CAP-CLOSE-04 | Materiality engine                   | —                      | ◌          |
| CAP-CLOSE-05 | Correction, reversal & rectification | —                      | ◌          |

---

## Agent Runtime & AI

| ID           | Capability                          | SDD existente                     | Estado     |
| ------------ | ----------------------------------- | --------------------------------- | ---------- |
| CAP-AGENT-01 | Agent orchestration harness         | `drenyra-h0-agentic-harness`      | ○ draft    |
| CAP-AGENT-02 | Capability matrix & deny-by-default | `drenyra-agent-capability-matrix` | ✅ active  |
| CAP-AGENT-03 | Agent skills & tools registry       | `drenyra-skills-automations`      | ✅ applied |
| CAP-AGENT-04 | Multi-agent orchestration           | `multi-agent-orchestration`       | ○ draft    |
| CAP-AGENT-05 | Agent context & memory              | —                                 | ◌          |
| CAP-AGENT-06 | AI safety & approval gates          | `drenyra-fiscal-agent-discipline` | ○ draft    |
| CAP-AGENT-07 | Fiscal App Server (DFAS)            | `ADR-034` + DFAS spec             | ✅ active  |
| CAP-AGENT-08 | Agent evaluation & telemetry        | —                                 | ◌          |

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

| ID           | Capability                   | SDD existente | Estado |
| ------------ | ---------------------------- | ------------- | ------ |
| CAP-TREAS-01 | Bank accounts & connectivity | —             | ◌      |
| CAP-TREAS-02 | Bank transactions feed       | —             | ◌      |
| CAP-TREAS-03 | Cashflow projection          | —             | ◌      |
| CAP-TREAS-04 | Payments & disbursements     | —             | ◌      |

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
