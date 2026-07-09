# Drenyra SDD Skill

> **Trigger**: sdd, solicitud, proposal, spec, analysis, design, tasks, migration, audit, SDD workflow
> **Scope**: `project`

## Purpose

Guide AI agents through the Drenyra SDD pipeline — a fiscal-domain adaptation of the Gentlemen SDD lifecycle.

## Phase Mapping

| Gentlemen SDD | Drenyra Fiscal SDD |
| ------------- | ------------------ |
| proposal      | solicitud          |
| spec          | análisis           |
| design        | diseño             |
| tasks         | plan               |
| apply         | migración          |
| verify        | auditoría          |

## Phase Requirements

### solicitud (Proposal)

- Define fiscal scope: RUC, company, period
- Identify applicable normativa (SUNAT, SIRE, IGV, etc.)
- State current-state gap in fiscal terms
- Define acceptance criteria with fiscal evidence

### análisis (Spec)

- Document affected SUNAT/SIRE flows
- Specify data contracts with fiscal schemas
- Define test scenarios for fiscal correctness
- Include audit trail requirements

### diseño (Design)

- Architecture decisions with fiscal evidence chain
- Tenant isolation strategy
- Error recovery and reversal paths
- Confidence thresholds for AI-driven fiscal actions

### plan (Tasks)

- Phase-gate sequenced tasks
- Compliance gate checkpoints
- Review workload forecast with fiscal risk

### migración (Apply)

- Implement with fiscal evidence logging
- Run `compliance:sire-gate` before declaring complete
- Record all phase gate verdicts

### auditoría (Verify)

- Validate against solicitud acceptance criteria
- Run `compliance:sire-repro` verification
- Produce verify report with fiscal evidence

## Artifact Keys

| Phase     | Key                           |
| --------- | ----------------------------- |
| explore   | `sdd/{change}/explore`        |
| solicitud | `sdd/{change}/proposal`       |
| análisis  | `sdd/{change}/spec`           |
| diseño    | `sdd/{change}/design`         |
| plan      | `sdd/{change}/tasks`          |
| migración | `sdd/{change}/apply-progress` |
| auditoría | `sdd/{change}/verify-report`  |
