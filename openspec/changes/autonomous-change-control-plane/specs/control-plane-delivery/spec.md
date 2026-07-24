# Autonomous Change Control Plane — Delivery & Integration Specification

**Change:** `autonomous-change-control-plane`
**Domain:** `control-plane-delivery`
**Capability:** `autonomous-change-control-plane` (New)
**Last updated:** 2026-07-22

## Purpose

Define the delivery and integration layer: branch and PR delivery, publication
authority, publication idempotency, GitHub ruleset and token assumptions, separation
of generation from publication, CLI-action behavioral parity, deterministic fixture
requirements, Engram supplemental role, documentation obligations, and the
`autonomous-change-control` skill.

## Requirements

### REQ-DEL-001: Separation of read-only generation from write-enabled publication

The control plane architecture MUST separate read-only generation and validation
jobs from the write-enabled publication job. Generation and validation MUST use
read-only repository permissions. The publication job MUST receive minimum write
and PR permissions only after every local gate succeeds.

#### Scenario: Generation job has no write permissions

- GIVEN a workflow run executing model generation and local validation
- WHEN the workflow job is configured
- THEN the job's token has only read permissions on the repository
- AND no branch, commit, or PR can be created during generation

#### Scenario: Publication job gated on prior success

- GIVEN a generation job that failed at the budget gate
- WHEN the workflow evaluates the publication job condition
- THEN the publication job is not launched
- AND no publication-job write credential is materialized

#### Scenario: Publication job receives minimal permissions

- GIVEN a successful generation and validation job
- WHEN the publication job starts
- THEN the token has only the mutable permissions required for branch and PR
  publication
- AND implicit read-only metadata access is not represented as write authority

### REQ-DEL-002: GitHub ruleset and token assumptions

The system MUST layer enforcement: the reusable action enforces candidate policy;
GitHub rulesets enforce the publication boundary. The design MUST NOT claim
branch-scoped workflow permissions. The publication token MUST be a short-lived
`GITHUB_TOKEN` or GitHub App token with minimum repository permissions. A
protected-branch ruleset MUST block direct writes to `main` and require a reviewed
PR. Human merge approval MUST be enforced by repository rules and verified approval
evidence; the control plane MUST NOT claim to independently prove a human identity.

#### Scenario: Ruleset blocks direct push to main

- GIVEN a GitHub ruleset protecting the `main` branch
- WHEN any actor attempts a direct push to `main`
- THEN the push is rejected by GitHub
- AND the control plane's own branch/PR delivery is unaffected because it
  never targets `main` directly

#### Scenario: Control plane does not claim branch-scoped permissions

- GIVEN the control plane's publication job
- WHEN the workflow `permissions` block is inspected
- THEN permissions are scoped to `contents: write` and
  `pull-requests: write`
- AND no branch-name restriction is asserted in the permissions block

#### Scenario: Human approval verified through repository evidence

- GIVEN a merged autonomous PR
- WHEN the control plane records approval evidence in the post-merge receipt
- THEN the evidence references the GitHub review and approval event
- AND the control plane does not claim to have independently verified the
  human reviewer's identity

### REQ-DEL-003: Branch naming, collision, base drift, and publication idempotency

The publication job MUST verify the intended base, current base SHA, repository
identity, and unique head branch immediately before push. Branch-name collision
or base movement MUST fail closed. The branch MUST be a new unique branch;
force-push MUST NOT be used.

Publication MUST be idempotent with respect to the content-bound change: a replay
or duplicate invocation for the same change (identified by manifest hash) MUST
either discover and return the existing branch and PR or fail closed. It MUST NOT
create a second branch or PR for the same content-bound change.

#### Scenario: Unique branch creation

- GIVEN a successful candidate with change ID `fix-foo`
- WHEN the control plane creates the branch
- THEN the branch name is derived from the change ID with a unique suffix
- AND `git push` uses no force option

#### Scenario: Branch collision fails closed

- GIVEN a desired branch name `autonomous/fix-foo` that already exists on
  the remote
- WHEN the control plane checks remote branches before push
- THEN the collision is detected
- AND the run fails with a `BRANCH_COLLISION` diagnostic
- AND no push or force-push is attempted

#### Scenario: Base drift fails closed

- GIVEN a frozen base SHA recorded at candidate construction time
- AND the remote `main` has advanced to a new SHA before publication
- WHEN the control plane re-derives the base before push
- THEN the base SHA mismatch is detected
- AND the run fails with a `BASE_DRIFT` diagnostic

#### Scenario: Idempotent replay discovers existing PR

- GIVEN a content-bound change whose manifest hash matches a previously
  published branch and open PR
- WHEN the same change is replayed
- THEN the control plane discovers the existing branch and PR
- AND returns the existing PR reference
- AND no second branch or PR is created

#### Scenario: Idempotent replay fails closed on ambiguity

- GIVEN a content-bound change whose manifest hash matches a previously
  published branch
- AND the original PR has been closed or merged
- WHEN the same change is replayed
- THEN the control plane fails with a `BRANCH_COLLISION` diagnostic
- AND asks for human resolution

### REQ-DEL-004: Repository identity binding

The publication job MUST bind and revalidate repository identity before push. The
identity MUST include: expected immutable repository ID, canonical owner/name, base
ref, and remote URL context. Every field MUST be rederived immediately before push
and MUST match the candidate's origin. Mismatch on any field MUST fail closed.

#### Scenario: Full identity match

- GIVEN a candidate bound to `expected-org/expected-repo`
- AND the binding includes immutable repository ID `R_abc123`, base `main`,
  and the canonical `origin` URL
- WHEN the publication job rederives repository identity before push
- THEN the immutable ID, owner/name, base ref, and remote URL all match
- AND publication proceeds

#### Scenario: Identity owner mismatch

- GIVEN a candidate bound to `expected-org/expected-repo`
- AND the publication context resolves to `other-org/fork`
- WHEN the control plane revalidates repository identity
- THEN the mismatch is detected
- AND the run fails with an `IDENTITY_MISMATCH` diagnostic

#### Scenario: Remote URL mismatch

- GIVEN a candidate bound to the canonical expected remote URL
- AND the publication job resolves a different remote URL
- WHEN the control plane revalidates repository identity
- THEN the mismatch is detected
- AND the run fails with an `IDENTITY_MISMATCH` diagnostic

### REQ-DEL-005: PR-only delivery and mandatory human merge approval

Every autonomous change MUST reach `main` only through a reviewed pull request.
The control plane MUST create at most one PR per content-bound autonomous run
(enforced by publication idempotency). A human MUST approve every merge. Human
approval MUST be enforced by repository rules (branch protection, required
reviewers) and verified through GitHub approval evidence. The control plane MUST
NOT perform autonomous merge and MUST NOT claim the ability to independently
prove human identity.

#### Scenario: PR created after all gates pass

- GIVEN a candidate that passes all validation, budget, policy, and
  verification gates
- WHEN the publication job executes
- THEN a PR is created from the unique branch targeting `main`
- AND the PR body references the manifest and verification evidence

#### Scenario: Human approval enforced by repository rules

- GIVEN an autonomous PR awaiting review
- WHEN a human reviewer approves the PR through GitHub
- THEN the merge becomes possible through GitHub's normal merge flow
- AND the control plane never attempts to merge autonomously
- AND the post-merge receipt records the GitHub review event as approval
  evidence

### REQ-DEL-006: GitHub Action and local Bun CLI behavioral parity

The control plane MUST expose the same core functions through both a reusable
GitHub Action at `.github/actions/autonomous-change/action.yml` and a local Bun
CLI at `packages/drenyra-orchestrator/src/cli/control-plane-cli.ts`. Both MUST
use the same policy core, share identical validation logic, and produce
structurally equivalent diagnostic output.

#### Scenario: Action and CLI produce equivalent diagnostics

- GIVEN the same trigger and response files
- WHEN the control plane is invoked through the GitHub Action
- AND when it is invoked through the local Bun CLI
- THEN both produce structurally equivalent diagnostic records
- AND both apply the same policy decisions

#### Scenario: CLI accepts trigger and response arguments

- GIVEN a local trigger file and response file
- WHEN the CLI is invoked with the file paths
- THEN the control plane validates, constructs the candidate, and emits
  diagnostics
- AND a dry-run option prevents publication

### REQ-DEL-007: Deterministic fixture and harness requirements

All control-plane tests MUST use local temporary Git repositories, deterministic
fixtures, and mocked model responses. Tests MUST NOT require live DeepSeek API
calls, network access to GitHub, or destructive remote operations.

Engram writes in test harnesses are supplemental. A test MUST produce correct
safety verdicts with Engram unavailable; Engram persistence degradation in a
test environment MUST be observable but MUST NOT cause a false failure of the
core safety gates.

#### Scenario: Path-rejection fixture test

- GIVEN a test fixture with a mock change-set containing a traversal path
- WHEN the path-canonicalization module processes the fixture
- THEN the traversal path is rejected
- AND no filesystem operation escapes the temporary test directory

#### Scenario: Manifest hashing fixture test

- GIVEN a deterministic candidate tree fixture
- WHEN the manifest module computes the candidate-tree hash and envelope
  hash
- THEN the hashes match known expected values
- AND no external service call is made

#### Scenario: Opaque content preservation test

- GIVEN a fixture response file containing literal `$()`, backticks,
  quotes, and `${VAR}`
- WHEN the control plane processes and writes the content
- THEN the resulting file contains the exact original bytes
- AND a sentinel side-effect detector proves no command executed

#### Scenario: Test produces correct verdicts without Engram

- GIVEN a test environment where Engram is unavailable
- WHEN the control plane runs the full validation and publication pipeline
  (dry-run)
- THEN all safety verdicts are correct
- AND Engram unavailability is recorded as a test diagnostic
- AND no safety gate passes or fails incorrectly due to Engram state

### REQ-DEL-008: Documentation obligations

The implementation MUST update: `AGENTS.md` to document the new control-plane
capability; `packages/drenyra-orchestrator/README.md` to include control-plane
module documentation; action documentation for
`.github/actions/autonomous-change/`; repository policy documentation covering
protected paths, writable roots, budgets, and autonomy modes; and OpenSpec
artifacts for this change. Generated reference material and human-authored policy
documentation MUST remain separate.

#### Scenario: AGENTS.md updated

- GIVEN the implementation is complete
- WHEN `AGENTS.md` is inspected
- THEN it documents the existence and purpose of the autonomous change
  control plane
- AND it references the `autonomous-change-control` skill

#### Scenario: Policy docs are human-authored

- GIVEN the repository policy documentation
- WHEN a reader inspects the document
- THEN it is written in natural language explaining policy rationale
- AND it is distinct from generated API reference material

### REQ-DEL-009: `autonomous-change-control` skill obligations

A new project skill at `.agent/skills/autonomous-change-control/SKILL.md` MUST
document: eligible triggers, required evidence, writable-root conventions,
protected-path behavior, review workload constraints, proposal-only fallback, and
human escalation. The skill MUST explain operating conventions without claiming
to enforce security policy mechanically.

#### Scenario: Skill documents eligible triggers

- GIVEN the `autonomous-change-control` skill file
- WHEN an agent reads the skill
- THEN it explains that only verified CI failures and approved SDD proposals
  are eligible v1 triggers
- AND it describes the structured trigger format

#### Scenario: Skill does not claim enforcement

- GIVEN the `autonomous-change-control` skill file
- WHEN an agent reads the skill
- THEN it states that enforcement is performed by the control-plane code
- AND it explains the agent's role in following conventions, not enforcing
  them

#### Scenario: Skill references protected paths

- GIVEN the `autonomous-change-control` skill file
- WHEN an agent reads the skill
- THEN it lists the protected domains
- AND it instructs agents to escalate protected-path requests to human-owned
  SDD
