# Proposal — Coordinate Ecosystem Audit Readiness Through Repo-Scoped Child SDDs

## Decision

This change establishes an **umbrella coordination program**, not an atomic cross-repository implementation change. The Drenyra repository owns the program plan, dependency order, evidence ledger, and completion decision. Every implementation unit is owned by an independent child SDD in the repository whose code it changes.

The umbrella change does not edit sibling repositories, combine repositories into one review unit, or replace existing child authority. In particular, `drenyra-h02-tenant-isolation` is resumed as the authority for C1; it must not be duplicated and remains blocked until its pending review is approved.

## Intent and objective

The ecosystem has individually useful capabilities and green baselines, but production and audit readiness is fragmented across unfinished security work, fiscal representation risks, missing or inconsistent gates, incomplete live checks, and separation-of-duties gaps. A single cross-repository change would blur ownership, make dependencies difficult to enforce, and create review units too large to verify safely.

The objective is to turn those gaps into an executable, evidence-driven program that:

1. preserves repository-local ownership and SDD authority;
2. prevents blocked or merely drafted work from being treated as executable;
3. sequences dependent work without forcing unrelated repositories into one delivery;
4. keeps implementation and review units within a 300-line limit;
5. records enough evidence to make readiness and escalation decisions reproducible; and
6. opens core-library work only when a consuming child proves a concrete frozen-contract gap.

## Program scope

### In scope

- Coordinate child SDDs C1–C7 across `Drenyra`, `drenyra-pi`, and, conditionally, `drenyra-ai` or `drenyra-engram`.
- Maintain a dependency and executability matrix that distinguishes executable, blocked, and conditional work.
- Resume H02 through its existing change and evidence trail.
- Require every child to define its own repository-local proposal, specification, design, tasks, implementation, verification, review, and delivery evidence.
- Track tenant isolation, money representation, tooling/readiness gates, live infrastructure readiness, separation of duties, monthly-close command execution, and any demonstrated core-contract gap.
- Maintain an umbrella evidence ledger updated after each child gate or state transition.
- Apply the delivery, review, research, and quality rules defined below.

### Non-goals

- Implement product-source changes from this umbrella SDD.
- Create one atomic cross-repository branch, diff, review, receipt, PR, or release.
- Create a replacement or duplicate for H02.
- Treat `review-pending`, `implementation-blocked`, or no-`state.yaml` work as runnable.
- Add fiscal domains, redesign UI, expand to additional countries, or perform market validation.
- Deploy live SUNAT, bank, or payment integrations; this program proves readiness gates rather than operating those integrations.
- Accept floating-point tolerance in money paths instead of eliminating representation drift.
- Change a frozen `drenyra-ai` contract without a demonstrated consumer gap, an independent child SDD, conformance evidence, and the required versioned release.
- Use web research to decorate the proposal or support claims already established by repository evidence.

## Baseline evidence

The canonical exploration was re-verified against local repository artifacts on 2026-08-08. This proposal adopts the following baseline without adding external claims:

|Area|Baseline evidence|Program implication|
|---|---|---|
|Drenyra OpenSpec|`openspec/config.yaml` exists; 115 change directories were inventoried. States include 60 archived, 3 implemented, 2 verified, 2 completed, 1 review-pending, and 1 implementation-blocked; approximately 46 have no `state.yaml`.|Draft volume is not readiness. Executability must be derived from lifecycle state and evidence.|
|H02 tenant isolation|`drenyra-h02-tenant-isolation/state.yaml` is at `phase: tasks`, `status: review-pending`, with waves W0–W6 already defined.|C1 resumes H02 and is blocked until its review is approved. No duplicate child may be opened.|
|Other non-executable work|`drenyra-accountant-operating-system` is `implementation-blocked`; `drenyra-risk-audit` has no `state.yaml`.|Neither is a runnable dependency. Risk/audit remains a planning target until its own lifecycle begins.|
|`drenyra-ai` baseline|Fiscal authority kernel evidence records 28 files and 488 passing tests, exit 0. Drenyra consumes release tarballs currently pinned to v0.2.0.|Existing frozen contracts are the starting point; C7 is not presumed necessary.|
|`drenyra-pi` baseline|OpenSpec is file-authoritative in hybrid mode; baseline evidence records 493 tests across 29 files. `drenyra:close` is registered but does not execute the existing 13-phase monthly-close chain.|C5 can begin independently against the pinned `drenyra-ai` release.|
|Drenyra money paths|Repository evidence identifies `parseFloat` in money paths, including construction of `Money` values.|C2 must characterize outputs first and eliminate floating representation from money contexts.|
|Tooling and readiness gates|Workspace/config paths include non-existent apps; Vite declarations conflict; multiple declared readiness/release scripts are missing; frozen lockfile enforcement is disabled.|C3 restores a truthful root runner and executable typed gates.|
|Separation of duties|Roles and approval counts exist, but no domain/application invariant prevents the same actor from proposing, approving, and executing.|C5 defines/enforces the policy in `drenyra-pi`; C6 aligns Drenyra's approval control plane.|
|Ecosystem extraction|Drenyra uses adapter shims and release tarballs while some canonical capabilities are still migrating.|The ledger tracks version and conformance evidence; migration alone does not authorize C7.|

The detailed paths, counts, and blocker evidence remain in `explore.md`, which is the canonical exploration input for this proposal.

## Ownership, dependency, and executability matrix

Each row is an independent child SDD. “Executable” means its repository-local lifecycle and dependencies permit work; it does not mean the umbrella may implement it directly.

|Child|Repository owner|Outcome|Dependencies|Current executability|Delivery boundary|Required completion evidence|
|---|---|---|---|---|---|---|
|C1 — Tenant boundary closure|`Drenyra`|Complete H02 waves W0–W6: characterization, scope-first repositories, negative cross-tenant tests, RLS, route scoping, and zero-unscoped-method guard.|Existing H02 authority; no new child.|**Blocked.** Resume H02, but do not implement until its pending review is approved and state advances.|Existing H02 change; repo-local units split by wave/cluster and the 300-line rule.|Zero unscoped public repository methods; negative cross-tenant tests green; RLS enabled on critical tables; H02 archived.|
|C2 — Money representation|`Drenyra`|Convert money paths to BigInt cents/string-or-integer construction and prohibit `parseFloat` in money contexts.|C1, because repository signatures overlap money reads.|Executable only after C1 completes the required boundary work.|Characterization first, then bounded domain clusters.|Drift characterization and regression evidence; zero money-context `parseFloat`; existing money suites green.|
|C3 — Tooling and gate restoration|`Drenyra`|Repair workspace paths and root runner, reconcile Vite, enforce reproducibility, and implement or explicitly remove invalid script declarations.|C1; coordinate ordering with C2 where touched paths overlap.|Executable after C1; must respect the declared chain.|Separate workspace-runner and gate-restoration units, each within 300 lines.|Root Vitest and build green; declared gates exist and emit typed outcomes; lockfile policy is explicit and enforced.|
|C4 — Live readiness checks|`Drenyra`|Verify DB, Redis, readiness endpoint, fiscal-memory integration, and CI failure semantics against real test infrastructure.|C3 and an available `drenyra-engram` release/binary.|Executable only when both dependencies are evidenced.|Health/CI and sidecar integration may be separate bounded units.|`/health/ready` reports ready with dependencies present and fails closed when absent; fiscal-memory live check green in CI.|
|C5 — SoD and close command|`drenyra-pi`|Define proposer/approver/executor separation, reject same-user actions, and wire `drenyra:close` to the 13-phase monthly-close chain.|Pinned `drenyra-ai` v0.2.0, currently satisfied.|**Executable today** as a repo-local child SDD.|Separate policy/enforcement and command-wiring units.|Same-user rejection and distinct-actor tests; command executes the chain and emits its signed receipt; vendored/released conformance verified.|
|C6 — SoD alignment|`Drenyra`|Apply the C5 policy to approval routes and domain controls with tenant-scoped enforcement.|C1 and an approved C5 policy definition.|Executable only after both dependencies are evidenced.|One or more repo-local units under the 300-line rule.|Self-approval rejected at domain and route boundaries; tenant-scoped approval tests green.|
|C7 — Core upgrades, on demand|`drenyra-ai` and/or `drenyra-engram`|Close a proven frozen-contract or released-capability gap that blocks C2–C5.|Evidence from a consuming child and the C7 opening rules below.|**Conditional; closed by default.**|Independent SDD and release in each affected core repo; never combined with consumer implementation.|Versioned release consumed by affected clients; conformance suites and consumer verification green.|

### Program order

```text
existing drenyra-ai v0.2.0 pin ──> C5 ──> C6
                                      ^      ^
                                     |    |
H02 review approval ──> C1 ──> C2 ──> C3 ──> C4
                        |            |
                         +──────────────+ (C6 also requires C1)

C7 opens only when an executing consumer child proves a qualifying core gap.
```

C1 → C2 → C3 → C4 is the default hard sequence for Drenyra readiness work. C5 may proceed independently. C6 waits for both C1 and C5. The child SDD may refine ordering between C2 and C3 only if it proves there is no overlapping dependency and records that decision in the ledger; it may not bypass C1.

## H02 resume rule

H02 is an existing authority, not an idea to be replanned under another name.

1. The first C1 action is to resume `drenyra-h02-tenant-isolation` at its current review gate.
2. No apply work, dependent child, or “executable” label is allowed while H02 remains `review-pending`.
3. Review findings are resolved within H02's own lifecycle and evidence trail.
4. Once approved, execution continues through the existing W0–W6 plan, split only into bounded delivery units that preserve H02 acceptance criteria.
5. A duplicate tenant-isolation SDD is a program violation because it would split authority and evidence.

## Delivery and review limits

- **One repository per child SDD and one repository per delivery unit.** Cross-repository commits, reviews, receipts, and PRs are prohibited.
- **300 changed lines per implementation/review unit.** Forecast authored additions plus deletions before apply. Generated files and unavoidable mechanical artifacts must be identified separately, but do not justify hiding conceptual scope.
- **Automatic chain forecast.** If a child or unit is forecast to exceed 300 changed lines, the child tasks must automatically define a dependency-ordered chain of smaller repo-local units before implementation begins. The forecast records each unit's intent, estimated lines, dependency, acceptance evidence, and rollback boundary.
- **No size exception by implication.** A unit may exceed 300 lines only through an explicit, repository-local decision recorded before apply with rationale, alternatives considered, and reviewer-impact mitigation. The umbrella does not grant blanket exceptions.
- **Review follows exact child bytes and authority.** Each child uses its repository's native review and delivery process; umbrella status never substitutes for an approved child review or receipt.
- **Blocked work does not consume downstream execution.** A child with an unresolved review, lifecycle blocker, missing dependency, or failed quality gate remains non-executable.
- **Independent rollback.** Each unit must be revertible without reverting unrelated repositories or later chain units. Contract-release rollback uses a new compatible release or an explicitly documented consumer pin rollback, never silent mutation of a published artifact.

## Evidence ledger

The umbrella maintains a single program ledger in a later planning artifact or dedicated coordination document. It is updated after every child lifecycle transition, quality gate, approved review, release, rollback, or newly discovered blocker.

Each entry must contain:

|Field|Required content|
|---|---|
|Child and unit|C1–C7 identifier, child change name, repository, and bounded unit/PR identifier.|
|Authority|Repository-local SDD state path or topic, review/receipt reference, and immutable revision when available.|
|Dependency state|Required predecessors and evidence that each is satisfied, blocked, or not applicable.|
|Scope and forecast|Baseline defect closed, intended paths/areas, estimated and actual changed lines, and chain position.|
|Verification|Commands or checks run, exit/result, test counts where meaningful, and acceptance-criterion mapping.|
|External evidence|Only externally uncertain facts needed by that child; primary source, URL, retrieval date, and requirement/design decision affected.|
|Version evidence|Producer version/tag, consumer pin, artifact checksum or equivalent identity, and conformance result where contracts cross repos.|
|Outcome|Planned, blocked, executing, verified, delivered, rolled back, or superseded, with reason and timestamp.|
|Follow-ups|Non-blocking findings, owner, and target child or future program.|

A ledger entry is evidence, not a status assertion: unsupported “green,” “ready,” or “compatible” labels are invalid.

## Required quality gates

Every child must define the concrete commands and repository conventions that implement these gates. A gate is satisfied only by recorded evidence from the relevant child repository.

1. **Lifecycle and dependency gate:** child state permits execution; all hard dependencies have verified ledger evidence. H02 review approval is mandatory before C1 apply.
2. **Scope gate:** the child closes one or more named baseline defects and preserves the umbrella non-goals.
3. **Size and chain gate:** every unit has a pre-apply line forecast; forecasts above 300 lines produce a dependency-ordered chain before apply.
4. **Characterization/TDD gate:** behavior-sensitive changes begin with characterization or failing tests and follow the repository's strict-TDD policy where active.
5. **Repository regression gate:** the affected repository's applicable test, type, lint, build, and package checks are green with recorded results.
6. **Security and isolation gate:** tenant, authorization, SoD, and failure-path changes include negative tests and fail-closed behavior, not only happy-path checks.
7. **Fiscal integrity gate:** money or fiscal serialization changes prove deterministic, drift-free results against characterized expectations.
8. **Live dependency gate:** readiness work proves both success with real test services and failure/degraded semantics when dependencies are absent.
9. **Contract and release gate:** cross-repo contracts use immutable versioned artifacts; producer conformance and consumer integration evidence agree on the exact version.
10. **Review and delivery gate:** the repository-local native review is approved for the exact unit before its delivery gate; umbrella approval cannot waive it.
11. **Ledger gate:** evidence and state are recorded before a dependent child is marked executable.
12. **Rollback gate:** the unit documents and, where practical, verifies an independent rollback path.

## Decision rules for opening C7 core work

C7 is closed by default. It may open only when all of the following are true:

1. An executing C2, C3, C4, or C5 child provides a minimal reproducible case showing that its required outcome cannot be achieved through an existing released public contract or a consumer-local adapter.
2. The evidence identifies the exact missing or contradictory contract behavior, affected producer repository, affected consumers, and current immutable producer version.
3. The child records why a consumer-local change would violate ownership, duplicate canonical logic, weaken conformance, or create unacceptable operational risk.
4. The proposed core change is the smallest contract-level correction and has named conformance scenarios.
5. A new independent child SDD is created in each affected core repository. No consumer child writes core code directly.
6. Frozen public-surface changes follow the producer's versioning policy; a breaking frozen-contract change requires a major release.
7. Producer tests and conformance suites pass, a versioned release is published through normal gates, and every affected consumer pins and verifies that exact release before the originating child can close.

C7 must **not** open for repository cleanup, migration preference, speculative reuse, version freshness, convenience, or because a local shim looks inelegant. If the gap can be closed safely in the consumer without violating canonical ownership, the consumer child retains the work.

## Current-web research rule

Current-web research is allowed only when a child faces a genuinely external and time-sensitive uncertainty that affects a requirement, design decision, compatibility choice, or compliance behavior. Research occurs during the relevant child SDD, not in the umbrella for rhetorical authority.

- Prefer the authoritative primary source: regulator technical documentation, official standards, or upstream project release/compatibility documentation.
- Record the source URL, publisher, retrieval date, the exact uncertainty resolved, and the child decision it changed or confirmed.
- If no adequate primary source is available, record the uncertainty and resulting risk instead of presenting a secondary claim as fact.
- Do not browse for facts already established by repository evidence or merely to make an artifact sound more authoritative.

Known triggers from exploration are: SUNAT/OSE callback authentication during C1, SUNAT/UBL decimal serialization requirements during C2, and the current Vite/plugin compatibility matrix during C3. These are research prompts, not assumed requirements; each child must verify relevance before retrieval.

## Risks and mitigations

|Risk|Impact|Mitigation|
|---|---|---|
|H02 review remains blocked|Critical; prevents C1 and dependent Drenyra work.|Resume the existing review first, preserve its authority, and keep downstream children non-executable.|
|Program status drifts from child reality|High; creates false readiness claims.|Require immutable child authority and verification evidence in the ledger before state transitions.|
|Cross-repo version skew|High; consumer and producer may pass against different contracts.|Record exact producer artifact identity, consumer pin, and conformance result at every release edge.|
|Money conversion alters fiscal outputs|Critical.|Characterization first, integer/string construction, deterministic before/after evidence, and fiscal integrity gate.|
|SoD enforcement breaks seeded/demo flows|High.|Make policy explicit, migrate affected flows deliberately, and test both valid distinct-actor and rejected same-user paths.|
|Live checks depend on unavailable infrastructure|Medium to high.|Define ready/degraded/failure semantics and use real CI services; missing infrastructure must fail closed rather than be silently skipped.|
|Gate restoration reveals further missing capabilities|Medium.|Record findings in the ledger and route them to bounded children; do not silently delete declarations to obtain green status.|
|300-line units fragment behavior unnaturally|Medium.|Chain by coherent acceptance boundaries and dependencies, not arbitrary file slices; request an explicit exception only when a safe boundary cannot be formed.|
|“Audit readiness” expands into unrelated product work|Medium.|Every child must name the baseline defect it closes and preserve the non-goals.|
|External rules change after design|Medium.|Retrieve primary sources only at the relevant child decision point and record retrieval dates and affected assumptions.|

## Rollback and stop conditions

The umbrella can be paused without reverting completed child work. A child or unit stops when its lifecycle is blocked, a hard dependency lacks evidence, a quality gate fails, its forecast lacks a compliant chain, or external uncertainty prevents a safe requirement decision.

Rollback is repository-local:

- revert the smallest delivered child unit or restore its prior consumer pin;
- preserve ledger history and mark the outcome `rolled back` with reason and evidence;
- re-evaluate downstream executability because rollback may invalidate dependency evidence;
- never compensate for one repository by silently mutating a sibling repository;
- never reopen C7 without re-satisfying its decision rules.

If H02 review is declined or escalated, C1 remains blocked and C2, C3, C4, and C6 may not claim readiness through work that depends on tenant closure.

## Success criteria

The umbrella program succeeds when all mandatory children are closed with repository-local evidence and no conditional work is misrepresented as complete:

- [ ] H02 was resumed—not duplicated—approved, executed through its accepted waves, verified, and archived as C1.
- [ ] C2 proves drift-free money representation and zero `parseFloat` use in money contexts covered by its scope.
- [ ] C3 provides a truthful green root runner, compatible build tooling, explicit reproducibility policy, and runnable typed readiness/release gates.
- [ ] C4 proves ready and fail-closed behavior against real DB, Redis, and fiscal-memory test infrastructure.
- [ ] C5 enforces distinct proposer/approver/executor actors and executes the 13-phase monthly-close chain with a signed receipt.
- [ ] C6 applies the approved SoD policy to tenant-scoped Drenyra approval controls.
- [ ] Every implementation/review unit is at or below 300 changed lines, or has a pre-approved documented exception; oversized forecasts were automatically decomposed into chains before apply.
- [ ] Every dependency transition and quality gate is supported by an evidence-ledger entry tied to repository-local authority.
- [ ] Any C7 work was opened only through the stated rules, released independently, pinned by consumers, and verified by producer and consumer conformance; otherwise C7 remains explicitly not required.
- [ ] Externally uncertain claims used by a child cite current primary sources with retrieval dates; no unnecessary web facts were introduced.
- [ ] No umbrella phase edited sibling product source or produced a cross-repository implementation/review unit.

## Affected areas

|Area|Nature of impact|
|---|---|
|Drenyra OpenSpec|Owns umbrella coordination, child-state references, dependency decisions, and the evidence ledger.|
|Drenyra product code|Changed only by C1, C2, C3, C4, and C6 through their own child SDDs.|
|`drenyra-pi`|Owns C5 and its repository-local delivery evidence.|
|`drenyra-ai` / `drenyra-engram`|Unchanged unless a qualifying C7 child is opened.|
|CI/release operations|Gain bounded-unit forecasts, explicit quality gates, artifact identity, and rollback evidence.|
|Security/audit stakeholders|Receive traceable tenant, SoD, fiscal-integrity, and readiness evidence without reconstructing cross-repo state.|

## Governance decisions

The user confirmed the Drenyra program owner as the accountable authority for the umbrella evidence ledger and for approving any pre-apply exception above 300 changed lines. Child owners supply repository-local, immutable evidence; the program owner records the dependency decision and reviewer-impact mitigation.

C1–C6 are mandatory before the ecosystem may be described as audit-ready. C7 remains conditional and does not block closure unless its documented opening rules are met. Until every mandatory child closes, status may be capability-scoped only; it must not claim ecosystem-wide readiness.

## Next step

Create the child-facing specifications for the umbrella program: formalize lifecycle/executability invariants, evidence-ledger requirements, quality gates, and the C7 opening policy without implementing product code or creating duplicate child authority.
