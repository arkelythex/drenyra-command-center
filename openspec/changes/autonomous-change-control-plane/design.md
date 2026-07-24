# Architecture Design: Autonomous Change Control Plane

<!-- markdownlint-configure-file {"MD013": false, "MD040": false, "MD060": false} -->
<!-- Wide traceability tables and ASCII sequence diagrams require these exceptions. -->

**Change:** `autonomous-change-control-plane`
**Phase:** diseño (design)
**Created:** 2026-07-22
**Revised:** 2026-07-22 (design gate correction — 24 items; authority correction — REQ-CCP-003)
**Artifact store:** hybrid (OpenSpec + Engram)
**Status:** ready for review

---

## Executive Summary

This design extends `packages/drenyra-orchestrator/` with a mechanical control plane that validates untrusted model output, admits only safe paths before any content is materialized, derives changes inside an isolated candidate tree, enforces deny-first policies, binds content-addressed evidence to the candidate, and permits only unique-branch PR delivery with human merge approval. Every architectural decision traces to the 31 requirements across `REQ-CCP-###` (core), `REQ-POL-###` (policy), and `REQ-DEL-###` (delivery).

The control plane operates as a pure domain/policy core separated from filesystem, Git, GitHub, process, hashing, clock, and Engram adapters. The same core runs from GitHub Actions and a local Bun CLI with behavioral parity. The synchronous pipeline ends at PR creation; post-merge receipt processing is an asynchronous distinct workflow.

---

## Component Boundaries

The control plane lives under `packages/drenyra-orchestrator/src/control-plane/`. It does not create a new package. It extends the existing orchestrator's responsibility without overlapping its delegation-routing, skills-resolution, or review-lens domains.

```
packages/drenyra-orchestrator/
├── src/
│   ├── index.ts                          # barrel (existing)
│   ├── types.ts                          # orchestrator types (existing)
│   ├── ...                               # existing modules
│   │
│   ├── control-plane/                    # ← NEW: control-plane domain
│   │   ├── index.ts                      # barrel: public types + pipeline entry
│   │   ├── types.ts                      # domain types
│   │   │
│   │   ├── schemas/                      # schema validation (Zod 4, .strict())
│   │   │   ├── trigger.ts                # REQ-CCP-002, REQ-CCP-003
│   │   │   ├── approval.ts               # REQ-CCP-003: approval record schema
│   │   │   ├── change-set.ts             # REQ-CCP-002
│   │   │   ├── manifest.ts               # REQ-CCP-010
│   │   │   └── receipt.ts                # REQ-CCP-011
│   │   │
│   │   ├── canonicalization/
│   │   │   ├── path.ts                   # REQ-CCP-004: path authority
│   │   │   ├── artifact-hash.ts          # REQ-CCP-003: pure artifact-set hash
│   │   │   ├── manifest.ts               # REQ-CCP-010: manifest canonicalization
│   │   │   └── hash.ts                   # REQ-CCP-009: provenance hashing
│   │   │
│   │   ├── admission/                    # pre-materialization path admission
│   │   │   ├── path-authority.ts         # lstat/symlink filesystem adapter
│   │   │   ├── protected-paths.ts        # REQ-POL-002, REQ-POL-003
│   │   │   └── writable-roots.ts         # REQ-POL-001
│   │   │
│   │   ├── candidate/                    # isolated candidate operations
│   │   │   ├── isolation.ts              # REQ-CCP-005: worktree lifecycle
│   │   │   ├── materialize.ts            # REQ-CCP-005: file write
│   │   │   └── diff.ts                   # REQ-CCP-006: diff derivation
│   │   │
│   │   ├── policy/                       # post-diff policy enforcement
│   │   │   ├── budgets.ts                # REQ-CCP-007: budget admission
│   │   │   ├── modes.ts                  # REQ-POL-005: autonomy modes
│   │   │   └── dependabot.ts             # REQ-POL-006: Dependabot profile
│   │   │
│   │   ├── verification/                 # affected-workspace verification
│   │   │   ├── registry.ts               # polyglot verification registry
│   │   │   ├── resolver.ts               # REQ-CCP-008: workspace resolution
│   │   │   └── runner.ts                 # REQ-CCP-008: command execution
│   │   │
│   │   ├── delivery/                     # publication + identity
│   │   │   ├── publication.ts            # REQ-DEL-001, REQ-DEL-003, REQ-DEL-005
│   │   │   ├── identity.ts               # REQ-DEL-004 (reuses authority identity)
│   │   │   └── patch.ts                  # canonical patch handoff
│   │   │
│   │   ├── receipt/                      # post-merge receipt (async)
│   │   │   └── post-merge.ts             # REQ-CCP-011, REQ-POL-007
│   │   │
│   │   ├── transport/
│   │   │   └── input.ts                  # REQ-CCP-001
│   │   │
│   │   ├── authority/                    # trigger authority (pure + adapters)
│   │   │   ├── trigger.ts                # REQ-CCP-003: pure authority decision
│   │   │   ├── approval-store.ts         # fixed-path Git-tree adapter
│   │   │   ├── protected-base.ts         # GitHub ruleset evidence adapter
│   │   │   ├── native-sdd.ts             # native SDD status adapter
│   │   │   └── github-ci.ts              # attested CI reproduction adapter
│   │   │
│   │   ├── diagnostics/
│   │   │   ├── taxonomy.ts               # REQ-CCP-013
│   │   │   └── recorder.ts               # REQ-CCP-012
│   │   │
│   │   ├── orchestration/
│   │   │   └── pipeline.ts               # main pipeline (validate → PR)
│   │   │
│   │   ├── rollback/
│   │   │   └── plan.ts                   # REQ-POL-007
│   │   │
│   │   └── config/
│   │       └── control-plane-config.ts   # configuration types + defaults
│   │
│   └── cli/
│       └── control-plane-cli.ts          # REQ-DEL-006: local Bun CLI
│
├── package.json                          # direct: zod ^4.4.3 + existing minimatch 10.2.5
└── tsconfig.json                         # unchanged
```

---

## Schema Validation Strategy

### Decision: Zod 4 (^4.4.3)

The control plane introduces **Zod 4** (`zod@^4.4.3`) as the only new resolved runtime package for schema validation. The orchestrator also declares `minimatch@10.2.5` directly when protected-path matching is added; that exact version already exists in the repository lock and must be reused rather than accessed through workspace hoisting. The caret range for Zod is pinned by `bun.lock`. All schemas use `.strict()` to reject unknown keys.

### Tradeoff Analysis

| Factor                | Zod 4 (^4.4.3)                                             | Dependency-Free Type Guards                                          |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| **Validation code**   | ~50 lines of declarative `.strict()` schemas               | ~200+ lines of hand-written guards, error paths, and coercion checks |
| **Type safety**       | Types inferred from schemas — single source of truth       | TypeScript types must be kept manually in sync with guards           |
| **Schema versioning** | Discriminated unions on `schema_version` — trivial         | Manual dispatch with fallthrough risk                                |
| **Error messages**    | Structured, path-precise, automatic                        | Hand-crafted per validator; drift risk                               |
| **Input coercion**    | `.strict()` rejects unknown keys by default                | Must hand-write every coercion rejection                             |
| **Budget impact**     | ~12 KB gzipped added to bundle                             | ~200 validation lines consume PR line budget                         |
| **Dependency risk**   | Single runtime dep; Zod 4 has zero deps of its own         | None                                                                 |
| **Version pinning**   | Caret range in `package.json`; exact version in `bun.lock` | N/A                                                                  |

### Rationale

The proposal requires validation of trigger payloads, model responses, change-sets, manifests, and receipts — each with nested objects, discriminated unions, and strict coercion rejection. Hand-writing this would consume 200+ lines, displacing core safety logic. Zod 4 compresses this to declarative `.strict()` schemas that serve as both validation and type source. Its zero-dependency tree minimizes supply-chain risk. Zod is the only new resolved runtime package; minimatch is an already-reviewed repository dependency declared directly for package-boundary correctness.

### Fallback

If Zod 4 is rejected, the dependency-free strategy uses TypeScript type guards with a shared `ValidationResult<T>` discriminated union. The cost is ~200 additional lines, requiring the slice to be split or the budget exception recorded. The design recommends Zod 4.

---

## Approval Record and Trigger Authority

### Approval Record Schema (`schemas/approval.ts`)

The approval record is a versioned, repository-controlled JSON file at the
fixed path `.drenyra/control-plane/approvals/<change-name>.json`. It is
privileged and human-controlled. It does NOT contain its own containing
commit SHA — that would be self-referential. Instead it binds the approved
artifact commit (the commit whose proposal/specs/design/tasks were reviewed,
BEFORE the approval record was committed).

```typescript
interface ApprovalRecord {
  readonly schema_version: 1
  readonly change_id: string
  readonly repository: {
    readonly repositoryId: string
    readonly owner: string
    readonly name: string
  }
  readonly approved_artifact_commit_sha: string
  // The commit whose proposal/specs/design/tasks were reviewed.
  // This is BEFORE and independent of the approval-record commit.
  readonly protected_base_ref: string // e.g., "refs/heads/main"
  // Live base SHA is derived at runtime, not recorded here.
  readonly artifact_set_hash: string
  // Proposal/spec/design use exact bytes. tasks.md canonicalization
  // normalizes only a leading `- [ ]` / `- [x]` progress marker to
  // `- [ ]`; every other byte remains bound. Therefore checkbox-only
  // progress survives, while task text/order/owner or scope edits revoke
  // approval. Paths prefix each digest and sort by path. The approval
  // record itself is excluded.
  readonly approved_autonomy_ceiling: AutonomyMode
  readonly approved_writable_roots: Record<TriggerProfile, readonly string[]>
  readonly approved_budgets: BudgetLimits
  readonly approver: string // informational GitHub login
  readonly approved_at: string // informational ISO-8601 timestamp
  readonly policy_version: string
}
```

### Repository Identity (`delivery/identity.ts`)

Introduced early so authority and publication reuse the same module.
`RepositoryIdentity` includes live base ref AND live base SHA:

```typescript
interface RepositoryIdentity {
  readonly repositoryId: string
  readonly owner: string
  readonly name: string
  readonly baseRef: string // live protected ref (from config/event)
  readonly baseSha: string // live SHA (from Git, cross-checked)
  readonly remoteUrl: string
}
```

- Expected immutable repository ID, owner/name, and protected base ref come from versioned repository config. Live remote/Git state is always checked against them; trusted event/API evidence is additionally cross-checked when present.
- SHA is rederived with Git for the validated ref; disagreement with event/API evidence fails closed.
- Branch/ruleset protection evidence comes from an injected GitHub adapter.
- The offline local CLI can validate and propose from config + Git evidence but MUST NOT gain publication/full authority without live protection evidence.

### Artifact-Set Hasher and Git-Tree Adapter

`canonicalization/artifact-hash.ts` is pure: it receives repository-relative paths and bytes, validates the required proposal/spec/design/tasks set, normalizes only task progress markers, sorts by path bytes, and computes the artifact-set hash. It imports no Git, filesystem, process, or network adapter.

`authority/approval-store.ts` is the I/O adapter. After validating the canonical change name, it reads the fixed approval path and required artifact bytes from the exact live base tree with argv-only `git show`/`git ls-tree`, and asks Git whether `approved_artifact_commit_sha` is an ancestor of the live base. It returns plain evidence to the pure hasher and authority decision. Any artifact change invalidates approval.

### Trigger Authority (`authority/trigger.ts`)

Pure function that never performs I/O:

```typescript
interface AuthorityInput {
  readonly repositoryIdentity: RepositoryIdentity
  // includes live baseRef + live baseSha
  readonly approvalRecord: ApprovalRecord | null
  readonly recomputedArtifactHash: string | null
  // from live base tree (not the approved artifact commit)
  readonly artifactCommitIsAncestor: boolean
  readonly sddStatus: NativeSddStatus | null
  readonly ciEvidence: VerifiedCiEvidence | null
  readonly hasBranchProtectionEvidence: boolean
  readonly triggerProfile: TriggerProfile
  readonly requestedMode: AutonomyMode
  readonly requestedScope: { writableRoots: string[]; budgets: BudgetLimits }
}

type AuthorityVerdict =
  | { kind: 'approved'; ceiling: AutonomyMode }
  | { kind: 'denied'; reason: ErrorTaxonomyCode; detail: string }

function evaluateTriggerAuthority(input: AuthorityInput): AuthorityVerdict
```

The pure function enforces:

- **SDD path** (8 checks): live repository identity match; live base SHA
  derived from Git; approval record read from live protected base tree;
  artifact commit is ancestor of live base; artifact hash recomputed from
  LIVE base tree matches; native SDD status `applyState: ready` +
  `nextRecommended: apply` + empty `blockedReasons`; autonomy ceiling
  compatible with requested mode/scope; branch/ruleset protection evidence
  present (offline CLI always denied full authority).
- **CI-failure path**: Trigger carries original/reproduction run references only. The adapter authenticates original run/job/workflow/log evidence through GitHub, derives the allowlisted argv hash and normalized failure fingerprint, then verifies ONE attested reproduction report from a clean checkout at the same SHA. Repository/workflow/SHA/step/argv/fingerprint must match; original conclusion is failure and reproduction exit is nonzero. Missing, stale, mismatched, or unattested evidence fails closed.
- **No path provided**: Returns `POLICY_DENIED`.

### Adapters

- `authority/native-sdd.ts` — spawns `gentle-ai sdd-status <change> --cwd
<repo> --json --instructions`. Adapter only.
- `authority/github-ci.ts` — authenticates the original run/jobs/workflow/log archive, derives its normalized signature, verifies the single attested reproduction report and trusted producer, then compares signatures. Returns `VerifiedCiEvidence | null`; trigger fields and environment alone never authorize.
- `delivery/identity.ts` — derives `RepositoryIdentity` with live base
  ref + SHA. No hardcoded literals. Cross-checks GitHub env when present.

### Protected-Base Evidence Interface

An injected `ProtectedBaseEvidence` interface is resolved at startup:

```typescript
interface ProtectedBaseEvidence {
  readonly baseRef: string
  readonly baseSha: string
  readonly isProtected: boolean
  readonly rulesetId: string | null
}
```

GitHub adapter provides this from branch-protection API; local CLI returns
`isProtected: false`, which blocks full authority.

### Runtime Authority Flow

```
Trigger received
  │
  ├── profile == "sdd-approved"
  │   ├── Derive repository identity (live base ref + SHA)
  │   ├── Resolve protected-base evidence (GitHub adapter or local=false)
  │   ├── Read approval record from live protected base tree
  │   │   (path: .drenyra/control-plane/approvals/<change-name>.json)
  │   ├── Prove approved_artifact_commit_sha is ancestor of live base
  │   ├── Recompute artifact set hash from LIVE base tree
  │   ├── Run native sdd-status
  │   └── Pure authority decision → approved | denied
  │
  ├── profile == "ci-failure"
  │   ├── Trigger carries original/reproduction run references only
  │   ├── Adapter authenticates original run/workflow/log evidence
  │   ├── Adapter verifies one attested reproduction report
  │   ├── Adapter compares normalized failure signatures
  │   └── Pure authority decision → approved | denied
  │
  └── else → POLICY_DENIED
```

---

## Dependency Direction

```
┌─────────────────────────────────────────────┐
│              CLI / Action (generation job)   │  ← presentation
├─────────────────────────────────────────────┤
│          orchestration/pipeline              │  ← application service
├──────────┬──────────┬──────────┬─────────────┤
│ schemas  │admission │  policy  │canonicaliz. │  ← domain/policy (pure)
├──────────┼──────────┼──────────┼─────────────┤
│  config  │diagnostics│ rollback │  receipt    │  ← domain/policy (pure)
├──────────┴──────────┴──────────┴─────────────┤
│               Adapter Layer                  │  ← I/O (filesystem, Git, │
│  transport/input  verification/runner        │     GitHub, process,    │
│  candidate/*  delivery/*  receipt/post-merge │     hashing, clock)     │
└─────────────────────────────────────────────┘
```

**Rule:** Pure domain/policy modules never import adapter modules. Adapters import domain types and return domain results. The pipeline orchestrates adapters but never embeds I/O in policy decisions.

**Adapters:**

- `transport/input.ts` — reads files or Bun/Node stdin stream → returns `Buffer` + size
- `admission/path-authority.ts` — `lstat`s resolved ancestor chains before materialization and returns plain evidence
- `candidate/isolation.ts` — spawns `git`, manages worktree lifecycle with ownership marker
- `candidate/diff.ts` — spawns `git diff`, parses deterministic output
- `candidate/materialize.ts` — writes validated content with `lstat` parent checks
- `verification/runner.ts` — spawns `bun`/`go`/`python`/`cargo` via `Bun.spawn({cmd: [...], shell: false})`
- `authority/native-sdd.ts` — spawns `gentle-ai sdd-status` child process; returns
  structured status data to pure authority
- `authority/approval-store.ts` — argv-only Git adapter for fixed-path approval/artifact bytes and ancestor proof
- `authority/protected-base.ts` — GitHub API adapter for repository ID and branch/ruleset evidence
- `authority/github-ci.ts` — GitHub API + artifact-attestation adapter for original/reproduction failure reports
- `delivery/publication.ts` — calls GitHub API, spawns `git push`
- `delivery/patch.ts` — generates/applies canonical patch
- `delivery/identity.ts` — reads env vars + `git remote` output; reused by authority
  adapters and publication
- `receipt/post-merge.ts` — separate workflow, consumes GitHub merge event + attestation API

**Pure modules** (no I/O, no process, no filesystem):

- `schemas/*` — Zod `.strict()` schema definitions
- `canonicalization/path.ts` — lexical input + authoritative root → normalized contained `CanonicalPath` (pure; no `lstat`)
- `canonicalization/manifest.ts` — manifest → SHA-256 (pure)
- `canonicalization/hash.ts` — `crypto.createHash` (considered pure; no network/filesystem)
- `admission/*` — path matching, domain registry
- `authority/trigger.ts` — pure authority decision: given repository identity, parsed
  approval record, recomputed artifact hash, native SDD status data, and CI evidence,
  returns an eligibility verdict; never performs I/O
- `policy/*` — budget arithmetic, mode state machine, Dependabot qualification
- `diagnostics/*` — error code mapping, record construction
- `rollback/plan.ts` — merge strategy → rollback instructions
- `config/control-plane-config.ts` — configuration types + authoritative merge logic

---

## Public Types

```typescript
// ── core domain ──

const AUTONOMY_MODE = {
  DISABLED: 'disabled',
  PROPOSAL_ONLY: 'proposal-only',
  FULL: 'full',
} as const
type AutonomyMode = (typeof AUTONOMY_MODE)[keyof typeof AUTONOMY_MODE]

const TRIGGER_PROFILE = {
  CI_FAILURE: 'ci-failure',
  SDD_APPROVED: 'sdd-approved',
  DEPENDABOT: 'dependabot',
} as const
type TriggerProfile = (typeof TRIGGER_PROFILE)[keyof typeof TRIGGER_PROFILE]

// ── schemas ──

interface TriggerPayload {
  readonly schema_version: 1
  readonly change_id: string
  readonly profile: TriggerProfile
  readonly source: {
    readonly workflow: string
    readonly run_id: string // CI-failure: reference only; adapter fetches evidence
    readonly repository: string
  }
  readonly prompt_hash: string
  readonly approval_ref?: string // caller-supplied; never authoritative
  // CI-failure profile: the trigger carries only references.
  // All authoritative evidence (original run data, attested reproduction
  // artifact) is fetched and verified by the GitHub CI adapter.
  readonly ci_ref?: {
    readonly failing_sha: string
    readonly original_run_id: string
    readonly reproduction_run_id: string
  }
}

// ── approval record ──

interface ApprovalRecord {
  readonly schema_version: 1
  readonly change_id: string
  readonly repository: {
    readonly repositoryId: string
    readonly owner: string
    readonly name: string
  }
  readonly approved_artifact_commit_sha: string
  // Commit whose artifacts were reviewed. BEFORE the approval-record commit.
  readonly protected_base_ref: string // e.g., "refs/heads/main"
  readonly artifact_set_hash: string
  readonly approved_autonomy_ceiling: AutonomyMode
  readonly approved_writable_roots: Record<TriggerProfile, readonly string[]>
  readonly approved_budgets: BudgetLimits
  readonly approver: string // informational; does not replace branch protection
  readonly approved_at: string // informational ISO-8601
  readonly policy_version: string
}

// ── authority ──

interface NativeSddStatus {
  readonly change_id: string
  readonly applyState: 'ready' | 'blocked' | 'not-found'
  readonly nextRecommended: string
  readonly blockedReasons: readonly string[]
}

interface OriginalCiFailureEvidence {
  readonly repository_id: string
  readonly workflow_path: string
  readonly workflow_ref: string
  readonly run_id: string
  readonly run_attempt: number
  readonly head_sha: string
  readonly step_id: string
  readonly argv_hash: string
  readonly conclusion: 'failure'
  readonly normalized_failure_fingerprint: string
  readonly authenticated_log_digest: string
}

interface AttestedReproductionReport {
  readonly repository_id: string
  readonly workflow_path: string
  readonly workflow_ref: string
  readonly reproduction_run_id: string
  readonly head_sha: string
  readonly step_id: string
  readonly argv_hash: string
  readonly exit_code: number // must be nonzero
  readonly normalized_failure_fingerprint: string
  readonly bounded_log_digest: string
  readonly artifact_digest: string
  readonly attestation_id: string
  readonly producer_workflow_identity: string
}

interface VerifiedCiEvidence {
  readonly original: OriginalCiFailureEvidence
  readonly reproduced: AttestedReproductionReport
}

// ── protected-base evidence ──

interface ProtectedBaseEvidence {
  readonly baseRef: string
  readonly baseSha: string
  readonly isProtected: boolean
  readonly rulesetId: string | null
}

// ── authority preflight (before model invocation) ──

interface AuthorizedTriggerContext {
  readonly trigger_hash: string
  readonly authority_evidence_hash: string
  readonly repository_identity: RepositoryIdentity
  readonly approved_mode: AutonomyMode
  readonly approved_scope_hash: string
  readonly policy_version: string
  readonly context_hash: string // excludes itself; not a bearer authorization
}

// ── verified candidate handoff (pipeline → patch delivery) ──

interface VerifiedCandidateHandoff {
  readonly manifest: PrePrManifest
  readonly diff: string // unified diff bytes, deterministic options
  readonly diagnosticsHash: string
  readonly repositoryIdentity: RepositoryIdentity
  readonly baseSha: string
}

interface ChangeSet {
  readonly schema_version: 1
  readonly change_id: string
  readonly operations: FileOperation[]
}

interface FileOperation {
  readonly path: string // relative, pre-canonicalization
  readonly operation: 'create' | 'update' | 'delete'
  readonly content?: string // UTF-8 text only in v1; no base64/binary support
  readonly mode?: '100644' | '100755' // default 100644
}

// ── canonicalization ──

interface CanonicalPath {
  readonly raw: string
  readonly normalized: string
  readonly segments: readonly string[]
}

interface AdmittedChange {
  readonly path: CanonicalPath
  readonly operation: 'create' | 'update' | 'delete'
  readonly content: Buffer | null // null only for delete
  readonly mode: '100644' | '100755' | null
}

// v1: no binary/Non-UTF-8 materialization. Binary change-sets are rejected
// and routed to human workflow. Dependabot lockfiles are text.

// ── candidate ──

interface CandidateContext {
  readonly worktreePath: string
  readonly ownershipMarker: string
  readonly baseSha: string
  readonly changes: readonly AdmittedChange[]
}

interface DiffReport {
  readonly filesChanged: number
  readonly files: readonly DiffFileEntry[]
  readonly totalAdded: number
  readonly totalDeleted: number
  readonly isEmpty: boolean
}

interface DiffFileEntry {
  readonly path: string
  readonly changeType: 'added' | 'modified' | 'deleted'
  readonly oldPath?: string // only when rename detection disabled → absent
  readonly addedLines: number
  readonly deletedLines: number
  readonly mode: string
}

// ── admission (pre-materialization) ──

interface PathAdmissionVerdict {
  readonly passed: boolean
  readonly deniedPaths: readonly DeniedPath[]
}

interface DeniedPath {
  readonly path: CanonicalPath
  readonly matchedDomain: string
  readonly rule: 'protected' | 'writable-root' | 'path-authority'
}

// ── policy (post-diff) ──

interface BudgetVerdict {
  readonly passed: boolean
  readonly violations: readonly BudgetViolation[]
}

interface BudgetViolation {
  readonly type: 'file-count' | 'per-file' | 'total'
  readonly limit: number
  readonly actual: number
  readonly path?: string
}

interface VerificationExecution {
  readonly name: string
  readonly argv: readonly string[]
  readonly root: string
  readonly exitCode: number
  readonly stdoutHash: string
  readonly stderrHash: string
}

interface VerificationResult {
  readonly passed: boolean
  readonly executions: readonly VerificationExecution[]
}

// ── manifest ──

interface PrePrManifest {
  readonly change_id: string
  readonly trigger_identity: string
  readonly frozen_base_sha: string
  readonly candidate_paths: readonly ManifestPathEntry[]
  readonly candidate_tree_hash: string
  readonly envelope_hash: string
  readonly diff_summary: ManifestDiffSummary
  readonly model_id: string
  readonly prompt_hash: string
  readonly response_hash: string
  readonly policy_version: string
  readonly path_admission: PathAdmissionVerdict
  readonly budget_verdict: BudgetVerdict
  readonly verification: VerificationResult
  readonly rollback_plan_type: string
  readonly intended_base: string
  readonly intended_head: string
  readonly created_at: string // informational; excluded from identity
}

// ── candidate identity hash (publication idempotency) ──

// candidate_identity_hash = SHA-256 over canonical concatenation of:
//   repositoryId + baseSha + verified trigger-authority hash +
//   model ID + prompt hash + raw response hash +
//   sorted normalized path/mode/content hashes + policy version.
//
// This binds stable provenance as well as candidate bytes. Explicitly
// EXCLUDED: timestamps, correlation IDs, workflow run IDs, created_at,
// intended_head, branch name, and mutable delivery metadata.

// ── delivery ──

interface RepositoryIdentity {
  readonly repositoryId: string
  readonly owner: string
  readonly name: string
  readonly baseRef: string // live protected ref (from config/event, not env alone)
  readonly baseSha: string // live SHA (from Git, cross-checked)
  readonly remoteUrl: string
}

interface PublicationResult {
  readonly branch: string
  readonly prNumber: number
  readonly prUrl: string
  readonly candidateIdentityHash: string
  readonly isReplay: boolean
}

// ── canonical patch handoff ──

interface CanonicalPatch {
  readonly candidateIdentityHash: string
  readonly baseSha: string
  readonly repositoryIdentity: RepositoryIdentity
  readonly manifest: PrePrManifest
  readonly diff: string // unified diff, deterministic options
  readonly diagnosticsHash: string
}

// ── receipt ──

interface PostMergeReceipt {
  readonly merge_sha: string
  readonly pr_number: number
  readonly pr_url: string
  readonly approvals: readonly GitHubApproval[]
  readonly merged_at: string
  readonly merged_by: string
  readonly pre_pr_manifest_hash: string
  readonly candidate_identity_hash: string
  readonly repository: RepositoryIdentity
  readonly merge_strategy: 'merge' | 'squash' | 'rebase'
  readonly receipt_hash: string // excludes this field during hashing
  readonly created_at: string
}

interface ReceiptStorageRecord {
  readonly receiptHash: string
  readonly attestationId: string // returned after receipt hashing
  readonly checkRunId: number
}

interface GitHubApproval {
  readonly reviewer: string // GitHub login
  readonly state: 'approved' | 'changes_requested' | 'commented'
  readonly submitted_at: string
  readonly review_id: number
}

// The receipt records GitHub review/approval evidence as provided by the
// GitHub API. It does NOT claim independent proof of human identity.
// Repository branch-protection rules and required-reviewer configuration
// are the enforcement mechanism; the receipt records the observable evidence.

// ── diagnostics ──

interface DiagnosticRecord {
  readonly operation: string
  readonly correlation_id: string
  readonly timestamp: string
  readonly input_hash: string // SHA-256 of the operation's input bytes (REQ-CCP-012)
  readonly outcome: 'pass' | 'fail' | 'degraded'
  readonly error_code?: ErrorTaxonomyCode
  readonly detail: Record<string, unknown>
}

// Full diagnostics stored as evidence artifacts (no step-output truncation).
// Action summary outputs expose only: outcome, error_code, correlation_id,
// manifest_hash (digest only).
```

---

## State Machine

### Autonomy Mode Transitions

```
    ┌──────────┐      ┌────────────────┐      ┌──────────┐
    │ disabled │◄─────│ proposal-only  │◄─────│  full    │
    └──────────┘      └────────────────┘      └──────────┘
         ▲                  ▲                      │
         │                  │                      │
         └──────────────────┴──────────────────────┘
              (rollback always returns to
               proposal-only or disabled)

    disabled:       No model calls. No Git mutation.
                    Triggers rejected at validation gate.
    proposal-only:  Validate input + canonicalize + path admission.
                    Emit diagnostics. No candidate, no Git mutation.
    full:           Complete synchronous pipeline:
                    validate → canonicalize → path admission →
                    candidate → diff → budget admission →
                    verify → manifest → publish → PR created.
```

### Synchronous Pipeline Phase State Machine (full mode)

```
    [Trigger Received]
           │
           ▼
    ┌──────────────┐
    │  VALIDATE    │ REQ-CCP-001, REQ-CCP-002, REQ-CCP-003
    │              │ transport + schema + eligibility
    │              │ (trigger approval rederived from repository authority;
    │              │  Engram never authorizes)
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │ CANONICALIZE │ REQ-CCP-004
    │              │ path authority + conflict detection (no I/O)
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │ PATH ADMIT   │ REQ-POL-001, REQ-POL-002, REQ-POL-003
    │              │ protected-path > writable-root (pure path matching)
    │              │ NO content has been materialized yet
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │  CANDIDATE   │ REQ-CCP-005
    │              │ isolated worktree + lstat ancestors + materialize
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │    DIFF      │ REQ-CCP-006
    │              │ deterministic diff derivation + emptiness check
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │ BUDGET ADMIT │ REQ-CCP-007
    │              │ file-count + per-file + total budget enforcement
    │              │ (applied against exact diff, not raw response)
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │   VERIFY     │ REQ-CCP-008
    │              │ polyglot verification registry → resolve + run
    └──────┬───────┘
           │ pass
           ▼
    ┌──────────────┐
    │  MANIFEST    │ REQ-CCP-009, REQ-CCP-010
    │              │ candidate_identity_hash + envelope hash
    │              │ manifest committed to candidate via internal write channel
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  PUBLISH     │ REQ-DEL-001 through REQ-DEL-005
    │              │ (separate job: fresh checkout → apply patch →
    │              │  rederive hashes → identity → collision → branch → PR)
    └──────┬───────┘
           │ success
           ▼
       [PR Created — synchronous pipeline ENDS here]

    ─── asynchronous boundary (human review/merge happens later) ───

    ┌──────────────┐
    │   RECEIPT    │ REQ-CCP-011, REQ-POL-007
    │              │ distinct workflow: pull_request.closed (merged: true)
    │              │ GitHub attestation + receipt hash + Engram supplemental
    └──────────────┘
```

Each phase failure terminates the pipeline immediately and emits a diagnostic record with the appropriate `ErrorTaxonomyCode`. No phase is skipped or retried automatically.

---

## Error / Result Model

### Result Type

```typescript
const CONTROL_PLANE_RESULT = {
  OK: 'ok',
  ERR: 'err',
} as const

type ControlPlaneResult<T> =
  | { kind: 'ok'; value: T; diagnostics: readonly DiagnosticRecord[] }
  | {
      kind: 'err'
      error: ControlPlaneError
      diagnostics: readonly DiagnosticRecord[]
    }

interface ControlPlaneError {
  readonly code: ErrorTaxonomyCode
  readonly message: string
  readonly detail: Record<string, unknown>
}
```

### Error Taxonomy (REQ-CCP-013)

```typescript
const ERROR_TAXONOMY = {
  SCHEMA_ERROR: 'SCHEMA_ERROR',
  TRANSPORT_SIZE: 'TRANSPORT_SIZE',
  PATH_AUTHORITY: 'PATH_AUTHORITY',
  PATH_CONFLICT: 'PATH_CONFLICT',
  PROTECTED_PATH: 'PROTECTED_PATH',
  BUDGET_PER_FILE: 'BUDGET_PER_FILE',
  BUDGET_TOTAL: 'BUDGET_TOTAL',
  BUDGET_FILE_COUNT: 'BUDGET_FILE_COUNT',
  EMPTY_DIFF: 'EMPTY_DIFF',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
  VERIFICATION_UNRESOLVED: 'VERIFICATION_UNRESOLVED',
  POLICY_DENIED: 'POLICY_DENIED',
  BASE_DRIFT: 'BASE_DRIFT',
  BRANCH_COLLISION: 'BRANCH_COLLISION',
  IDENTITY_MISMATCH: 'IDENTITY_MISMATCH',
  PUBLICATION_AUTHORITY: 'PUBLICATION_AUTHORITY',
  MANIFEST_INVALID: 'MANIFEST_INVALID',
  RECEIPT_FAILURE: 'RECEIPT_FAILURE',
  EVIDENCE_DEGRADATION: 'EVIDENCE_DEGRADATION',
  INTERNAL: 'INTERNAL',
} as const
type ErrorTaxonomyCode = (typeof ERROR_TAXONOMY)[keyof typeof ERROR_TAXONOMY]
```

---

## Configuration Model

### Authoritative Repository Config

The versioned repository config at `.drenyra/control-plane/config.json` is authoritative for all security-sensitive policy. Environment variables may select a **stricter** mode or non-security output locations (e.g., `DRENYRA_CP_MODE=proposal-only`, `DRENYRA_CP_DIAGNOSTICS_DIR`). Environment overrides MUST NOT: widen writable roots, narrow protected paths, increase budgets, disable verification, or enable auto-merge.

```typescript
interface ControlPlaneConfig {
  readonly version: 1
  readonly repository: {
    readonly expectedRepositoryId: string
    readonly expectedOwner: string
    readonly expectedName: string
    readonly protectedBaseRef: string
  }
  readonly autonomy: {
    readonly mode: AutonomyMode
    readonly profiles: Record<TriggerProfile, TriggerProfileConfig>
  }
  readonly paths: {
    readonly writableRoots: Record<TriggerProfile, readonly string[]>
    readonly protected: readonly ProtectedDomain[]
    readonly privilegedPrefix: string // ".drenyra/control-plane/"
  }
  readonly budgets: {
    readonly default: BudgetLimits
    readonly profiles: Record<TriggerProfile, Partial<BudgetLimits>>
  }
  readonly verification: {
    readonly registry: VerificationRegistry
  }
  readonly dependabot: DependabotConfig
  readonly evidence: {
    readonly manifestPath: string
    // Required explicit compliance value. There is no unsafe default.
    readonly requiredReceiptRetentionDays: number
    readonly engramEnabled: boolean
  }
  readonly publication: {
    readonly branchPrefix: string
  }
}

interface ProtectedDomain {
  readonly name: string
  readonly patterns: readonly string[]
  readonly escalation: 'human-sdd' | 'block'
}

interface BudgetLimits {
  readonly maxFiles: number
  readonly maxLinesPerFile: number
  readonly maxTotalLines: number
}

interface DependabotConfig {
  readonly enabled: boolean
  readonly autoMerge: false
  readonly ecosystems: readonly EcosystemConfig[]
  readonly lockfileBudgetException: number
  readonly allowedDirectories: readonly string[]
  readonly vulnerabilityThreshold: 'low' | 'medium' | 'high' | 'critical'
  readonly prohibitedLicenses: readonly string[]
}

interface EcosystemConfig {
  readonly name:
    'bun' | 'npm' | 'go' | 'python' | 'docker' | 'github-actions' | 'rust'
  readonly manifests: readonly string[] // e.g., ["package.json", "bun.lock"]
  readonly lockfilePatterns: readonly string[]
}

interface VerificationRegistry {
  readonly version: 1
  readonly global: readonly VerificationCommand[]
  readonly roots: readonly VerificationRoot[]
}

interface VerificationCommand {
  readonly name: string
  readonly argv: readonly string[] // versioned, validated, never shell-parsed
  readonly required: boolean
}

interface VerificationRoot {
  readonly kind: 'bun-workspace' | 'go-module' | 'python-package' | 'rust-crate'
  readonly directory: string
  readonly checks: readonly VerificationCommand[]
}
```

Config is loaded once at pipeline start. Security fields are immutable for the duration of the run.

---

## Pre-Materialization Path Admission (REQ-POL-001, REQ-POL-002, REQ-POL-003)

### Ordering

Path admission runs BEFORE any content is materialized. The sequence is:

1. **Canonicalization** (REQ-CCP-004): every path passes authority checks
2. **Protected-path check** (REQ-POL-002): deny-first registry match → reject
3. **Writable-root check** (REQ-POL-001): path must fall within declared root
4. **After all paths admitted** → proceed to candidate construction

If any path is denied, no candidate is created, no content is written to disk, and the run terminates with the appropriate diagnostic.

### Privileged Prefix

`.drenyra/control-plane/**` is a privileged prefix. Model change-sets MUST NOT target it. The control plane's manifest is written through a separate internal channel during the MANIFEST phase — it is never part of the model-generated change-set. Any change-set operation targeting this prefix is rejected at path admission.

---

## Canonical Path Algorithm (REQ-CCP-004)

```
function canonicalize(input: string, repoRoot: string): CanonicalPath

  ┌─ REJECT empty string, ".", ".."
  ├─ REJECT ASCII control characters (U+0000–U+001F, U+007F)
  ├─ REJECT leading "-" (option-injection guard)
  ├─ REJECT Windows drive prefix (/^[A-Za-z]:[/\\]/)
  ├─ REJECT UNC prefix (/^\\\\/)
  ├─ REJECT absolute path (starts with "/")
  ├─ SPLIT on "/" (reject empty segments from "//")
  ├─ For each segment:
  │   ├─ REJECT ".."
  │   ├─ REJECT "." (skip it)
  │   └─ APPLY Unicode NFC normalization
  ├─ JOIN segments with "/"
  ├─ REJECT if join is empty after "." removal
  ├─ RESOLVE full path with the platform path library
  ├─ COMPUTE relative = path.relative(repoRoot, fullPath)
  ├─ REJECT if relative is absolute, equals "..", or starts with "../"
  ├─ REJECT if full path targets privileged prefix ".drenyra/control-plane/"
  ├─ REJECT if any existing ancestor is a symlink (lstat check)
  └─ RETURN CanonicalPath

Within a change-set (batch check after per-path canonicalization):
  ├─ REJECT if any two paths normalize to the same NFC form
  ├─ REJECT if any two paths differ only in case (lowercase comparison)
  └─
```

---

## Candidate Isolation (REQ-CCP-005)

### Decision: Temporary Detached Worktree

**Chosen: Temporary detached worktree.** Simplicity and full Git isolation outweigh disk cost.

### Symlink Handling (Corrected)

A fresh `git worktree add --detach` checkout **may** contain repository-tracked symlinks. The candidate materialization phase must:

1. `lstat` each ancestor directory of every target path immediately before write — reject if any is a symlink
2. Reject change-set operations targeting existing symlinks (file mode `120000`)
3. Revalidate `lstat` ancestors before diff derivation
4. The candidate worktree is controlled: no concurrent untrusted writer operates on it

### Lifecycle

```
GENERATION JOB:
  1. ownedRoot = fs.mkdtempSync(prefix)
  2. writeOwnershipMarker(ownedRoot)
  3. candidate = ownedRoot + "/candidate"  # path does not exist yet
  4. git worktree add --detach <candidate> <base-sha>
  5. [for each admitted change: lstat ancestors → write content]
  6. git -C <candidate> add -A
  7. [derive deterministic status, stats, modes, and canonical patch]
  8. git -C <candidate> write-tree
  9. [build manifest and candidate identity]
  10. git worktree remove <candidate>
  11. guardedRemove(ownedRoot)
```

### Cleanup (Corrected)

Cleanup uses **awaited `try/finally`** in the pipeline's async execution context:

```
try {
  // ... pipeline phases ...
} finally {
  await cleanupCandidate(worktreePath, ownershipMarker)
}
```

- Normal cleanup uses `git worktree remove` without force, then guarded
  filesystem removal.
- Force-removal is a last-resort recovery path only after the owned-root marker,
  expected Git common directory, candidate path, and dead owner PID are proven.
- `guardedRemove` verifies the ownership marker before removing any path.
- No exit hook attempts asynchronous cleanup.
- Signal-aware shutdown awaits normal cleanup before exiting.
- A synchronous last resort may remove only the verified owned root through
  `fs.rmSync`; it never invokes a shell.
- Startup orphan recovery applies the same ownership and Git-directory checks.

### No Primary-Worktree Mutation

The generation job never modifies the primary delivery worktree. The publication job performs a fresh checkout of the exact base SHA in its own runner, applies the canonical patch, and rederives hashes. The primary worktree is only read for configuration and Git metadata.

---

## Untrusted Transport (REQ-CCP-001)

### Cross-Platform Input

- **Files:** `Bun.file(path).arrayBuffer()` or `fs.readFileSync(path)` → `Buffer`
- **Stdin:** `Bun.stdin.stream()` or Node.js `process.stdin` as async iterable → accumulate into `Buffer`
- **No `/dev/stdin`** (not portable to Windows)

### Process Spawning

All child processes use `Bun.spawn({ cmd: [...], shell: false })` or equivalent `spawn` with `shell: false`. Validated path arguments are passed in the `cmd` array after a `"--"` separator to prevent option injection:

```
// CORRECT
Bun.spawn({ cmd: ["git", "-C", worktreePath, "diff", "--cached", "--", validatedPath], shell: false })

// NEVER
exec(`git -C ${worktreePath} diff --cached -- ${unvalidatedString}`)
```

Leading `-` path segments are rejected during canonicalization to prevent option injection.

### Content Isolation

| Content type                   | Transport                        | Validation                                                  |
| ------------------------------ | -------------------------------- | ----------------------------------------------------------- |
| Trigger payload                | File or stdin stream             | Zod `.strict()` schema after size check                     |
| Model response                 | File or stdin stream             | Zod `.strict()` schema after size check                     |
| File content (inside response) | Embedded in JSON as UTF-8 string | Decoded post-schema; written as `Buffer` via `fs.writeFile` |
| Validated paths                | Process arguments after `"--"`   | Only after canonicalization                                 |
| Unvalidated strings            | NEVER process arguments          | —                                                           |

### Shell Syntax Preservation

Bytes containing `$()`, backticks, quotes, and `${VAR}` are preserved exactly. Tests prove that writing a fixture file containing these bytes and re-reading it produces the same `Buffer`. A sentinel file proves no command executed.

---

## Change-Set Schema & Encoding (REQ-CCP-002)

### v1: UTF-8 Text Only

Autonomous v1 rejects all binary and non-UTF-8 content. The `encoding` field is absent. Generated content that is not valid UTF-8 is rejected at the decode step. Binary changes are routed to human workflow. Dependabot lockfiles (`bun.lock`, `go.sum`, `requirements.txt`, etc.) are text and pass UTF-8 validation.

```typescript
const FileOperationSchema = z
  .object({
    path: z.string().min(1),
    operation: z.enum(['create', 'update', 'delete']),
    content: z.string().optional(),
    mode: z.enum(['100644', '100755']).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    // create/update require UTF-8 content; delete forbids content and mode.
    // Violations add a schema issue and fail closed.
  })

const ChangeSetSchema = z
  .object({
    schema_version: z.literal(1),
    change_id: z.string().min(1).max(256),
    operations: z.array(FileOperationSchema).min(1).max(50),
  })
  .strict()
```

### Validation Sequence

1. Decode raw response bytes with `TextDecoder("utf-8", { fatal: true })`.
2. Parse JSON and reject malformed input.
3. Apply Zod `.strict()` schemas and operation refinements.
4. Require content for create/update; forbid content and mode for delete.
5. Encode validated string content as UTF-8 bytes.
6. Reject materialized content containing NUL bytes.
7. Compute each content hash for the manifest.
8. During candidate construction, create fails when the path exists;
   update/delete fail when it does not; type changes are rejected.

---

## Diff Derivation (REQ-CCP-006)

### Deterministic Diff Contract

Uses separate deterministic invocations with `--no-renames`. Mixing
`--numstat`, `--name-status`, raw modes, and patch output in one stream
would be ambiguous.

```
git -C <candidate> diff --cached --no-renames --name-status <base-sha>
git -C <candidate> diff --cached --no-renames --numstat <base-sha>
git -C <candidate> diff --cached --no-renames --raw <base-sha>
git -C <candidate> diff --cached --no-renames --full-index --patch <base-sha>
```

### Change Type Handling

| Git filter        | Control Plane type                                       | Mode handling         |
| ----------------- | -------------------------------------------------------- | --------------------- |
| `A` (added)       | `"added"`                                                | From candidate `stat` |
| `C` (copied)      | Treated as `"added"`                                     | From candidate `stat` |
| `D` (deleted)     | `"deleted"`                                              | N/A                   |
| `M` (modified)    | `"modified"`                                             | From candidate `stat` |
| `R` (renamed)     | With `--no-renames`, represented as `D` + `A`            | From candidate `stat` |
| `T` (type change) | Rejected — symlink/file type changes not supported in v1 | —                     |
| `U` (unmerged)    | Rejected — indicates conflict/unclean state              | —                     |
| `X` (unknown)     | Rejected                                                 | —                     |

### Unsupported Modes

- Symlink mode (`120000`) is rejected at materialization
- Submodule mode (`160000`) is rejected
- Only `100644` and `100755` are accepted

---

## Manifest Canonicalization & Hashing (REQ-CCP-009, REQ-CCP-010)

### Candidate-Tree Hash

```
SHA-256 over the concatenation of:
  enumerate the final Git index with `git ls-files -s -z`
  for each tracked index entry, sorted by path bytes:
    if path starts with ".drenyra/control-plane/manifests/":
      SKIP
    reject unsupported modes or symlinks
    read the indexed candidate content
    append: path + "\0" + mode + "\0" + SHA-256(content) + "\n"

The filesystem `.git` indirection and untracked files are never hash inputs.
```

### Candidate Identity Hash (for publication idempotency)

```
candidate_identity_hash = SHA-256(
  repositoryId + "\0" +
  baseSha + "\0" +
  verifiedTriggerAuthorityHash + "\0" +
  modelId + "\0" + promptHash + "\0" + responseHash + "\0" +
  [for each path in sorted byte-order:
     normalizedPath + "\0" + mode + "\0" + SHA-256(content) + "\n"
  ] +
  policyVersion + "\0"
)
```

Explicitly **excluded** from this hash: timestamps, `created_at`, correlation IDs, run IDs, `intended_head`, branch name, envelope hash, and all mutable delivery metadata.

### Manifest Envelope Hash

```
SHA-256 over the canonical JSON of all manifest fields EXCEPT envelope_hash.
  Canonical JSON rules:
    - Keys sorted lexicographically by byte value
    - No trailing commas
    - No whitespace outside strings
    - "\n" line endings
    - UTF-8 encoded
```

### Manifest Mutation Semantics (Corrected)

If a candidate file is modified after the manifest is generated:

- Rederiving the candidate-tree hash produces a **different** value that no longer matches the stored manifest's `candidate_tree_hash`
- The stored manifest's `envelope_hash` does NOT change — it was computed over the original values
- The publication job rederives both hashes from the fresh checkout + applied patch and compares against the stored manifest
- A mismatch fails with `MANIFEST_INVALID` — the manifest is a tamper-evident record, not a self-updating document

### Algorithm

SHA-256 throughout. No SHA-1, no MD5. Hex-encoded (lowercase, 64 characters).

### Manifest Storage

The manifest is committed inside the candidate at `.drenyra/control-plane/manifests/<change-id>.json` via the control plane's **internal write channel** — not through the model change-set. The `.drenyra/control-plane/**` prefix is privileged; model operations targeting it are rejected at path admission.

---

## Cross-Job Handoff: Canonical Patch (REQ-DEL-001, Corrected)

### Why Tarball Worktree Is Invalid

A tarred detached worktree contains a `.git` file pointing to the generation runner's main object store. The publication runner cannot resolve this indirection. The handoff must be a self-contained canonical patch that the publication runner applies to a fresh checkout of the exact base SHA.

### Handoff Artifacts

The `generate-and-validate` job uploads:

| Artifact               | Content                                                          | Digest verification                                      |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `canonical-patch.json` | `CanonicalPatch` (patch + manifest + identity + diagnosticsHash) | SHA-256 via GitHub artifact attestation                  |
| `diagnostics.json`     | Full `DiagnosticRecord[]`                                        | SHA-256; referenced by `canonical-patch.diagnosticsHash` |

### Publication Job Flow

```
PUBLICATION JOB (separate runner, separate token):
  1. Download canonical-patch.json + diagnostics.json
  2. Verify GitHub artifact attestation and expected artifact digest
  3. Strictly parse CanonicalPatch
  4. Initialize a clean repository and fetch the exact base SHA
  5. Checkout the base SHA detached in a fresh isolated candidate
  6. Run: git apply --check --index -- <patch>
  7. Run: git apply --index -- <patch> (no --reject, no partial apply)
  8. Rederive candidate-tree hash and compare with the manifest
  9. Rederive candidate identity and compare with the handoff
  10. Recompute the envelope hash and compare with the manifest
  11. Rederive repository identity, base state, and branch collision
  12. Create a unique branch and push without force
  13. Create the PR
```

`CanonicalPatch.diff` is produced with `git diff --cached --no-renames
--full-index --patch <base-sha>`. Publication runs `git apply --check --index`
before `git apply --index`. The design never uses `--reject`, because that
option can partially apply accepted hunks and leave rejected hunks behind.

---

## Publication Idempotency & Branch Identity (REQ-DEL-003, Corrected)

### Branch Name

```
sanitized_id = normalize change_id to an allowed non-empty slug (max 40)
fingerprint  = first 16 hex chars of candidate_identity_hash
branch       = "autonomous/" + sanitized_id + "-" + fingerprint

If normalization yields an empty, reserved, or invalid Git ref component,
publication fails with `SCHEMA_ERROR`; it never invents an unbound name.
```

### Idempotent Replay

```
1. Compute branch name from candidate_identity_hash
2. Check remote: git ls-remote --heads origin <branch>
3. If branch exists:
   a. Query GitHub API for the PR on that branch
   b. Read the existing PR manifest from its exact head SHA
   c. Reverify repository, base, candidate identity, and manifest hash
   d. If an open PR matches exactly, return it as an idempotent replay
   e. If evidence differs or the PR is closed/merged, fail closed
4. If branch does not exist, proceed with publication
```

The candidate identity is deterministic over repository ID, base SHA, verified
trigger-authority hash, stable model/prompt/response hashes, normalized
path/mode/content hashes, and policy version. Timestamps, workflow run IDs,
correlation IDs, and mutable delivery metadata are excluded.

---

## Job Separation (REQ-DEL-001)

### Architecture

```
Workflow: auto-healing.yml / sdd-auto-implement.yml
│
├── Job: generate-and-validate
│   permissions:
│     contents: read
│     id-token: write       # artifact attestation only
│     attestations: write   # no repository-content mutation
│   │
│   ├── Checkout repository
│   ├── Run control-plane trigger preflight (live authority)
│   ├── IF preflight passes: call model (response → file)
│   ├── Run control-plane execution:
│   │   rederive authority → read response → canonicalize → path-admit →
│   │   candidate → diff → budget-admit → verify → manifest → handoff
│   ├── Construct canonical patch from verified handoff
│   ├── Upload artifacts:
│   │   - canonical-patch.json (with GitHub artifact attestation)
│   │   - diagnostics.json
│   │
│   └── End (no contents-write authority, no branch, no PR)
│
├── Job: publish (needs: generate-and-validate, if: success())
│   permissions:
│     contents: write
│     pull-requests: write
│   │
│   ├── Download artifacts + verify attestation
│   ├── Fresh checkout of exact base SHA
│   ├── Apply canonical patch
│   ├── Rederive tree hash + candidate_identity_hash + envelope hash
│   ├── Derive repository identity + check collision + base drift
│   ├── Create branch + push (no force)
│   ├── Create PR
│   └── End
```

### Action Outputs

The composite validation action outputs only **references**, not values that the publication job must produce:

```yaml
outputs:
  manifest-hash:
    description: 'SHA-256 digest of the manifest envelope'
  candidate-identity-hash:
    description: 'Deterministic candidate identity hash'
  outcome:
    description: 'pass | fail'
  error-code:
    description: 'Error taxonomy code if failed'
  correlation-id:
    description: 'Run correlation ID'
```

It does NOT output `branch` or `pr-number` — those are produced by the separate publication job.

---

## GitHub Authority (REQ-DEL-002, REQ-DEL-004)

### Repository Identity Derivation

```
All fields rederived at publication time from the live environment:

repositoryId: config.repository.expectedRepositoryId, cross-checked with GitHub API/env
owner/name:   config.repository expected values, cross-checked with remote + GitHub evidence
baseRef:      config.repository.protectedBaseRef, cross-checked with trusted event/API evidence
remoteUrl:    git remote get-url origin
baseSha:      git rev-parse <validated-base-ref>, cross-checked with event/API SHA when present
```

No hardcoded `arkelythex/Drenyra`.

### Branch Collision & Base Drift

Both checked immediately before `git push`:

- **Collision:** `git ls-remote --heads origin <branch>` — if found, fail `BRANCH_COLLISION`
- **Drift:** `git rev-parse origin/<baseRef>` compared to frozen `baseSha` — if different, fail `BASE_DRIFT`

No force-push. No rebase.

---

## PR-Only Delivery (REQ-DEL-005)

- Every autonomous change reaches `main` only through a reviewed PR
- At most one PR per content-bound run (candidate identity hash idempotency)
- Human approval enforced by repository branch-protection rules
- The control plane never calls the merge API
- The synchronous pipeline ends at PR creation

---

## Post-Merge Receipt (REQ-CCP-011, Corrected)

### Asynchronous Workflow

The post-merge receipt is generated by a distinct workflow triggered by a
merged autonomous PR. It is not part of the synchronous publication pipeline.

```
1. Accept pull_request.closed only when merged is true and head matches policy
2. Rederive repository ID, PR, merge object ID, and merge strategy
3. Collect all required approval events from the GitHub API
4. Read and verify the manifest from the merged Git tree
5. Construct canonical PostMergeReceipt
6. Compute receipt_hash over all canonical fields except receipt_hash
7. Attest the receipt JSON digest through GitHub artifact attestations
8. Publish a bounded Check Run summary linking the attestation
9. Attempt supplemental Engram persistence
```

### Receipt Storage

- **Primary:** authenticated, content-addressed GitHub attestation plus a Check
  Run reference bound to repository, merge object ID, and manifest hash.
- **Supplemental:** Engram operational context. Failure emits
  `EVIDENCE_DEGRADATION` and never authorizes anything.
- **Retention:** `requiredReceiptRetentionDays` is an explicit compliance-owned
  policy value with no default. Rollout is blocked unless the selected GitHub
  or external evidence store proves it can satisfy that policy. The design
  does not invent a legal retention period.

### No Candidate Mutation

The receipt is generated from the content-addressed merged Git object and
GitHub API evidence. It does not add a commit or describe the moving branch as
immutable.

---

## Rollback Plans (REQ-POL-007)

```typescript
function selectRollbackPlan(
  mergeStrategy: string,
  mergeSha: string
): RollbackPlan {
  switch (mergeStrategy) {
    case 'merge':
      return { type: 'revert-merge', command: `git revert -m 1 ${mergeSha}` }
    case 'squash':
      return { type: 'revert-squash', command: `git revert ${mergeSha}` }
    case 'rebase':
      return { type: 'revert-rebase-chain', commits: [...reversed] }
  }
}
```

The plan is evidence and guidance, never execution. A human reviews and executes the revert PR.

---

## Autonomy Mode Transitions (REQ-POL-005)

### `proposal-only`

Pipeline runs `validate → canonicalize → path-admit`. Diagnostics emitted. No candidate construction, no Git mutation. Evidence stored locally or via GitHub API comment.

### `disabled`

Pipeline rejects all triggers at validation with `POLICY_DENIED`. No model calls, no filesystem operations.

### Migration Path

```
disabled  →  proposal-only  →  full (canary on designated sandbox root)
                                    →  full (all eligible profiles)
```

Rollback: `full` → `proposal-only` or `disabled`. No path back to unguarded workflows.

---

## Polyglot Verification (REQ-CCP-008, Corrected)

### Versioned Verification Registry

The config contains a `VerificationRegistry` with explicit roots for each supported ecosystem:

```json
{
  "version": 1,
  "global": [
    {
      "name": "root-typecheck",
      "argv": ["bun", "run", "typecheck"],
      "required": true
    }
  ],
  "roots": [
    {
      "kind": "bun-workspace",
      "directory": "packages/drenyra-orchestrator",
      "checks": [
        {
          "name": "test",
          "argv": ["bun", "run", "--filter", "@drenyra/orchestrator", "test"],
          "required": true
        }
      ]
    },
    {
      "kind": "go-module",
      "directory": "apps/cli",
      "checks": [
        {
          "name": "test",
          "argv": ["bun", "run", "go:drenyra:test"],
          "required": true
        }
      ]
    },
    {
      "kind": "go-module",
      "directory": "services/go/reconciliation-worker",
      "checks": [
        {
          "name": "test",
          "argv": ["bun", "run", "go:reconcile:test"],
          "required": true
        }
      ]
    },
    {
      "kind": "rust-crate",
      "directory": "packages/rust-core",
      "checks": [
        {
          "name": "test",
          "argv": ["bun", "run", "rust:core:test"],
          "required": true
        }
      ]
    }
  ]
}
```

These commands exist in the root `package.json`. Python and any additional
roots MUST be added only after a verified repository command is defined. Until
then, a matching required path fails `VERIFICATION_UNRESOLVED`; the design does
not invent a command.

### Resolution Algorithm

1. Run every required global verification command.
2. Match changed paths against registered root directories.
3. Run each matched root's configured checks.
4. If a changed path requires verification but matches no root, fail
   `VERIFICATION_UNRESOLVED`.
5. If a required configured argv is absent or invalid, fail closed.
6. Spawn the versioned argv arrays with `shell: false`.

Configuration stores argv arrays directly. No command string is split or
shell-parsed at runtime. Unknown required verification fails closed.

---

## Dependabot Profile (REQ-POL-006, Corrected)

### Ecosystem Coverage

The Dependabot profile covers all configured ecosystems, not only JS lockfiles:

| Ecosystem      | Current configured scope   | Evidence inputs                            |
| -------------- | -------------------------- | ------------------------------------------ |
| Bun/npm        | repository root            | `package.json`, `bun.lock`                 |
| Go modules     | `apps/cli`                 | `go.mod` and optional `go.sum`             |
| Python         | `apps/data-engine`         | `pyproject.toml` and configured lock input |
| Docker         | repository Docker contexts | `Dockerfile` inputs                        |
| GitHub Actions | `.github/workflows`        | action references in workflow YAML         |
| Rust           | disabled until configured  | `Cargo.toml` and optional `Cargo.lock`     |

The profile is derived from `.github/dependabot.yml` plus verified files on
disk. Rust remains disabled until an explicit update entry is added.

### Qualification Gates

- **Vulnerability:** Query GitHub Advisory Database for updated packages. Reject if introduced/worsened vulnerability exceeds threshold.
- **License:** Check license metadata. Reject prohibited licenses.
- **Compatibility:** Run affected ecosystem verification from registry.
- **Budget:** Lockfile budget exception for recognized lockfile patterns. Non-lockfile paths use standard budget.

### Deterministic Testing

Adapter/network checks (GitHub Advisory API, license API) are mocked in deterministic tests. The qualification logic is pure: given vulnerability data and license data as input, it produces the correct verdict.

---

## CLI / Action Parity (REQ-DEL-006, Corrected)

### Shared Core

Both the GitHub Action and the local Bun CLI invoke the same `ControlPlanePipeline` class:

```typescript
class ControlPlanePipeline {
  constructor(config: ControlPlaneConfig, adapters: ControlPlaneAdapters)

  // Called before any model invocation. Reads/validates trigger and derives
  // live authority; context is content-bound evidence, never a bearer token.
  async preflightTrigger(
    triggerPath: string
  ): Promise<ControlPlaneResult<AuthorizedTriggerContext>>

  // Called after model response exists. Re-reads trigger, rederives live
  // authority, matches the preflight context, and only then reads response.
  async executeFromFiles(
    triggerPath: string,
    responsePath: string,
    preflight: AuthorizedTriggerContext
  ): Promise<ControlPlaneResult<VerifiedCandidateHandoff>>

  async executeDryRunFromFiles(
    triggerPath: string,
    responsePath: string,
    preflight: AuthorizedTriggerContext
  ): Promise<ControlPlaneResult<PrePrManifest>>
}
```

### CLI

```
# Before model invocation
bun run packages/drenyra-orchestrator/src/cli/control-plane-cli.ts \
  --phase preflight --trigger <path> --context-out <owned-path> [--config <path>]

# After model response exists; live authority is rederived
bun run packages/drenyra-orchestrator/src/cli/control-plane-cli.ts \
  --phase execute --trigger <path> --response <path> \
  --context <owned-path> [--dry-run] [--config <path>]
```

### Reusable Action (generation job only)

```yaml
inputs:
  phase:
    required: true # preflight | execute
  trigger-file:
    required: true
  response-file:
    required: false # execute only
  context-file:
    required: false # execute only; preflight creates it
  dry-run:
    default: 'false'
outputs:
  authority-context-hash:
    description: 'Preflight context digest; not a bearer authorization'
  authority-context-file:
    description: 'Owned local context path for same-job execution'
  manifest-hash:
    description: 'SHA-256 digest of manifest envelope'
  candidate-identity-hash:
    description: 'Deterministic candidate identity hash'
  outcome:
    description: 'pass | fail'
  error-code:
    description: 'Error taxonomy code if failed'
  correlation-id:
    description: 'Run correlation ID'
```

CLI and action expose the same two phases and structurally equivalent diagnostic JSON. Execute always rederives live authority; possession of a context file/hash never authorizes by itself.

---

## Observability (REQ-CCP-012, Corrected)

### Diagnostic Storage

- **Full diagnostics:** Stored as `diagnostics.json` artifact (no truncation)
- **Action step outputs:** Bounded summary only (`outcome`, `error_code`, `correlation_id`, `manifest_hash` digest)
- **GitHub step output limits:** ~1 MB. Full diagnostics may exceed this → artifact is authoritative

---

## Deterministic Fixtures (REQ-DEL-007)

All tests use local temporary Git repositories, deterministic fixtures, and mocked external calls. No live DeepSeek, no network, no destructive remote operations. Engram is optional in tests; safety verdicts are correct without it.

---

## Sequence Diagrams (Corrected)

### Successful Autonomous PR

```
Trigger   Gen Pipeline   Candidate    Git/GitHub    Pub Job    Git/GitHub   Human
  │           │              │            │            │            │          │
  │─payload──▶│              │            │            │            │          │
  │           │─trigger preflight + live authority────▶│            │          │
  │           │◀─AuthorizedTriggerContext───────────────│            │          │
  │           │─model call only after preflight; response stored as file       │
  │           │─rederive authority; then read/validate response                │
  │           │─canonicalize─│            │            │            │          │
  │           │─path admit───│            │            │            │          │
  │           │  (no content materialized yet)         │            │          │
  │           │─create worktree──────────▶│            │            │          │
  │           │─lstat ancestors + materialize          │            │          │
  │           │─diff─────────────────────▶│            │            │          │
  │           │◀─DiffReport───────────────│            │            │          │
  │           │─budget admit──│            │            │            │          │
  │           │─verify───────────────────▶│            │            │          │
  │           │◀─VerificationResult───────│            │            │          │
  │           │─build manifest + candidate_identity    │            │          │
  │           │─commit manifest──────────▶│            │            │          │
  │           │─generate canonical patch──│            │            │          │
  │           │─cleanup worktree─────────▶│            │            │          │
  │           │              │            │            │            │          │
  │           │  [JOB BOUNDARY — token change]         │            │          │
  │           │              │            │            │            │          │
  │           │              │  [upload canonical-patch.json + diagnostics]  │
  │           │              │            │            │            │          │
  │           │              │            │  ─download + verify attestation─▶│
  │           │              │            │  ─fresh checkout base SHA──────▶│
  │           │              │            │  ─apply canonical patch────────▶│
  │           │              │            │  ─rederive tree + identity hashes│
  │           │              │            │  ─identity check───────────────▶│
  │           │              │            │  ◀─RepositoryIdentity───────────│
  │           │              │            │  ─check collision──────────────▶│
  │           │              │            │  ◀─branch available─────────────│
  │           │              │            │  ─check base drift─────────────▶│
  │           │              │            │  ◀─base matches─────────────────│
  │           │              │            │  ─push branch──────────────────▶│
  │           │              │            │  ◀─ok───────────────────────────│
  │           │              │            │  ─create PR────────────────────▶│
  │           │              │            │  ◀─PR #42───────────────────────│
  │           │              │            │            │            │          │
  │           │              │            │   [SYNCHRONOUS PIPELINE ENDS]     │
  │           │              │            │            │            │          │
  │           │              │            │            │            │──review─▶│
  │           │              │            │            │            │◀─approve─│
  │           │              │            │            │            │──merge──▶│
```

### Rejected Protected Path (Before Materialization)

```
Trigger   Pipeline      Admission
  │           │              │
  │─payload──▶│              │
  │           │─validate─────│
  │           │─canonicalize─│
  │           │─path admit───▶
  │           │              │──path matches protected domain "**/fiscal/**"
  │           │◀─PROTECTED_PATH diagnostic
  │           │              │
  │◀─ERR──────│              │
  │           │              │
  │    [no candidate, no worktree, no mutation, no content written to disk]
```

### Idempotent Replay Sequence

```
Trigger   Pipeline      Git/GitHub
  │           │              │
  │─payload──▶│              │
  │           │─full pipeline│
  │           │─compute candidate_identity_hash
  │           │─compute branch name
  │           │─check remote─▶
  │           │◀─branch exists, PR #42 open
  │           │              │
  │◀─OK───────│              │
  │  {prNumber: 42, isReplay: true, candidateIdentityHash: "abc..."}
```

### Post-Merge Receipt (Asynchronous)

```
GitHub       Receipt Workflow    GitHub API    Attestation    Engram
  │              │                   │             │            │
  │─pr.merged───▶│                   │             │            │
  │              │─get PR details───▶│             │            │
  │              │◀─merge_sha,───────│             │            │
  │              │  reviews[] (all   │             │            │
  │              │  approvals with   │             │            │
  │              │  login, state,    │             │            │
  │              │  submitted_at)    │             │            │
  │              │─read manifest────▶│             │            │
  │              │◀─manifest.json────│             │            │
  │              │─construct PostMergeReceipt      │            │
  │              │─compute receipt_hash            │            │
  │              │─store attestation──────────────▶│            │
  │              │◀─attestation_id─────────────────│            │
  │              │─save to Engram──────────────────────────────▶│
  │              │◀─saved (or EVIDENCE_DEGRADATION)─────────────│
  │              │                   │             │            │
  │              │  [no commit added to merged tree]            │
```

---

## Migration / Rollout Plan

### Phase 1: `proposal-only` rollout

1. Deploy control-plane code to `packages/drenyra-orchestrator/`
2. Set `autonomy.mode` to `"proposal-only"`
3. Modify `auto-healing.yml` and `sdd-auto-implement.yml` to call the control plane (read-only)
4. Fix the dead `FILES_COMMITTED` path
5. Remove force-push, remove direct file copying
6. Verify: diagnostic output emitted, no Git mutation occurs

### Phase 2: Canary `full` mode (Corrected)

1. Exercise `full` mode only in a disposable fixture repository owned by the
   project, never against Drenyra production paths.
2. Use the same policy and GitHub authority adapters with fixture identities.
3. Verify PR creation, human approval flow, and receipt attestation.
4. Keep Drenyra itself in `proposal-only` until the canary evidence is approved.
5. The control plane never modifies its own code or policy autonomously.

### Phase 3: Full rollout

1. Expand writable roots to all non-protected domains per profile
2. Enable all eligible trigger profiles
3. Activate Dependabot profile with qualification checks, auto-merge disabled

### Rollback

At any phase: set `mode` to `"proposal-only"` or `"disabled"` via config change. No code revert needed. Old unguarded workflows removed during Phase 1.

---

## Review-Slice Implications

The authoritative 27-slice plan lives in `tasks.md`. The table below is a
grouped summary referencing exact task slice IDs; `tasks.md` controls
ordering, dependencies, line budgets, and verification.

| Slice group (tasks.md IDs) | Theme                                                    |
| -------------------------- | -------------------------------------------------------- |
| PR1                        | Types, diagnostics, config                               |
| PR2                        | Schemas, transport                                       |
| PR2B                       | Repository identity and approval schema                  |
| PR2C                       | Pure artifact hash and fixed-path approval-store adapter |
| PR2D                       | Protected-base evidence and native SDD authority         |
| PR2E                       | Authenticated original CI + attested reproduction        |
| PR3                        | Path canonicalization                                    |
| PR4                        | Admission, modes                                         |
| PR5A–PR5B                  | Candidate isolation, materialization, budgets            |
| PR6                        | Diff derivation, hashing                                 |
| PR7A–PR7B                  | Canonical manifest, verification registry                |
| PR8A                       | Trigger preflight before model invocation                |
| PR8B                       | Execution pipeline/CLI; returns VerifiedCandidateHandoff |
| PR9A                       | Canonical patch generation/application                   |
| PR9B                       | Publication idempotency, rollback plans                  |
| PR10A                      | Workflow validation foundation                           |
| PR10B–PR10C                | Receipt core, receipt workflow                           |
| PR10D–PR10E                | Dependabot policy, workflow hardening                    |
| PR10F–PR10H                | Reusable action, auto-healing, approved-SDD workflows    |
| PR10I–PR10J                | Skill/repo docs, policy documentation                    |

Each slice ≤400 lines, independently testable with deterministic fixtures.
Native bounded review selects lenses per exact candidate.
See `tasks.md` for exact module assignments, task breakdowns, and estimates.

---

## Traceability Matrix

| Requirement | Module(s)                                                                                                                                                                                                                     | Key Design Decision                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-CCP-001 | `transport/input.ts`                                                                                                                                                                                                          | Cross-platform Buffer input; `shell: false`; `"--"` separator; no `/dev/stdin`                                                                                                   |
| REQ-CCP-002 | `schemas/trigger.ts`, `schemas/change-set.ts`                                                                                                                                                                                 | Zod 4 `.strict()`; v1 UTF-8 only; size limits per profile                                                                                                                        |
| REQ-CCP-003 | `schemas/approval.ts`, `canonicalization/artifact-hash.ts`, `authority/approval-store.ts`, `authority/protected-base.ts`, `authority/trigger.ts`, `authority/native-sdd.ts`, `authority/github-ci.ts`, `delivery/identity.ts` | Fixed non-self-referential approval record; eight SDD authority checks; authenticated original CI evidence plus one attested reproduction; pure decisions isolated from adapters |
| REQ-CCP-004 | `canonicalization/path.ts`, `admission/path-authority.ts`                                                                                                                                                                     | Pure lexical/root containment + separate pre-materialization `lstat` adapter; leading `-`; NFC                                                                                   |
| REQ-CCP-005 | `candidate/isolation.ts`, `candidate/materialize.ts`                                                                                                                                                                          | Detached worktree; awaited try/finally cleanup; ownership marker; startup orphan recovery; guarded fs removal                                                                    |
| REQ-CCP-006 | `candidate/diff.ts`                                                                                                                                                                                                           | Separate deterministic status/stats/raw/patch calls with `--no-renames` and `--full-index`                                                                                       |
| REQ-CCP-007 | `policy/budgets.ts`                                                                                                                                                                                                           | Diff-derived line counts; per-file + total + file-count                                                                                                                          |
| REQ-CCP-008 | `verification/registry.ts`, `verification/resolver.ts`, `verification/runner.ts`                                                                                                                                              | Required global checks plus path-scoped polyglot checks; unresolved required paths fail closed; `shell: false`                                                                   |
| REQ-CCP-009 | `canonicalization/hash.ts`                                                                                                                                                                                                    | SHA-256 over exact bytes; candidate identity binds stable trigger/model/prompt/response provenance and excludes ephemeral run metadata                                           |
| REQ-CCP-010 | `canonicalization/manifest.ts`, `schemas/manifest.ts`                                                                                                                                                                         | Sorted paths; excludes privileged prefix; non-self-referential envelope hash; manifest written via internal channel                                                              |
| REQ-CCP-011 | `receipt/post-merge.ts`                                                                                                                                                                                                       | Async workflow; authenticated receipt attestation; all approval evidence; explicit compliance retention; no candidate mutation                                                   |
| REQ-CCP-012 | `diagnostics/recorder.ts`                                                                                                                                                                                                     | Full diagnostics as artifact; bounded summary outputs; `input_hash` field on every record                                                                                        |
| REQ-CCP-013 | `diagnostics/taxonomy.ts`                                                                                                                                                                                                     | 20 stable error codes                                                                                                                                                            |
| REQ-POL-001 | `admission/writable-roots.ts`                                                                                                                                                                                                 | Request-scoped writable roots; checked before materialization                                                                                                                    |
| REQ-POL-002 | `admission/protected-paths.ts`                                                                                                                                                                                                | Deny-first; runs before writable-root and before any content materialization                                                                                                     |
| REQ-POL-003 | `admission/protected-paths.ts`, `config/control-plane-config.ts`                                                                                                                                                              | Protected domains: fiscal, SUNAT, auth, secrets, CI, OpenSpec, control-plane self, `.drenyra/control-plane/**`                                                                   |
| REQ-POL-004 | `admission/protected-paths.ts`                                                                                                                                                                                                | No runtime override; policy change requires separate reviewed change                                                                                                             |
| REQ-POL-005 | `policy/modes.ts`                                                                                                                                                                                                             | `proposal-only` stops after path-admit; `disabled` stops at validation                                                                                                           |
| REQ-POL-006 | `policy/dependabot.ts`                                                                                                                                                                                                        | Multi-ecosystem coverage; lockfile budget exception; vulnerability/license/compatibility gates; no auto-merge                                                                    |
| REQ-POL-007 | `rollback/plan.ts`                                                                                                                                                                                                            | Merge-strategy dispatch; evidence only, never execution                                                                                                                          |
| REQ-DEL-001 | `orchestration/pipeline.ts`, `delivery/patch.ts`, workflow YAML                                                                                                                                                               | Canonical patch handoff (not tarball); separate jobs; GitHub attestation verification                                                                                            |
| REQ-DEL-002 | `delivery/identity.ts`                                                                                                                                                                                                        | GitHub rulesets + scoped token; no branch-scoped permission claims                                                                                                               |
| REQ-DEL-003 | `delivery/publication.ts`                                                                                                                                                                                                     | Branch from candidate_identity_hash (not envelope hash); idempotent replay; collision + base drift                                                                               |
| REQ-DEL-004 | `delivery/identity.ts`                                                                                                                                                                                                        | Runtime-derived immutable repo ID, owner/name, remote URL, base ref/SHA; no hardcoded owner                                                                                      |
| REQ-DEL-005 | `delivery/publication.ts`                                                                                                                                                                                                     | PR-only; at most one per content-bound run; human approval via branch protection; no autonomous merge                                                                            |
| REQ-DEL-006 | `cli/control-plane-cli.ts`, `.github/actions/autonomous-change/action.yml`                                                                                                                                                    | Same preflight/execute phases; preflight precedes model; action outputs bounded context/evidence references only                                                                 |
| REQ-DEL-007 | `__tests__/` (per module)                                                                                                                                                                                                     | Local temp Git repos; fixture files; mocked APIs; Engram-optional                                                                                                                |
| REQ-DEL-008 | `AGENTS.md`, `README.md`, action docs, OpenSpec                                                                                                                                                                               | Separate human-authored policy docs from generated reference                                                                                                                     |
| REQ-DEL-009 | `.agent/skills/autonomous-change-control/SKILL.md`                                                                                                                                                                            | Conventions only; no fake enforcement claims                                                                                                                                     |

---

## Alternatives Considered

| Alternative                                | Decision             | Rationale                                                                                              |
| ------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------ |
| YAML-only hardening                        | Rejected             | Duplicated policy, poor testability, YAML drift                                                        |
| New standalone package                     | Rejected             | Overlaps orchestrator responsibility                                                                   |
| Tarball worktree handoff                   | Rejected (corrected) | `.git` indirection not portable across runners                                                         |
| Envelope hash for branch idempotency       | Rejected (corrected) | Contains timestamps/run IDs; replaced by candidate_identity_hash                                       |
| `process.on("exit")` for cleanup           | Rejected (corrected) | Cannot run async cleanup reliably; replaced by awaited try/finally + synchronous last-resort           |
| One mixed diff stream or `--diff-filter=M` | Rejected             | Separate `--no-renames` status, stats, raw-mode, and patch invocations are unambiguous.                |
| Self-modifying or same-repository canary   | Rejected             | Unsafe; replaced by a disposable fixture repository                                                    |
| 3-PR delivery plan                         | Rejected             | Unrealistic for the control-plane surface; replaced by the canonical bounded slice plan in `tasks.md`. |
| TypeScript type guards (no Zod)            | Fallback option      | Viable but costs ~200 extra lines                                                                      |
| Autonomous merge                           | Rejected             | Human approval is a product-safety invariant                                                           |
| Skill-based enforcement                    | Rejected             | Prompts cannot enforce paths, Git authority, hashes, or verification                                   |
| Post-merge commit for receipt              | Rejected             | Mutating the reviewed candidate breaks content binding                                                 |

---

## Security Considerations

1. **Pre-materialization path admission:** Protected-path and writable-root checks run before any content is written to disk
2. **Untrusted content boundary:** Model output is never shell source. Content travels through `Buffer`, never through string interpolation
3. **Path traversal:** 15-point canonicalization algorithm with `lstat` ancestor checks, leading `-` rejection, and symlink rejection
4. **Deny-first policy:** Protected-path check runs before all other gates
5. **Least privilege:** Generation job `contents: read`; publication job minimal write + PR permissions
6. **No direct-to-main:** Protected-branch ruleset; control plane never targets `main`
7. **No force-push:** Branch creation uses `git push -u origin <branch>` without force
8. **Self-protection:** Control-plane config in protected registry; `.drenyra/control-plane/**` is a privileged prefix
9. **Content binding:** `candidate_identity_hash` over stable fields; envelope hash is non-self-referential
10. **Repository identity:** All identity fields rederived at publication time; mismatch fails closed
11. **Config immutability:** Environment cannot weaken security policy; versioned repository config is authoritative
12. **Engram is supplemental:** Safety verdicts and GitHub evidence are authoritative; Engram unavailability causes `EVIDENCE_DEGRADATION`, not authorization

---

## Risks

| Risk                                             | Likelihood | Impact | Mitigation                                                                                    |
| ------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| Unicode path normalization differences across OS | Medium     | High   | NFC only; deterministic Linux CI fixtures; conservative case-fold detection                   |
| Repository symlinks in fresh checkout            | Medium     | High   | `lstat` each ancestor immediately before write; reject symlink modes; revalidate before diff  |
| Git worktree cleanup failure                     | Low        | Medium | Awaited `try/finally`; synchronous last-resort with ownership marker; startup orphan recovery |
| Base drift between generation and publication    | Medium     | Medium | Recheck immediately before push; fail closed                                                  |
| Artifact tampering between jobs                  | Low        | High   | GitHub artifact attestation; rederive + compare all hashes in publication job                 |
| Zod 4 supply-chain risk                          | Low        | Medium | Zero deps of its own; caret range in `package.json`; exact version in `bun.lock`              |
| Verification cost (polyglot)                     | Medium     | Low    | Registry-based selective execution; future optimization may narrow further                    |
| GitHub diagnostic output truncation              | Medium     | Low    | Full diagnostics stored as artifact; bounded summary in step outputs                          |

---

## Documentation Impact

| Document                                           | Change                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| `AGENTS.md`                                        | Add control-plane capability + skill reference  |
| `packages/drenyra-orchestrator/README.md`          | Add control-plane module documentation          |
| `.github/actions/autonomous-change/README.md`      | New: action usage, inputs, outputs, permissions |
| `docs/control-plane/policy.md`                     | New: human-authored policy rationale            |
| `docs/control-plane/configuration.md`              | New: configuration reference                    |
| `.agent/skills/autonomous-change-control/SKILL.md` | New: agent conventions                          |

---

## Non-Goals Reaffirmed

- No direct-to-main mutation
- No force-push variant
- No protected-path runtime override
- No Engram authorization
- No post-merge commit for receipt insertion
- No autonomous merge
- No Dependabot auto-merge
- No scheduled maintenance triggers (v1)
- No canary execution or automated learning analysis (v1)
- No new orchestration package
- No binary/non-UTF-8 autonomous materialization (v1)

---

## Revision Notes

### REQ-CCP-003 Authority Correction (2026-07-22, rerun 2026-07-22)

**Type:** Upstream requirement clarification — not a new product requirement.

**Rerun defects fixed:**

1. **Non-self-referential approval record:** Replaced `base.sha` with
   `approved_artifact_commit_sha` + `protected_base_ref`. Runtime derives
   live base SHA, proves artifact commit is ancestor, recomputes hash from
   LIVE base tree.
2. **Repository identity:** Versioned config supplies expected immutable identity/ref; Git and GitHub evidence are cross-checked. Live `baseRef` + `baseSha` are always rederived; local CLI lacks full authority without protection evidence.
3. **CI evidence:** Trigger carries original/reproduction references only. Adapter authenticates original GitHub run/workflow/log evidence and verifies one attested clean-checkout reproduction report with a matching normalized fingerprint.
4. **Pure/adapters split:** Pure artifact hashing is separate from the fixed-path Git-tree reader. PR2B–PR2E isolate identity/schema, approval evidence, SDD authority, and CI authority. The canonical plan has 27 slices.
5. **Preflight and handoff:** PR8A resolves live authority before model invocation. PR8B rederives authority before response read and returns only `VerifiedCandidateHandoff`; PR9A constructs/applies `CanonicalPatch`.
6. **Review-slice table:** Grouped summary references `tasks.md` as canonical.
7. **Dependencies:** PR2→PR2B→PR2C→PR2D→PR2E→PR3.
8. **Preserved:** input hashes, command evidence, strict-TDD block, safe workflow/receipt/merge boundaries, and prior corrections.
