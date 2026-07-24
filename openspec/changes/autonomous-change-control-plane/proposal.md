# Proposal: Autonomous-Change Control Plane

**Change:** `autonomous-change-control-plane`
**Phase:** solicitud (proposal)
**Created:** 2026-07-22
**Revised:** 2026-07-22 (manual gate correction)
**Artifact store:** hybrid (OpenSpec + Engram)
**Status:** ready for approval

---

## Executive Summary

Drenyra has two GitHub Actions workflows that generate code from DeepSeek:

- `.github/workflows/auto-healing.yml`
- `.github/workflows/sdd-auto-implement.yml`

Both accept complete-file output, copy it into the repository, stage with
`git add -A`, and force-push branches. They do not enforce writable roots,
protected paths, file or diff budgets, mandatory verification, or provenance.

`auto-healing.yml` also has a dead PR path: the workflow checks a
`FILES_COMMITTED` output that its generation step never publishes.

This proposal extends `packages/drenyra-orchestrator/` with a mechanical
control plane. It validates untrusted inputs, derives changes inside an
isolated candidate tree, enforces deny-first policies, binds evidence to the
candidate, and permits only unique-branch PR delivery with human merge
approval.

The change adds one narrow skill, `autonomous-change-control`. The skill
explains operating conventions. It does not enforce security policy.

## Confirmed Product Decisions

The user approved these decisions for v1:

1. Only verified failures and explicitly approved SDD proposals may trigger
   autonomous code generation.
2. The system may create a unique branch and PR. A human must approve every
   merge.
3. The same control-plane core must run from GitHub Actions and a local Bun
   CLI.
4. Repository evidence stores the content-bound candidate manifest. Engram
   stores expanded operational context and the post-merge learning record.
5. Dependabot changes are qualified by policy and evidence, but never
   auto-merged in v1.

Scheduled maintenance triggers, autonomous merge, advanced canary execution,
and automated learning analysis are deferred.

## Problem

### Current Safety Gap

The current autonomous workflows have no mechanical boundary between model
output and the repository tree.

A malformed or adversarial response can currently:

- select arbitrary repository paths;
- attempt absolute-path or `..` traversal;
- exploit symlink or case-normalization ambiguity;
- replace complete files before a bounded diff is reviewed;
- touch fiscal, tenant, auth, payment, CI, or secret-bearing paths;
- exceed a reviewable diff size;
- reach a remote branch without typecheck or tests;
- lose provenance between generation and review; and
- overwrite branch history through force-push.

Issue bodies and model responses are untrusted data. They must never be
interpolated into shell source, heredocs, `eval`, or executable command text.

### Product Impact

Drenyra is a fiscal platform. Autonomous changes can affect:

- SUNAT, UBL 2.1, SIRE, IGV, and CDR behavior;
- organization, company, and RUC isolation;
- credentials and security controls;
- audit evidence and approval chains; and
- the reliability of CI and release automation.

For this domain, an agent's explanation is not evidence. The platform must
derive evidence from exact bytes, paths, Git identity, and verification
results.

## Target Users

### Platform Engineers

They need one reusable policy engine instead of duplicated YAML safeguards.

### Developers and Reviewers

They need a bounded PR, candidate manifest, verification evidence, and a clear
review path.

### Compliance Auditors

They need a tamper-evident chain from trigger to candidate, human approval,
and final merge identity.

### Operations

They need fail-closed controls and a human-authorized rollback plan that
matches the actual GitHub merge strategy.

## Desired Outcome

Every autonomous run must:

1. validate a structured trigger;
2. store the trigger and model response as data files, never shell source;
3. canonicalize every proposed path before materializing content;
4. derive the candidate in an isolated temporary Git tree;
5. derive and inspect the exact diff before touching the delivery worktree;
6. enforce request-scoped writable roots and deny-first protected paths;
7. enforce file-count, per-file, and total-diff budgets;
8. run required verification against the exact candidate;
9. generate a content-bound pre-PR manifest;
10. create a unique non-force branch and PR;
11. require human approval for merge; and
12. emit a post-merge receipt through GitHub evidence plus Engram.

Any unresolved path, policy, verification, identity, or evidence state fails
closed.

## Scope

### Phase 1: Safe PR Generation

#### Control-Plane Core

Add modules under:

`packages/drenyra-orchestrator/src/control-plane/`

The modules cover:

- trigger schema validation;
- model-response schema validation;
- path canonicalization;
- isolated candidate construction;
- diff derivation;
- writable-root and protected-path policy;
- file and line budgets;
- provenance hashing;
- affected-package verification resolution;
- pre-PR manifest generation;
- rollback-plan selection; and
- post-merge receipt generation.

#### Configuration

Add:

`packages/drenyra-orchestrator/src/config/control-plane-config.ts`

It defines:

- autonomy mode;
- trigger profiles;
- request-scoped writable roots;
- deny-first protected paths;
- budget profiles;
- required verification;
- Dependabot qualification policy; and
- evidence destinations.

#### GitHub Action

Add:

`.github/actions/autonomous-change/action.yml`

The action calls the shared control-plane core. It does not duplicate policy
logic in YAML.

#### Workflow Hardening

Modify:

- `.github/workflows/auto-healing.yml`
- `.github/workflows/sdd-auto-implement.yml`
- `.github/workflows/dependabot-auto-merge.yml`

The changes must:

- fix the dead `FILES_COMMITTED` path;
- remove force-push;
- remove direct complete-file copying into the delivery worktree;
- use structured trigger files and response files;
- invoke the shared control plane;
- separate read-only generation from write-enabled publication;
- create a unique branch only after all gates pass;
- open a PR; and
- disable Dependabot auto-merge.

#### Local Bun CLI

Add a new CLI deliverable at:

`packages/drenyra-orchestrator/src/cli/control-plane-cli.ts`

It exposes the same functions used by GitHub Actions for local reproduction.
Exact command names are defined during spec and design. No proposed command is
presented as an existing repository script.

#### Project Skill

Add one skill:

`.agent/skills/autonomous-change-control/SKILL.md`

It documents:

- eligible triggers;
- required evidence;
- writable-root conventions;
- protected-path behavior;
- review workload constraints;
- proposal-only fallback; and
- human escalation.

This skill is active agent instruction/configuration, not ordinary human-only
documentation. Native bounded-review classification determines its review
requirements.

### Phase 2: Operational Maturity

Phase 2 adds:

- canary execution and rollback automation proposals;
- automated analysis of operational learning records; and
- restoration of `.codebase/index.yml` generation and drift enforcement.

Phase 2 does not weaken any Phase 1 gate.

## Explicit Non-Goals

The change does not:

- create another orchestration package;
- redesign the SDD pipeline;
- modify existing review lenses;
- permit direct pushes to `main`;
- permit any force-push variant;
- permit autonomous protected-path overrides;
- auto-execute destructive rollback commands;
- auto-merge Dependabot changes;
- add scheduled maintenance triggers in v1;
- depend on npm or npx; or
- restore unsafe generation when the control plane fails.

## Security and Fiscal Invariants

### Protected Domains

The default deny policy includes at least:

- fiscal and accounting logic;
- SUNAT, UBL, SIRE, IGV, and CDR paths;
- auth, security, and payment paths;
- migrations, seeds, and tenant/RUC scoping infrastructure;
- environment and secret-bearing files;
- GitHub workflows and actions;
- release and deployment configuration;
- OpenSpec and agent-governance files; and
- the control-plane policy itself.

Protection is based on a maintained path registry, not only keywords in path
names.

A protected-path request stops autonomous execution. It is rerouted to
human-owned SDD or normal development. A policy change requires its own
reviewed change and cannot authorize the current run retroactively.

### Path Authority

Before materializing proposed content, the control plane rejects:

- absolute paths;
- Windows drive or UNC prefixes;
- NUL bytes;
- empty and dot-only paths;
- `..` traversal;
- Unicode-normalization conflicts;
- duplicate normalized paths;
- case-folding conflicts;
- symlinked parents or symlink escapes; and
- paths outside the authoritative repository/worktree root.

Deny rules take precedence over writable roots.

### Untrusted Content

Issue text, prompts, and generated file content remain opaque data.

They are transferred through files or structured process input. They are not
inserted into shell programs or command strings.

Literal content such as `$()`, backticks, quotes, or `${...}` is not rejected
merely for containing shell syntax. Tests must prove that such bytes remain
unchanged and cannot execute side effects.

### Candidate Isolation

Generated content is materialized only after path validation and only inside
an isolated temporary candidate tree.

The control plane derives a Git diff against the frozen base SHA. It validates
that diff before applying the exact accepted change-set to the delivery
candidate.

The primary delivery worktree is never the first parsing or validation
boundary.

## Evidence Model

### Pre-PR Manifest

The repository stores a canonical manifest in the autonomous PR.

It contains:

- change ID and trigger identity;
- frozen base SHA;
- candidate path set and file modes;
- candidate-tree hash excluding the manifest directory;
- canonical manifest-envelope hash;
- per-file and total diff sizes;
- model ID;
- prompt and response hashes;
- policy version and verdicts;
- verification commands and result hashes;
- rollback-plan type; and
- intended PR base and head.

The manifest is tamper-evident, not metaphysically immutable. Any candidate
mutation changes the tree or manifest-envelope hash and invalidates the gate.

The manifest must avoid self-referential hashing. The spec defines which paths
and fields are excluded from each hash.

### Post-Merge Receipt

A final merge SHA does not exist while the PR candidate is being reviewed.
Therefore the reviewed candidate is not mutated later to insert that SHA.

After merge, the control plane emits a separate receipt containing:

- final merge SHA;
- PR number;
- reviewer and approval evidence;
- pre-PR manifest hash;
- repository identity; and
- merge strategy.

The receipt is stored as signed or content-addressed GitHub evidence and in
Engram. It is linked to the repository manifest already merged through the PR.

A future periodic export into the repository, if desired, requires a separate
human-reviewed PR. It is not part of v1.

Neither Git history nor Engram is described as inherently immutable. The
system provides content binding, provenance, and tamper evidence.

## GitHub Authority and Permissions

GitHub workflow `permissions` cannot restrict a write token to a branch-name
pattern by themselves.

The design therefore requires layered enforcement:

1. Generation and validation jobs use read-only repository permissions.
2. A separate publication job receives the minimum write and PR permissions
   only after every local gate succeeds.
3. The publication token is a short-lived `GITHUB_TOKEN` or GitHub App token
   with minimum repository permissions.
4. A protected-branch ruleset blocks direct writes to `main` and requires a
   reviewed PR.
5. The publication job verifies the intended base, current base SHA,
   repository identity, and unique head branch before push.
6. Branch collision or base movement fails closed.
7. Environment protection is used when repository policy requires additional
   approval before publication.

The reusable action enforces candidate policy. GitHub rulesets enforce the
publication boundary. Neither replaces the other.

## Verification Policy

The current verified scripts include:

- root `bun run typecheck`;
- `bun run --filter @drenyra/orchestrator test`; and
- each affected package's existing `test` script when one exists.

The control plane resolves affected workspaces from the candidate path set.
Required verification that cannot be resolved fails closed.

New CLI commands and policy checks are deliverables of this change. They are
not documented as existing scripts until implemented.

## Budget Policy

Default AI-generated code budgets are:

- configurable file-count limit;
- 200 changed lines per file; and
- 400 changed lines total.

Budgets apply to the derived Git diff, not raw response size.

Exceeding a budget stops autonomous execution and routes the change to a human
workflow. It does not split or truncate generated content automatically.

## Dependabot Qualification

Dependabot uses a separate policy profile because lockfile diffs can exceed
AI-code line budgets legitimately.

The profile requires:

- only declared dependency manifests and lockfiles;
- deny-first protected-path checks;
- explicit package-manager and directory allowlists;
- vulnerability and license policy checks;
- compatibility verification for affected workspaces;
- a policy-recorded lockfile budget exception; and
- human merge approval.

Generic gates are not silently disabled. Every exception is explicit,
versioned, and visible in evidence.

## Rollback and Failure Modes

### Unmerged PR

The safe response is to close the PR. Remote branch deletion is optional,
human-authorized cleanup and is never executed automatically.

### Merged PR

The control plane proposes a new revert PR based on the merge method reported
by GitHub:

- merge commit: revert the merge commit with the correct parent;
- squash merge: revert the squash commit; or
- rebase merge: record the merged commit list and propose reverse-order
  reverts.

The plan is evidence, not authorization. A human reviews and executes the
revert PR.

### Control-Plane Failure

The safe fallback is:

- `proposal-only`, which emits evidence without modifying Git; or
- `disabled`, which stops autonomous generation.

The system never restores the current unguarded workflow as rollback.

## Acceptance Criteria

### Deterministic Safety Tests

Tests use local temporary Git repositories, fixtures, and mocked model
responses. They do not require live DeepSeek calls or destructive remote
operations.

1. Reject absolute, traversal, NUL, Unicode-conflicting, duplicate,
   case-conflicting, and symlink-escaping paths.
2. Reject every configured protected domain before delivery-tree mutation.
3. Reject file-count, per-file, and total-diff budget violations.
4. Reject malformed, partial, oversized, or schema-invalid triggers and model
   responses.
5. Preserve literal `$()`, backticks, quotes, and `${...}` as opaque file
   content and prove no sentinel command executes.
6. Detect base movement and branch-name collision before publication.
7. Fail before commit when typecheck or required package tests fail.
8. Detect candidate mutation after manifest binding.
9. Verify manifest hashing is canonical and non-self-referential.
10. Bind the post-merge receipt to repository, merge SHA, PR, and manifest
    hash without mutating the reviewed candidate.
11. Select rollback plans correctly for merge, squash, and rebase strategies.
12. Derive budgets from the exact Git diff, not response length.
13. Preserve the existing orchestrator test baseline.
14. Pass root typecheck.
15. Qualify Dependabot through its explicit profile without auto-merge.

### Structural Acceptance

The implementation must also prove:

- both autonomous code-generation workflows use the shared control plane;
- neither workflow uses force-push;
- neither workflow inserts untrusted values into shell source;
- the publication job is separate from read-only generation and validation;
- the `auto-healing.yml` PR path works;
- hardcoded repository literals are replaced by validated runtime identity;
- Dependabot auto-merge is disabled;
- branch-protection and token requirements are documented;
- the local Bun CLI and reusable action use the same policy core; and
- the new skill contains conventions only, not fake enforcement claims.

Optional manual E2E tests may exercise real GitHub PR creation after all
fixture tests pass. They are not required for deterministic unit verification.

## Impact

### Additions

Expected additions include:

- control-plane modules in `packages/drenyra-orchestrator/`;
- control-plane configuration;
- a local Bun CLI;
- a reusable GitHub Action;
- deterministic fixtures and tests;
- one project skill;
- repository candidate manifests; and
- repository policy documentation.

### Modifications

Expected modifications include:

- `packages/drenyra-orchestrator/src/index.ts`;
- `.github/workflows/auto-healing.yml`;
- `.github/workflows/sdd-auto-implement.yml`; and
- `.github/workflows/dependabot-auto-merge.yml`.

This change directly affects autonomous CI behavior. It does not claim zero CI
impact.

## Dependencies

The proposal uses existing project capabilities:

- Bun 1.3.11;
- GitHub Actions and repository rulesets;
- `packages/drenyra-orchestrator`;
- the existing test infrastructure; and
- Engram for expanded operational context.

No new runtime library is approved by this proposal. Design must justify any
new dependency before tasks are created.

## Documentation Impact

The implementation must update:

- `AGENTS.md`;
- `CODEX-MAP.md` when index restoration ships;
- `packages/drenyra-orchestrator/README.md`;
- action and repository-policy documentation;
- the new project skill; and
- OpenSpec artifacts for this change.

Generated reference material and human-authored policy documentation remain
separate.

## Delivery and Review Workload

The forecast exceeds one reviewable PR and should use chained delivery.

### Phase 1

- PR1: schemas, canonicalization, policy, manifest, and fixture tests.
- PR2: verification, CLI, reusable action, and workflow hardening.
- PR3: Dependabot profile, repository policy docs, and the active skill.

Each PR targets at most 400 changed lines. If task planning cannot preserve
that boundary, the workload guard must stop before apply and request a revised
slice or explicit exception.

Executable workflow, shell/process, and active agent-content changes are not
trivial documentation. Native bounded-review classification selects the
required lenses for each exact candidate.

### Phase 2

- PR4: canary and automated learning analysis.
- PR5: codebase index restoration and drift enforcement.

## Risks

### Path and Filesystem Semantics

Unicode, symlink, case-folding, and cross-platform path behavior can undermine
naive checks. The design must define one canonical algorithm and test Linux,
macOS-compatible, and Windows-style input forms.

### GitHub Authority Drift

Base SHA, repository identity, token scope, or ruleset state can change during
a run. Publication must rederive them immediately before push and fail closed
on drift.

### Verification Cost

Root typecheck and affected-package tests may be expensive. Optimization may
narrow verified work, but must not weaken required coverage.

### Dependabot Lockfile Size

Lockfile changes can exceed standard budgets. Only the explicit Dependabot
profile may grant a recorded exception.

### Over-Engineering

The first slice must deliver safe PR creation, not a generic autonomous-agent
platform. Canary execution and automated learning remain Phase 2.

## Alternatives Rejected

### YAML-Only Hardening

Rejected because duplicated workflow logic will drift and is difficult to test
as a policy engine.

### New Standalone Package

Rejected because it overlaps with `packages/drenyra-orchestrator` and expands
package surface without a distinct domain boundary.

### Skill-Based Enforcement

Rejected because prompts cannot enforce paths, Git authority, hashes, or
verification.

### Autonomous Merge

Rejected because human approval is a product-safety invariant for Drenyra.

## Next Phase

Proceed to spec only after this proposal is approved.

The spec must formalize:

- trigger and change-set schemas;
- canonical path and isolated-candidate algorithms;
- policy precedence;
- manifest and receipt schemas;
- GitHub authority checks;
- verification resolution;
- Dependabot qualification;
- rollback-plan selection; and
- deterministic fixture scenarios.
