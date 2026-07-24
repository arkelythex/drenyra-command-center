# Exploration: Autonomous-Change Control Plane

**Change:** `autonomous-change-control-plane`
**Created:** 2026-07-22
**Revised:** 2026-07-22 (manual evidence correction)
**Phase:** explore
**Artifact store:** hybrid (OpenSpec + Engram)
**Status:** validated

---

## Executive Summary

Drenyra already has strong SDD, review, testing, documentation, and fiscal
controls. Its autonomous code-generation workflows do not use those controls.

Two workflows currently accept DeepSeek output and copy complete files into the
repository before a bounded diff is validated:

- `.github/workflows/auto-healing.yml`
- `.github/workflows/sdd-auto-implement.yml`

Both can stage broad changes with `git add -A` and push with force. Neither has
a request-scoped writable-root policy, protected-path gate, bounded diff,
required verification, or content-bound provenance.

`auto-healing.yml` also checks a `FILES_COMMITTED` output that its generation
step never publishes. Its PR-creation path is therefore unreachable.

The recommended direction is to extend `packages/drenyra-orchestrator/` with a
mechanical autonomous-change control plane. A new package would duplicate the
existing orchestration boundary. Additional broad skills would describe rules
without enforcing them.

## Project Scale and Risk

Drenyra contains:

- five primary applications;
- eighteen project-level skills;
- TypeScript/Bun, React, Next.js, Python, Go, and Rust surfaces;
- fiscal, SUNAT, SIRE, UBL, IGV, CDR, tenant, and RUC controls;
- multiple CI, AI, review, release, and documentation workflows; and
- an existing orchestrator package with routing and review-workload logic.

This is not a generic automation repository. Fiscal correctness, tenant
isolation, auditability, human approval, and reversibility are safety
requirements.

## Verified Workflow Inventory

The repository has nineteen YAML workflows under `.github/workflows/`.

### Autonomous Code Generation

`auto-healing.yml`:

- consumes a bug issue;
- calls DeepSeek;
- parses model-selected paths and complete contents;
- copies generated files into the repository;
- stages all changes;
- force-pushes a branch; and
- fails to create the intended PR because of the output-wiring bug.

`sdd-auto-implement.yml`:

- consumes an approved automation signal;
- calls DeepSeek;
- uses the same broad file-copy pattern;
- stages and force-pushes changes; and
- creates a PR when its path succeeds.

The workflow contains hardcoded `arkelythex/Drenyra` repository literals.
Those literals currently match the verified Git `origin`:

`git@github.com:arkelythex/Drenyra.git`

The issue is not a stale owner today. The issue is portability and the absence
of repository identity rederivation before publication.

### Proposal and Review Automation

`auto-sdd.yml` creates issue/proposal content and does not mutate the tree.

`ai-review.yml` and `judgment-day.yml` inspect changes and publish findings.
They are not code-generation delivery paths.

### Dependency Automation

`dependabot-auto-merge.yml` merges qualified dependency PRs automatically.
The user later decided that v1 must disable auto-merge and require human
approval after a separate Dependabot qualification profile.

### Supporting CI

The remaining workflows provide CI, quality, documentation, release,
post-merge, contract, sync, and archived pilot behavior. They are integration
points but are not the primary untrusted-generation boundary.

## Current Safety Gaps

### Untrusted Input Transport

Issue bodies and model responses are inserted into automation without one
shared, versioned input contract. The target design must treat them as opaque
data and never as shell source.

### Path Authority

The current parser accepts model-selected paths without a shared policy for:

- absolute paths;
- traversal;
- NUL bytes;
- Unicode normalization;
- case conflicts;
- duplicate normalized paths;
- symlink escapes; or
- repository/worktree authority.

### Candidate Isolation

Complete-file output is copied toward the repository before the exact Git diff
is derived and admitted. The delivery worktree is too close to the parsing
boundary.

### Scope and Budget

There is no mechanical maximum for:

- changed files;
- changed lines per file;
- total changed lines; or
- request-scoped writable roots.

### Protected Domains

There is no shared deny-first registry for fiscal, tenant/RUC, auth, security,
payments, migrations, seeds, CI, release, OpenSpec, skills, or policy files.

### Verification

The workflows do not resolve and run required typecheck and affected-package
tests against the exact candidate before publication.

### Provenance and Evidence

There is no content-bound manifest joining:

- frozen base SHA;
- candidate paths and modes;
- exact diff hash;
- model, prompt, and response hashes;
- policy verdicts;
- verification evidence; and
- intended PR identity.

### Publication Authority

The workflows do not share one rule for:

- repository identity;
- base drift;
- branch collision;
- idempotent replay;
- least-privilege job separation; or
- protected-branch assumptions.

## Documentation Drift

The repository documentation and root scripts still refer to:

- `.codebase/index.yml`;
- `scripts/codebase/generate-index.ts`; and
- `scripts/ai/check-context-control-plane-foundation.ts`.

Those files are absent. `CODEX-MAP.md` also says the index generator was
removed. This is a stale contract between documentation, scripts, and disk.

Index restoration belongs in a later slice. It must not distract from the
immediate autonomous-code safety boundary.

## Existing Capabilities to Reuse

`packages/drenyra-orchestrator/` already owns:

- delegation routing;
- skill resolution;
- memory conventions;
- review-risk classification inputs;
- review workload forecasting; and
- shared orchestration configuration.

The control plane is a natural extension of that package. It should not create
a second orchestration source of truth.

The existing project skills already cover SDD, fiscal compliance, RUC scope,
testing, documentation, hooks, review lenses, and chained delivery.

Only one narrow skill is justified:

`autonomous-change-control`

It should explain operating conventions. Mechanical code must enforce paths,
budgets, Git authority, hashes, and verification.

## Options

### Option A: Harden YAML Independently

Add safeguards directly to both workflows.

Benefits:

- smallest immediate diff;
- direct bug repair; and
- minimal package work.

Costs:

- duplicated policy;
- poor unit-testability;
- continued YAML drift; and
- no reusable local verification surface.

This is useful as an emergency containment measure, not the target
architecture.

### Option B: Create a New Control-Plane Package

Add a separate package for autonomous-change policy.

Benefits:

- isolated ownership; and
- independent API surface.

Costs:

- overlap with the current orchestrator;
- another package boundary; and
- duplicated configuration and risk concepts.

This option is rejected unless design discovers a real independent domain
boundary.

### Option C: Extend the Existing Orchestrator

Add control-plane capabilities to `packages/drenyra-orchestrator/` and expose
them through a reusable GitHub Action and local Bun CLI.

Benefits:

- one policy core;
- reuse of existing risk and workload concepts;
- deterministic unit and fixture testing;
- GitHub/CLI behavioral parity; and
- no new package proliferation.

Costs:

- regression risk inside the orchestrator;
- broader package responsibility; and
- shell/process integration requiring strong resilience review.

This is the recommended option.

## Recommended First Slice

Phase 1 should deliver:

1. trigger and model-response schemas;
2. opaque input transport;
3. path canonicalization;
4. isolated candidate construction;
5. exact diff derivation;
6. request-scoped writable roots;
7. deny-first protected paths;
8. file and changed-line budgets;
9. affected-package verification;
10. provenance and candidate manifest;
11. repository identity and publication checks;
12. unique non-force branch and PR delivery;
13. Dependabot qualification without auto-merge;
14. deterministic fixtures; and
15. one active control-plane skill.

Phase 2 may add canary execution, automated learning analysis, and codebase
index restoration.

## Resolved Product Decisions

The user confirmed:

- verified failures and approved OpenSpec-backed SDD changes are the only v1
  triggers;
- the system may create a branch and PR, but a human must merge;
- GitHub Actions and a local Bun CLI share one policy core;
- repository evidence stores the candidate manifest while Engram stores
  supplemental operational context;
- Dependabot is qualified but not auto-merged; and
- scheduled maintenance and autonomous merge are out of v1.

## Risks

### Filesystem Semantics

Unicode, symlink, case-folding, and cross-platform path rules are easy to
implement incorrectly. Deterministic fixtures must cover them.

### Git Authority Drift

Repository identity, base SHA, remote state, or branch existence may change
between generation and push. Publication must rederive authority immediately
before mutation.

### Over-Engineering

The target is safe PR generation, not a generic autonomous-agent platform.
Phase 1 must stay bounded.

### Verification Cost

Root typecheck and affected-package tests may be expensive. Optimization may
narrow work, but must not weaken required evidence.

### Dependency Diff Size

Lockfile diffs can exceed AI-code budgets. Dependabot needs an explicit profile,
not silent gate relaxation.

## Delivery Forecast

The work exceeds one reviewable PR.

A likely chain is:

- PR1: schemas, paths, candidate isolation, policies, manifest, and tests;
- PR2: verification, CLI, reusable action, and workflow hardening; and
- PR3: Dependabot profile, repository policy docs, and active skill.

Each PR should remain at or below the 400-line review budget. Native bounded
review classifies each exact candidate and selects its lenses.

## Non-Goals

This change does not:

- add a new orchestration package;
- permit direct-to-main mutation;
- permit force-push;
- permit protected-path runtime overrides;
- auto-execute rollback;
- auto-merge dependencies;
- redesign SDD; or
- use skills as fake security enforcement.

## Next Step

The validated proposal and three technical specs now supersede the open
questions from this exploration. Design must trace every architectural decision
to the requirement identifiers in those specs.
