# Ecosystem Audit Readiness Specification

## Purpose

Coordinate the Drenyra ecosystem's production/audit-readiness program as an umbrella change that owns the program plan, dependency order, evidence ledger, and completion decision — without implementing product code, without editing sibling repositories, and without duplicating child SDD authority. Each implementation unit (children C1–C7) is owned by an independent repository-local SDD. This spec defines the invariants the umbrella program SHALL satisfy: repository-local child authority, executable-vs-blocked dependency state, H02 resume-not-duplicate, mandatory C1–C6 closure with conditional C7 opening, 300-line forecasting with chaining and explicit exceptions, a program-owner-maintained evidence ledger, evidence-backed quality gates, exact ownership and rollback rules, and current-web research provenance.

Every requirement below describes what must be true of the program's artifacts, decisions, and recorded evidence. No requirement claims that any child implementation, review approval, or release has occurred; requirements are satisfied by the program's planning and coordination artifacts and the evidence they record.

## Requirements

### Requirement: Repository-Local Child Authority

Each child SHALL be owned by exactly one repository, and every delivery unit SHALL be confined to its owning repository. The umbrella change SHALL NOT modify product source in Drenyra, `drenyra-pi`, `drenyra-ai`, or `drenyra-engram`, and SHALL NOT create cross-repository commits, diffs, reviews, receipts, PRs, or releases. Child owners SHALL supply immutable, repository-local evidence for their own proposal, specification, design, tasks, implementation, verification, review, and delivery.

- Child ownership: C1–C4 and C6 are owned by `Drenyra`; C5 by `drenyra-pi`; C7 by `drenyra-ai` and/or `drenyra-engram`.
- The umbrella SHALL reference child authority (state paths, review/receipt references, immutable revisions) but SHALL NOT act as that authority.

#### Scenario: Sibling repository remains untouched

- GIVEN the umbrella change is active
- WHEN any planning artifact records a child delivery or state transition
- THEN every referenced child change and unit resolves to a path inside exactly one owning repository
- AND NO referenced path or unit spans more than one repository

#### Scenario: Umbrella planning artifacts contain no product writes

- GIVEN a review of the umbrella change's diff
- WHEN the diff is inspected for modified files
- THEN every changed path is under the Drenyra `openspec/` coordination tree or an explicitly allowed planning root
- AND NO product source path (e.g., `apps/`, `packages/`, sibling repo paths) is modified

Acceptance evidence: umbrella change diff restricted to planning artifacts; dependency/executability matrix with one repository per child row; each child's delivery boundary identified by repository.

### Requirement: Executability and Dependency State

A child SHALL be considered executable only when its repository-local lifecycle state permits execution and every hard dependency has recorded ledger evidence that it is satisfied, blocked, or not applicable. Work in `review-pending`, `implementation-blocked`, or with no `state.yaml` SHALL NEVER be described as runnable, and blocked work SHALL NOT consume downstream execution. The program SHALL maintain a dependency/executability matrix that distinguishes executable, blocked, and conditional work at all times.

- Known non-executable baseline: `drenyra-h02-tenant-isolation` (`review-pending`), `drenyra-accountant-operating-system` (`implementation-blocked`), `drenyra-risk-audit` (no `state.yaml`).
- Default sequence: C1 → C2 → C3 → C4 is the hard Drenyra chain; C5 is independent; C6 waits for C1 and C5; C7 is conditional.

#### Scenario: Review-pending child is not advertised as runnable

- GIVEN `drenyra-h02-tenant-isolation` remains at `status: review-pending`
- WHEN the program records or communicates child status
- THEN C1 and every child depending on it are recorded as blocked or non-executable
- AND NO artifact labels C1 apply work, a dependent child, or downstream readiness as runnable

#### Scenario: Missing dependency evidence blocks downstream execution

- GIVEN a child whose hard dependency lacks a ledger entry proving satisfied/blocked/not-applicable state
- WHEN the program evaluates that child's executability
- THEN the child SHALL be recorded as non-executable
- AND its outcome SHALL remain `blocked` until the dependency evidence exists

#### Scenario: C2–C3 ordering refinement requires proof

- GIVEN a child proposal that reorders C2 relative to C3
- WHEN the reordering is considered
- THEN the child SHALL record evidence of no overlapping dependency and the decision SHALL be entered in the ledger
- AND the C1 precedence SHALL NOT be bypassed

Acceptance evidence: matrix rows carry current executability and dependency state; ledger entries for each hard dependency; no artifact describes a blocked child as executable.

### Requirement: H02 Resume-Not-Duplicate

C1 SHALL resume the existing `drenyra-h02-tenant-isolation` change at its current review gate; the program SHALL NOT create a replacement or duplicate tenant-isolation SDD. While H02 remains `review-pending`, no C1 apply work, no dependent child, and no "executable" label SHALL exist. Review findings SHALL be resolved within H02's own lifecycle and evidence trail. Once approved, execution SHALL continue through the existing W0–W6 plan, split only into bounded delivery units that preserve H02's acceptance criteria.

#### Scenario: H02 is resumed at its review gate

- GIVEN `drenyra-h02-tenant-isolation` has `phase: tasks`, `status: review-pending`, waves W0–W6 defined
- WHEN the program starts C1
- THEN the first recorded C1 action is resumption of the existing H02 change at its review gate
- AND NO new tenant-isolation change directory or proposal is created under any repository

#### Scenario: Review-pending blocks all C1 downstream labels

- GIVEN H02's review is not yet approved
- WHEN any artifact is written that touches C1 or its dependents (C2, C3, C4, C6)
- THEN that artifact SHALL record the children as blocked pending H02 review approval
- AND SHALL NOT claim executable status, apply progress, or readiness for them

#### Scenario: H02 approval resumes wave execution

- GIVEN H02's review is approved within its own lifecycle
- WHEN C1 execution resumes
- THEN work proceeds through the existing W0–W6 plan in bounded repo-local units
- AND C1 completion evidence requires H02 `state.yaml` to reach `archived` with its acceptance criteria preserved

Acceptance evidence: H02 change path reused with unchanged authority; ledger records review resolution inside H02's trail; no duplicate tenant-isolation SDD anywhere; C1 completion evidence includes H02 archived state.

### Requirement: Mandatory C1–C6 Closure and Conditional C7 Opening

The ecosystem SHALL NOT be described as audit-ready or ecosystem-wide ready until C1–C6 are closed with repository-local evidence. Until then, status SHALL be capability-scoped only. C7 SHALL remain conditional and closed by default; it opens only when all opening rules are demonstrated, and its non-opening SHALL NOT block program closure.

C7 opening rules (all required): (1) an executing C2–C5 child provides a minimal reproducible case showing the outcome cannot be achieved through an existing released public contract or consumer-local adapter; (2) evidence identifies the exact missing/contradictory contract behavior, affected producer repository, affected consumers, and current immutable producer version; (3) the child records why a consumer-local change would violate ownership, duplicate canonical logic, weaken conformance, or create unacceptable operational risk; (4) the proposed core change is the smallest contract-level correction with named conformance scenarios; (5) a new independent child SDD is created in each affected core repository, and no consumer child writes core code; (6) frozen public-surface changes follow the producer's versioning policy, with a major release for breaking frozen-contract changes; (7) producer tests and conformance suites pass, a versioned release is published through normal gates, and every affected consumer pins and verifies that exact release before the originating child closes.

#### Scenario: Capability-scoped status before full closure

- GIVEN C1–C6 are not all closed
- WHEN the program or any artifact describes readiness
- THEN the description SHALL be scoped to specific closed capabilities with their evidence
- AND SHALL NOT claim ecosystem-wide or audit-ready status

#### Scenario: C7 remains closed by default

- GIVEN no executing C2–C5 child has demonstrated a qualifying core gap
- WHEN the program records C7 status
- THEN C7 SHALL be recorded as conditional/not required
- AND the program SHALL NOT describe C7 as planned implementation work

#### Scenario: C7 opens only through the decision rules

- GIVEN an executing C2–C5 child claims a core-contract gap
- WHEN the program evaluates opening C7
- THEN all seven opening rules SHALL be demonstrated with recorded evidence (reproducible case, exact contract behavior, ownership rationale, smallest correction with conformance scenarios, independent core child SDDs, versioning policy, and published release with consumer pin/verification)
- AND C7 SHALL NOT open for cleanup, migration preference, speculative reuse, version freshness, convenience, or shim aesthetics
- AND if the gap can be closed safely in the consumer, the consumer child SHALL retain the work

Acceptance evidence: program status records closure state per child; capability-scoped statements cite per-child evidence; C7 ledger entries record conditional/not-required or full opening-rules evidence.

### Requirement: 300-Line Forecasting and Chain Requirement

Every implementation/review unit SHALL have a pre-apply forecast of authored changed lines (additions plus deletions). A unit forecast to exceed 300 changed lines SHALL automatically produce a dependency-ordered chain of smaller repo-local units before apply, with each unit's intent, estimated lines, dependency, acceptance evidence, and rollback boundary recorded. A unit SHALL exceed 300 lines only through an explicit decision recorded before apply with rationale, alternatives considered, and reviewer-impact mitigation, approved by the Drenyra program owner; the umbrella SHALL NOT grant blanket or implied exceptions. Generated files and unavoidable mechanical artifacts SHALL be identified separately and SHALL NOT justify hiding conceptual scope.

#### Scenario: Oversized forecast decomposes into a chain

- GIVEN a child forecasts a unit above 300 changed lines
- WHEN the child tasks are defined
- THEN the tasks SHALL define a dependency-ordered chain of units, each with its own forecast at or below 300 lines, intent, dependency, acceptance evidence, and rollback boundary
- AND the ledger SHALL record the forecast and chain position before apply

#### Scenario: Explicit exception requires program-owner approval

- GIVEN a child believes a safe unit boundary above 300 lines cannot be formed
- WHEN the child requests an exception
- THEN the request SHALL be recorded before apply with rationale, alternatives considered, and reviewer-impact mitigation
- AND the Drenyra program owner SHALL approve the exception explicitly
- AND the approved exception SHALL be recorded in the umbrella evidence ledger

#### Scenario: Forecast is required before any apply

- GIVEN a unit is ready to begin implementation
- WHEN the child enters apply
- THEN a pre-apply forecast of authored changed lines exists for that exact unit
- AND generated/mechanical artifacts are identified separately in the forecast

Acceptance evidence: per-unit forecast recorded pre-apply; chain definitions for forecast-over-300 units; exception records with program-owner approval; actual changed lines recorded post-delivery.

### Requirement: Program-Owner Evidence Ledger

The Drenyra program owner SHALL maintain a single umbrella evidence ledger and SHALL update it after every child lifecycle transition, quality gate, approved review, release, rollback, or newly discovered blocker. Each entry SHALL contain: child and unit identifier (C1–C7, child change name, repository, bounded unit/PR identifier); authority (repository-local SDD state path or topic, review/receipt reference, immutable revision when available); dependency state (required predecessors and evidence each is satisfied, blocked, or not applicable); scope and forecast (baseline defect closed, intended paths/areas, estimated and actual changed lines, chain position); verification (commands/checks run, exit/result, test counts where meaningful, acceptance-criterion mapping); external evidence (only externally uncertain facts needed by that child, with primary source, URL, retrieval date, and requirement/design decision affected); version evidence (producer version/tag, consumer pin, artifact checksum or equivalent identity, conformance result where contracts cross repos); outcome (planned, blocked, executing, verified, delivered, rolled back, or superseded, with reason and timestamp); and follow-ups (non-blocking findings, owner, target child or future program).

A ledger entry SHALL be evidence, not a status assertion: unsupported "green", "ready", or "compatible" labels SHALL be invalid.

#### Scenario: Ledger updated after every gate transition

- GIVEN a child completes a lifecycle transition, quality gate, approved review, release, rollback, or blocker discovery
- WHEN the program advances
- THEN a ledger entry SHALL be created or updated for that child/unit with all required fields
- AND the entry SHALL cite repository-local authority and verification evidence

#### Scenario: Dependency evidence precedes executability

- GIVEN a child is to be marked executable
- WHEN the dependency gate is evaluated
- THEN the ledger SHALL already contain entries proving each hard dependency's satisfied/blocked/not-applicable state
- AND the child SHALL NOT be marked executable before those entries exist

#### Scenario: Assertion without evidence is rejected

- GIVEN a child reports "green" or "ready"
- WHEN the outcome is recorded
- THEN the ledger SHALL contain the commands/checks run, exit/result, and acceptance-criterion mapping supporting that claim
- AND a bare label without supporting evidence SHALL be recorded as unsupported and SHALL NOT advance any gate

Acceptance evidence: ledger exists in the Drenyra coordination tree; entries match the field set above; every dependency transition and gate has a dated entry with authority reference.

### Requirement: Quality-Gate and Evidence Semantics

Every quality gate SHALL be satisfied only by recorded evidence from the owning child repository; umbrella approval SHALL NOT substitute for child evidence or for the child's native review. The program SHALL apply the twelve gates: (1) lifecycle and dependency, (2) scope, (3) size and chain, (4) characterization/TDD, (5) repository regression, (6) security and isolation, (7) fiscal integrity, (8) live dependency, (9) contract and release, (10) review and delivery, (11) ledger, and (12) rollback. Behavior-sensitive changes SHALL begin with characterization or failing tests under the repository's strict-TDD policy; money/fiscal serialization changes SHALL prove deterministic, drift-free results; readiness work SHALL prove both success and failure/degraded semantics; tenant/authorization/SoD/failure-path changes SHALL include negative tests and fail-closed behavior.

#### Scenario: Gate passes only with child-repo evidence

- GIVEN a child claims a quality gate is satisfied
- WHEN the gate is recorded
- THEN the ledger SHALL cite concrete commands and results from that child's repository
- AND NO gate SHALL be recorded as satisfied on umbrella status alone

#### Scenario: Fiscal integrity requires drift-free evidence

- GIVEN a money or fiscal serialization change in C2
- WHEN the fiscal integrity gate is evaluated
- THEN the child SHALL record characterization/regression evidence showing deterministic, drift-free results against expected values
- AND floating-point tolerance SHALL NOT be accepted as satisfying the gate

#### Scenario: Live readiness proves failure semantics

- GIVEN a readiness change in C4
- WHEN the live dependency gate is evaluated
- THEN evidence SHALL cover both ready behavior with real test services and fail-closed/degraded behavior when dependencies are absent
- AND missing infrastructure SHALL NOT be silently skipped

#### Scenario: Negative tests required for security changes

- GIVEN a tenant, authorization, SoD, or failure-path change
- WHEN the security and isolation gate is evaluated
- THEN negative tests and fail-closed behavior SHALL be part of the recorded evidence
- AND happy-path checks alone SHALL NOT satisfy the gate

Acceptance evidence: gate results recorded per child with commands and exit/results; gate-to-acceptance-criterion mapping in the ledger; no gate recorded satisfied without child-repo evidence.

### Requirement: Exact Ownership and Rollback Rules

The Drenyra program owner SHALL be the accountable authority for the umbrella evidence ledger and for approving pre-apply line-limit exceptions; child owners SHALL provide immutable, repository-local evidence for their own units. Rollback SHALL be repository-local: revert the smallest delivered child unit or restore its prior consumer pin; preserve ledger history and mark the outcome `rolled back` with reason and evidence; re-evaluate downstream executability because rollback may invalidate dependency evidence; never compensate for one repository by silently mutating a sibling; never reopen C7 without re-satisfying its opening rules. The program SHALL be pausable without reverting completed child work.

#### Scenario: Rollback stays in the owning repository

- GIVEN a delivered unit must be rolled back
- WHEN rollback executes
- THEN the smallest delivered unit in its owning repository is reverted, or the prior consumer pin is restored
- AND NO sibling repository is silently mutated as compensation

#### Scenario: Rollback updates ledger and downstream state

- GIVEN a unit is rolled back
- WHEN the program records the outcome
- THEN the ledger SHALL mark the unit `rolled back` with reason and evidence, preserving prior history
- AND downstream executability SHALL be re-evaluated because dependency evidence may be invalidated

#### Scenario: Program pause preserves child work

- GIVEN the umbrella is paused (blocked child, failed gate, missing dependency evidence, or non-compliant forecast)
- WHEN the program records the pause
- THEN completed child work SHALL NOT be reverted
- AND the stopping cause and affected children SHALL be recorded in the ledger

Acceptance evidence: ledger entries with `rolled back` outcomes and reasons; ownership matrix naming the program owner and child owners; no cross-repo mutation in any rollback record.

### Requirement: Current-Web Research Provenance

Current-web research SHALL occur only when a child faces a genuinely external, time-sensitive uncertainty that affects a requirement, design decision, compatibility choice, or compliance behavior, and SHALL occur during the relevant child SDD — never in the umbrella for rhetorical authority. The child SHALL prefer the authoritative primary source (regulator technical documentation, official standards, or upstream project release/compatibility documentation) and SHALL record the source URL, publisher, retrieval date, the exact uncertainty resolved, and the child decision it changed or confirmed. When no adequate primary source exists, the child SHALL record the uncertainty and resulting risk instead of presenting a secondary claim as fact. The program SHALL NOT browse for facts already established by repository evidence or merely to make an artifact sound more authoritative.

Known candidate triggers (research prompts, not assumed requirements; each child SHALL verify relevance before retrieval): SUNAT/OSE callback authentication during C1, SUNAT/UBL decimal serialization requirements during C2, and the current Vite/plugin compatibility matrix during C3.

#### Scenario: External uncertainty researched in the owning child

- GIVEN a child faces an external, time-sensitive uncertainty (e.g., SUNAT OSE callback authentication, UBL decimal rules, Vite compatibility)
- WHEN the child makes a requirement or design decision affected by it
- THEN the child SHALL retrieve the authoritative primary source during that child's SDD
- AND SHALL record source URL, publisher, retrieval date, the exact uncertainty resolved, and the decision changed or confirmed

#### Scenario: No primary source means recorded risk

- GIVEN a child cannot locate an adequate primary source for an external fact
- WHEN the fact would affect a decision
- THEN the child SHALL record the uncertainty and resulting risk in the ledger
- AND SHALL NOT present a secondary claim as fact

#### Scenario: Repository-established facts are not browsed

- GIVEN a fact is already established by repository evidence
- WHEN research is proposed
- THEN the umbrella SHALL decline to browse for it
- AND the decision SHALL cite the repository evidence instead

Acceptance evidence: ledger entries with source URL, publisher, retrieval date, uncertainty, and affected decision; recorded risks where primary sources are unavailable; no unnecessary web facts in umbrella artifacts.
