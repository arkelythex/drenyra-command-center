# Specification — Drenyra North Star Philosophy

## Requirements

### Requirement 1: Product north star

Drenyra SHALL define a canonical product north star that positions the platform as an agentic fiscal intelligence system, not a generic ERP or chatbot UI.

#### Acceptance criteria

- The north star names fiscal correctness, tenant/RUC scoping, auditability, reversibility, and human approval as product guarantees.
- The north star explicitly states that external products are references, not templates to copy.
- The north star applies to web, CLI, agents, docs, and review workflow.

### Requirement 2: Agentic accounting guardrails

Every new agentic accounting workflow SHALL document its decision evidence, approval level, fiscal scope, and reversal behavior before implementation.

#### Acceptance criteria

- Plans include evidence source requirements.
- Plans include approval requirements for high-risk actions.
- Plans include audit trail requirements.
- Plans include tenant/company/RUC scoping requirements.

### Requirement 3: Surface alignment

The web app and CLI SHALL be defined as complementary surfaces of one fiscal operating system.

#### Acceptance criteria

- Web philosophy covers visual command center workflows.
- CLI philosophy covers terminal-native fiscal operations.
- Both surfaces share fiscal context, evidence, approvals, and audit concepts.
- Neither surface introduces unsupervised fiscal mutation as a default.

### Requirement 4: Review workload protection

The philosophy rollout SHALL follow the 400-line review budget and auto-forecast PR splitting.

#### Acceptance criteria

- Tasks are sliced into reviewable PRs.
- Oversized docs/code changes are split or explicitly justified.
- Review path is documented for each implementation slice.

### Requirement 5: Documentation integration

The philosophy SHALL become discoverable from the repo's navigation and agent guidance.

#### Acceptance criteria

- `openspec/master-index.md` includes this strategic track.
- `openspec/config.yaml` includes the new plans.
- Future implementation should update `AGENTS.md`, `CODEX-MAP.md`, `apps/web/MAP.md`, `apps/cli/MAP.md`, and canonical product docs.
