# Specification — Drenyra Web Agentic Accounting Philosophy

## Requirements

### Requirement 1: Web command center model

The web app SHALL define itself as an agentic fiscal command center focused on supervised accounting operations.

#### Acceptance criteria

- The web philosophy names the primary workspace model: navigation, central work area, evidence/agent/approval context.
- It distinguishes command-center work from generic dashboards.
- It maps existing web plans to the target experience.

### Requirement 2: Evidence-first agentic UX

Every agentic accounting recommendation in the web app SHALL expose evidence, confidence, scope, and approval state.

#### Acceptance criteria

- Recommendations show source records or documents.
- Recommendations show affected company/RUC/period.
- Recommendations show confidence and unresolved risks.
- Risky actions require explicit approval.

### Requirement 3: Workflow-first accounting surfaces

The web app SHALL prioritize fiscal/accounting workflows over disconnected feature pages.

#### Acceptance criteria

- Monthly close, SIRE, reconciliation, and invoice review are treated as flagship workflows.
- Navigation and command surfaces support outcome-first entry points.
- Existing feature routes can remain, but should be subordinated to workflow goals.

### Requirement 4: Cognitive load reduction

The web app SHALL apply progressive disclosure and review empathy to complex fiscal workflows.

#### Acceptance criteria

- First-level screens summarize status, next action, risk, and blocked reasons.
- Drill-down screens expose rule details, source data, and audit history.
- UI copy avoids magical AI claims and explains why recommendations exist.

### Requirement 5: Shared fiscal operating model

The web app SHALL align with CLI fiscal context and evidence semantics.

#### Acceptance criteria

- Web and CLI use compatible concepts for company, RUC, period, evidence, approvals, and reversals.
- A workflow started in one surface can be explained from the other surface where technically feasible.
