# Drenyra — SDD Program

Portafolio canónico de **55 Software Design Documents** para transformar Drenyra en un workspace fiscal contextual, evidence-first y human-approved para Perú, con expansión posterior a LATAM.

## Reglas de uso

- `APPROVED` significa que el diseño fue aceptado; no que el software esté implementado.
- `DONE` exige código, migración, pruebas, observabilidad, rollout y evidencia de producción.
- Cada SDD hijo hereda los invariantes, gates y non-goals de SDD-000.
- Un SDD hijo no puede redefinir contexto fiscal, evidencia, autorización, idempotencia o audit sin supersession explícita.
- La implementación sigue vertical slices: **SIRE → cierre mensual → IGV → documentos → banca → declaración/rectificación/auditoría**.

## Índice

| Ola | SDD | Documento | Estado inicial |
|---|---|---|---|
| 0 | 000 | Experience Transformation Program | APPROVED |
| 0 | 001 | User Roles, Personas and JTBD | APPROVED |
| 0 | 002 | Fiscal Domain Language and Information Architecture | PROPOSED |
| 0 | 003 | Current Experience and Redundancy Audit | PROPOSED |
| 0 | 004 | Critical Workflow Baseline | PROPOSED |
| 0 | 005 | Product and Design Governance | PROPOSED |
| 1 | 010 | Verified Fiscal Context Propagation | PROPOSED |
| 1 | 011 | Accounting Period Lifecycle | PROPOSED |
| 1 | 012 | Roles, Permissions and Segregation of Duties | PROPOSED |
| 1 | 013 | Fiscal Artifact Identity and Versioning | PROPOSED |
| 1 | 014 | Evidence and Provenance Graph | PROPOSED |
| 1 | 015 | Human Review and Approval Workflow | PROPOSED |
| 1 | 016 | Accounting Diff and Materiality Engine | PROPOSED |
| 1 | 017 | Correction, Reversal and Rectification | PROPOSED |
| 1 | 018 | Immutable Audit Ledger and Retention | PROPOSED |
| 1 | 019 | AI Action Safety Contract | PROPOSED |
| 1 | 020 | Durable Fiscal Execution | PROPOSED |
| 2 | 030 | Design Token Architecture | PROPOSED |
| 2 | 031 | Light and Black OLED Themes | PROPOSED |
| 2 | 032 | Typography, Numerals and Localization | PROPOSED |
| 2 | 033 | Density System | PROPOSED |
| 2 | 034 | Financial Data Grid | PROPOSED |
| 2 | 035 | Fiscal Forms and Validation | PROPOSED |
| 2 | 036 | Accessibility and Keyboard Navigation | PROPOSED |
| 2 | 037 | Application Shell and Navigation | PROPOSED |
| 2 | 038 | Persistent Fiscal Context Bar | PROPOSED |
| 2 | 039 | Adaptive Workspace and Inspector | PROPOSED |
| 2 | 040 | Command Palette and Universal Search | PROPOSED |
| 2 | 041 | Frontend Architecture and Performance | PROPOSED |
| 3 | 050 | Fiscal Attention Inbox | PROPOSED |
| 3 | 051 | Object-Centered Fiscal Workspace | PROPOSED |
| 3 | 052 | Evidence and Approval Inspector | PROPOSED |
| 3 | 053 | Accounting Review and Diff Workspace | PROPOSED |
| 3 | 054 | Contextual Agent Interaction | PROPOSED |
| 3 | 055 | Fiscal Cases, Tasks and Collaboration | PROPOSED |
| 3 | 056 | Execution Timeline and Activity | PROPOSED |
| 3 | 057 | Notifications and Deadline Management | PROPOSED |
| 3 | 058 | Automations Control Center | PROPOSED |
| 3 | 059 | Fiscal Rules and Skills Administration | PROPOSED |
| 4 | 070 | Company Onboarding and Data Readiness | PROPOSED |
| 4 | 071 | CPE and Source Document Ingestion | PROPOSED |
| 4 | 072 | SIRE Reconciliation Workspace | PROPOSED |
| 4 | 073 | Banking Reconciliation Workspace | PROPOSED |
| 4 | 074 | IGV Determination Workspace | PROPOSED |
| 4 | 075 | Monthly Close Command Workspace | PROPOSED |
| 4 | 076 | Tax Filing and Pre-submission Review | PROPOSED |
| 4 | 077 | Rectification Workflow | PROPOSED |
| 4 | 078 | Audit and Evidence Export | PROPOSED |
| 5 | 090 | Privacy, Security and Sensitive Data UX | PROPOSED |
| 5 | 091 | Cross-layer Verification Strategy | PROPOSED |
| 5 | 092 | Visual Regression and Design QA | PROPOSED |
| 5 | 093 | Product Observability and UX Telemetry | PROPOSED |
| 5 | 094 | Legacy UI Migration and Deprecation | PROPOSED |
| 5 | 095 | Progressive Rollout and Feature Flags | PROPOSED |
| 5 | 096 | Onboarding, Documentation and Supportability | PROPOSED |

## Ruta mínima de aprobación antes del primer vertical slice

`000 → 001 → 002 → 010 → 011 → 012 → 014 → 015 → 019 → 020 → 034 → 037 → 038 → 039 → 051 → 052 → 053 → 054 → 056 → 072`

## Definition of Done común

Un SDD solo pasa a `DONE` cuando sus contratos están implementados, sus migraciones son seguras, los casos adversariales están probados, la accesibilidad y rendimiento cumplen sus budgets, la telemetría está activa, existe rollback y la evidencia de verificación está adjunta.
