# Autonomous Change Control Plane — Core Specification

**Change:** `autonomous-change-control-plane`
**Domain:** `control-plane-core`
**Capability:** `autonomous-change-control-plane` (New)
**Last updated:** 2026-07-22 (authority correction — REQ-CCP-003)

## Purpose

Define the mechanical core of the autonomous change control plane: bounded
input transport, path canonicalization and rejection, isolated candidate
construction, diff derivation, budget enforcement, provenance hashing, the
pre-PR manifest, the post-merge receipt, observability, and the error taxonomy.
The core is shared by GitHub Actions and the local Bun CLI.

## Requirements

### REQ-CCP-001: Bounded untrusted input transport

Generated content MUST travel through files, stdin, or structured IPC. It MUST NOT
become shell source, heredocs, `eval` text, executable command strings, or executable
process arguments. Validated path strings and validated options MAY be process
arguments. Every byte of content MUST be preserved exactly through transport.

#### Scenario: Structured response file transport

- GIVEN a model response containing literal backticks, `$()` subshell syntax,
  and `${VAR}` expansions
- WHEN the control plane reads the response file
- THEN every byte is preserved as opaque file content
- AND no sentinel command executes
- AND no shell interprets the content

#### Scenario: Reject shell interpolation of content

- GIVEN a workflow or CLI invocation that passes model output through a shell
  variable into a command string
- WHEN the control plane validates the transport mechanism
- THEN the invocation is rejected before any process is spawned

#### Scenario: Validated paths may be process arguments

- GIVEN a path string that has passed canonicalization and policy checks
- WHEN the control plane passes it as a CLI argument to `git` or `bun`
- THEN the path is a validated argument, not untrusted content
- AND content bytes remain in files or stdin

### REQ-CCP-002: Input schema validation

The control plane MUST validate every trigger payload and model response against
versioned schemas before any path or content processing begins. Schema-invalid input
MUST fail closed.

#### Scenario: Malformed trigger rejected

- GIVEN a trigger payload missing the required `change_id` field
- WHEN the control plane validates the trigger schema
- THEN validation fails with a `SCHEMA_ERROR` diagnostic
- AND no further processing occurs

#### Scenario: Oversized trigger rejected

- GIVEN a trigger payload larger than the configured maximum trigger size
- WHEN the control plane checks the trigger size
- THEN the run fails with a `TRANSPORT_SIZE` diagnostic

#### Scenario: Oversized response rejected

- GIVEN a model response larger than the configured maximum response size
- WHEN the control plane checks the response size
- THEN the run fails with a `TRANSPORT_SIZE` diagnostic

#### Scenario: Non-JSON response rejected

- GIVEN a model response that is not valid JSON per the expected schema
- WHEN the control plane parses the response
- THEN parsing fails with a `SCHEMA_ERROR` diagnostic
- AND no file content is materialized

### REQ-CCP-003: Trigger eligibility and authoritative approval

The trigger schema MUST identify the change, its source, and the autonomy
context. In v1, only verified CI failure reports and explicitly approved,
OpenSpec-backed SDD changes are eligible triggers for autonomous code
generation.

#### Approval record (non-self-referential)

Every approved SDD change MUST carry a fixed, repository-controlled approval
record at `.drenyra/control-plane/approvals/<change-name>.json`. The caller
cannot choose or override this path. The record uses a strict, versioned
schema and binds at minimum:

- **Canonical change name** — the exact `change_id` used in OpenSpec artifacts
- **Immutable repository identity** — `repositoryId`, `owner`, and `name`, matching the repository-controlled expected identity and live GitHub evidence
- **Approved artifact commit SHA** — the exact commit whose
  `proposal.md`/`specs/**/spec.md`/`design.md`/`tasks.md` were reviewed and
  approved. This commit is BEFORE and independent of the approval-record
  commit itself. The record does NOT contain its own containing commit SHA.
- **Protected base ref** — the protected branch (e.g., `refs/heads/main`)
  whose protection ruleset is enforced. The live base SHA is derived at
  runtime, not recorded.
- **Canonical sorted artifact set hash** — SHA-256 over exact bytes of `proposal.md`, every `specs/**/spec.md`, and `design.md`, plus canonical `tasks.md` bytes at the approved artifact commit. Canonical task bytes normalize ONLY a leading task-progress marker (`- [ ]` or `- [x]`) to `- [ ]`; every other byte remains bound. Paths prefix each digest and sort by path. The approval record is excluded. Progress-only checkbox updates preserve approval, while any task text/order/owner, requirement, design, or scope change invalidates it.
- **Approved autonomy ceiling** — the maximum `AutonomyMode` permitted
- **Approved writable roots and budgets** — the writable-root set and budget
  limits approved for this change
- **Informational fields** — approver login, approval timestamp, and policy
  version. Informational identity fields are recorded for audit and MUST NOT
  replace protected-branch or GitHub ruleset authority.

The approval record is privileged and human-controlled. It does not itself
prove personal identity; it derives authority from being present in the
protected base tree plus the branch-protection ruleset and review evidence
that placed it there.

#### Runtime SDD authority

Trigger approval MUST be rederived at runtime from ALL of the following:

1. Repository-controlled expected ID/owner/name and protected base ref match the approval record, live Git remote, and GitHub API/environment evidence when available; any disagreement fails closed
2. Live protected base SHA is derived from Git for that configured ref and cross-checked against event/API evidence when present
3. The approval record is read from the live protected base tree (not a
   caller-supplied path, not an unverified worktree, and not Engram)
4. The approved artifact commit is proven to be an ancestor of the live
   protected base SHA (e.g., `git merge-base --is-ancestor`)
5. The artifact set hash is recomputed from the LIVE protected base tree and matches the record. Only normalized task checkbox progress may differ; every other bound byte change invalidates approval
6. Native `gentle-ai sdd-status <change> --cwd <repo> --json --instructions`
   returns the same change with `applyState: ready`,
   `nextRecommended: apply`, and empty `blockedReasons`
7. The requested autonomy mode and scope are compatible with the approved
   ceiling, writable roots, and budgets
8. Branch/ruleset protection evidence is provided by an injected GitHub
   adapter; the offline local CLI MAY validate and propose but MUST NOT gain
   publication/full authority without this evidence

A caller-supplied `approval_ref`, caller-supplied `status`, and Engram-only
claims MUST NOT authorize execution or weaken any of these checks. Engram MAY
restore context only.

#### Verified CI-failure authority

CI-failure authority is derived separately from SDD authority. The trigger payload carries ONLY references to the original failed run and the reproduction run; it MUST NOT carry authoritative evidence fields. The GitHub CI adapter MUST:

1. Fetch the original workflow run, jobs/steps, workflow file at the failing SHA, and log archive through the authenticated GitHub API; rederive immutable repository ID, workflow path/ref, run attempt, head SHA, failed step ID, and failure conclusion
2. Verify the workflow/step is allowlisted by repository policy, derive the expected argv hash from the protected workflow definition, and compute a normalized failure fingerprint from the original log after removing explicitly documented nondeterministic fields
3. Verify ONE attested canonical reproduction report produced by a trusted clean-checkout rerun at the same SHA. The report binds repository/workflow identity, step ID, argv hash, nonzero exit code, normalized failure fingerprint, bounded log digest, producer workflow identity, and subject digest
4. Require original and reproduction evidence to match on repository/workflow identity, head SHA, step ID, argv hash, and normalized failure fingerprint. The original API step must conclude failure and the reproduction exit code must be nonzero; raw log bytes need not match

GitHub step conclusions alone, unauthenticated logs, and caller-supplied evidence are insufficient authority. Missing, stale, mismatched, or unattested reproduction evidence fails closed with `POLICY_DENIED`. CI-failure authority does not require an SDD approval record.

#### Pure authority decision

The authority decision logic MUST be modeled as a pure function separated
from process, Git, GitHub, and filesystem adapters. Adapters resolve external
evidence and return plain data. The pure function receives: live repository
identity with base ref/SHA, approval record or null, recomputed artifact
hash, native SDD status data, CI evidence (with original + reproduced
signatures), trigger profile, requested mode, and requested scope. It never
performs I/O. Design modules implementing this separation include
`schemas/approval.ts`, `authority/trigger.ts`,
`authority/native-sdd.ts`, and `authority/github-ci.ts`.
Repository identity (`delivery/identity.ts`) includes live base ref and
base SHA; it derives the trusted base ref from repository config/event,
rederives SHA from Git, and cross-checks GitHub environment when present.

#### Scenario: Approval rederived from repository authority

- GIVEN a trigger referencing an OpenSpec change ID
- WHEN the control plane resolves native SDD status, reads the approval
  record from the live protected base tree, proves the artifact commit is
  an ancestor of the live base, and recomputes the artifact hash
- THEN the trigger is accepted only when all eight runtime checks pass
- AND caller-supplied `approval_ref`, caller-supplied `status`, and
  Engram-only claims are ignored

#### Scenario: Trigger rejected when approval record is missing

- GIVEN a trigger referencing a change without an approval record at
  `.drenyra/control-plane/approvals/<change-name>.json` in the live
  protected base tree
- WHEN the control plane resolves native SDD status
- THEN the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: Trigger rejected when artifact hash mismatches

- GIVEN an approval record whose artifact set hash matches an older
  revision
- WHEN the control plane recomputes the hash from the LIVE protected base
  tree (after the approval record was committed)
- THEN the hash does not match because bound artifact content changed
- AND the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: Checkbox-only progress preserves approval

- GIVEN an approval record whose only live artifact difference is `[ ]` to `[x]` on existing task markers
- WHEN the control plane canonicalizes `tasks.md` and recomputes the artifact hash
- THEN the hash still matches
- AND any task text, ordering, owner marker, or non-checkbox byte change would fail the match

#### Scenario: Trigger rejected when artifact commit is not an ancestor

- GIVEN an approval record referencing an artifact commit that was
  force-pushed away or is not in the protected branch history
- WHEN the control plane runs `git merge-base --is-ancestor`
- THEN the check fails
- AND the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: Trigger rejected when SDD status is not apply-ready

- GIVEN a valid approval record and matching artifact hash
- AND native `gentle-ai sdd-status` returns `applyState: blocked` or
  non-empty `blockedReasons`
- WHEN the control plane evaluates authority
- THEN the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: Unverified trigger source rejected

- GIVEN a trigger whose source is neither a verified CI failure nor an
  approved SDD proposal
- WHEN the control plane evaluates trigger eligibility
- THEN the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: CI-failure trigger accepted with attested reproduction

- GIVEN a trigger carrying only original-run and reproduction-run references
- AND the GitHub adapter authenticates the original run/workflow/log evidence
- AND it verifies one attested reproduction report from a clean checkout at the same SHA
- AND the normalized fingerprints, step IDs, and argv hashes match, with original failure conclusion and nonzero reproduction exit
- WHEN the control plane evaluates CI-failure authority
- THEN the trigger is accepted without an SDD approval record

#### Scenario: CI-failure trigger rejected on missing attestation

- GIVEN a CI-failure trigger where the reproduction artifact is not
  attested or the attestation does not verify
- WHEN the control plane evaluates CI-failure authority
- THEN the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: CI-failure trigger rejected on signature mismatch

- GIVEN original evidence and a reproduction report whose step ID, argv hash, head SHA, or normalized failure fingerprint differs
- OR the original step did not conclude failure
- OR the reproduction exit code is zero
- WHEN the control plane evaluates CI-failure authority
- THEN the trigger is rejected with a `POLICY_DENIED` diagnostic

#### Scenario: Authority precedes model generation and is revalidated

- GIVEN an eligible trigger reference
- WHEN an autonomous workflow is about to call a model
- THEN it first runs trigger preflight and obtains a content-bound authorized-trigger context
- AND no model call occurs when preflight fails
- AND after a response is produced, final execution rederives live authority and rejects stale or mismatched context before reading or materializing response operations

#### Scenario: Local CLI denied full authority

- GIVEN a local Bun CLI invocation without GitHub environment or
  branch/ruleset protection evidence
- WHEN the control plane evaluates authority
- THEN the pipeline MAY validate, canonicalize, admit, and produce
  diagnostics
- BUT it MUST NOT gain publication or full autonomy authority
- AND the trigger is rejected if full mode is requested

### REQ-CCP-004: Path authority and canonicalization

The control plane MUST reject EVERY absolute input path regardless of whether it
points inside the worktree. Only validated relative paths may be resolved against
the authoritative repository root. After resolving a validated relative path, the
control plane MUST reject:

- Windows drive-letter and UNC prefixes;
- NUL bytes anywhere in the path;
- empty paths, dot-only paths (`.` and `..`);
- `..` traversal components;
- paths resolved outside the authoritative root after canonicalization;
- Unicode-normalization conflicts (NFC vs NFD equivalent forms);
- duplicate normalized paths within the same change-set;
- case-folding conflicts on case-insensitive-aware filesystems; and
- symlinked parent directories or symlink escapes.

#### Scenario: Absolute path rejected even inside worktree

- GIVEN an absolute proposed path `/home/user/repo/src/utils.ts` whose resolved
  location is inside the worktree
- WHEN the control plane validates the path
- THEN the path is rejected with a `PATH_AUTHORITY` diagnostic
- AND only relative paths are accepted

#### Scenario: Traversal rejected

- GIVEN a proposed path `../../etc/passwd`
- WHEN the control plane canonicalizes and resolves the path
- THEN the path is rejected with a `PATH_AUTHORITY` diagnostic

#### Scenario: NUL byte rejected

- GIVEN a proposed path containing a NUL byte `src/good.ts\x00hidden.ts`
- WHEN the control plane scans the path for NUL bytes
- THEN the path is rejected with a `PATH_AUTHORITY` diagnostic

#### Scenario: Unicode-normalization conflict rejected

- GIVEN proposed paths `café.ts` (NFC: precomposed é U+00E9) and
  `cafe\u0301.ts` (NFD: e + combining acute accent U+0301)
- WHEN the control plane applies Unicode normalization (both normalize to
  the same NFC form `café.ts`)
- THEN the change-set is rejected with a `PATH_CONFLICT` diagnostic

#### Scenario: Duplicate normalized path rejected

- GIVEN proposed paths `src/./module.ts` and `src/module.ts`
- WHEN the control plane normalizes both paths
- THEN they resolve to the same canonical path
- AND the change-set is rejected with a `PATH_CONFLICT` diagnostic

#### Scenario: Symlink escape rejected

- GIVEN a writable root `src/features/`
- AND the directory `src/features/link` is a symlink to `../secrets/`
- WHEN the control plane resolves a proposed path `src/features/link/token.env`
- THEN the resolved real path falls outside the writable root
- AND the path is rejected with a `PATH_AUTHORITY` diagnostic

### REQ-CCP-005: Isolated candidate construction

Generated content MUST be materialized only after every path has been
validated and only inside an isolated temporary candidate tree. The primary
delivery worktree MUST NOT be the first parsing, validation, or materialization
boundary.

#### Scenario: Candidate tree isolation

- GIVEN a validated change-set with three file paths
- WHEN the control plane constructs the candidate
- THEN file content is written inside an isolated temporary Git tree
- AND the main repository worktree is not modified
- AND no file outside the candidate tree is created

#### Scenario: Candidate tree Git identity

- GIVEN an isolated candidate tree
- WHEN the control plane initializes the candidate
- THEN the tree has its own Git index derived from the frozen base SHA
- AND the candidate index does not share any lock or state with the delivery
  worktree

### REQ-CCP-006: Exact diff derivation before delivery-tree mutation

The control plane MUST derive a Git diff from the candidate tree against the frozen
base SHA. It MUST inspect the diff's path set, file modes, and line counts before
any change is applied to the delivery worktree.

#### Scenario: Diff derived before delivery

- GIVEN a constructed candidate tree with modifications
- WHEN the control plane derives the diff
- THEN the diff is inspected for path, mode, and budget compliance
- AND no mutation of the delivery worktree has occurred

#### Scenario: Empty diff rejected

- GIVEN a candidate tree identical to the frozen base SHA
- WHEN the control plane derives the diff
- THEN the diff contains zero changes
- AND the run fails with an `EMPTY_DIFF` diagnostic

### REQ-CCP-007: File-count, per-file, and total-diff budgets

The control plane MUST enforce configurable budgets against the derived Git diff,
not raw response size. Default limits are a configurable file-count maximum, 200
changed lines per file, and 400 changed lines total. Exceeding any budget MUST stop
autonomous execution and route the change to a human workflow.

#### Scenario: Per-file budget exceeded

- GIVEN a candidate diff where one file has 250 changed lines
- AND the per-file budget is 200 lines
- WHEN the control plane checks the per-file budget
- THEN the run fails with a `BUDGET_PER_FILE` diagnostic
- AND no delivery worktree mutation occurs

#### Scenario: Total-diff budget exceeded

- GIVEN a candidate diff totaling 420 changed lines across three files
- AND the total-diff budget is 400 lines
- WHEN the control plane checks the total-diff budget
- THEN the run fails with a `BUDGET_TOTAL` diagnostic

#### Scenario: Budget derived from diff, not response

- GIVEN a model response returning a 5 KB file
- AND the same file already exists with a 4.8 KB prior version
- WHEN the control plane derives the diff
- THEN the budget is applied to the actual line changes, not the 5 KB response

### REQ-CCP-008: Affected-workspace verification resolution

The control plane MUST resolve affected packages from the candidate path set
and run required verification commands. Verified commands include root
`bun run typecheck` and `bun run --filter <package> test` for each affected
package with an existing test script. Verification that cannot be resolved
MUST fail closed.

#### Scenario: TypeScript package affected

- GIVEN a candidate diff touching
  `packages/drenyra-orchestrator/src/foo.ts`
- WHEN the control plane resolves affected workspaces
- THEN root `bun run typecheck` is required
- AND `bun run --filter @drenyra/orchestrator test` is required

#### Scenario: No affected package resolved

- GIVEN a candidate diff touching only files that do not map to any known package
- WHEN the control plane resolves affected workspaces
- THEN no workspace-level verification is resolved
- AND the run fails with a `VERIFICATION_UNRESOLVED` diagnostic

#### Scenario: Verification failure fails closed

- GIVEN required verification
  `bun run --filter @drenyra/orchestrator test`
- WHEN the test command exits with non-zero status
- THEN the run fails with a `VERIFICATION_ERROR` diagnostic
- AND no publication proceeds

### REQ-CCP-009: Canonical provenance hashing

The control plane MUST produce canonical, deterministic hashes for: the prompt
content, the model response content, and the candidate tree content. Hashes MUST
be computed over exact bytes with a declared algorithm and MUST be reproducible
from the same input bytes.

#### Scenario: Deterministic prompt hash

- GIVEN the same prompt bytes
- WHEN the control plane computes the prompt hash twice
- THEN both hashes are identical

#### Scenario: Response hash covers exact bytes

- GIVEN a model response file
- WHEN the control plane computes the response hash
- THEN the hash covers every byte of the response
- AND any byte change produces a different hash

#### Scenario: Candidate-tree hash excludes manifest directory

- GIVEN a candidate tree with source files and a
  `.drenyra/control-plane/manifests/` directory
- WHEN the control plane computes the candidate-tree hash
- THEN the `.drenyra/control-plane/manifests/` directory and
  its contents are excluded from the hash

### REQ-CCP-010: Pre-PR manifest schema

The control plane MUST generate a canonical pre-PR manifest stored under
`.drenyra/control-plane/manifests/` inside the autonomous PR. The manifest MUST
include: change ID, trigger identity, frozen base SHA, candidate path set with
file modes, candidate-tree hash (computed over all files excluding
`.drenyra/control-plane/manifests/**`), canonical manifest-envelope hash (computed
over all manifest fields excluding the envelope-hash field itself), per-file and
total diff sizes, model ID, prompt and response hashes, policy version and verdicts,
verification commands and result hashes, rollback-plan type, and intended PR base
and head.

#### Scenario: Manifest envelope hash is non-self-referential

- GIVEN a complete manifest with fields A, B, and envelope-hash
- WHEN the control plane computes the envelope hash
- THEN only fields A and B are hashed; the envelope-hash field is excluded
- AND computing the hash does not create circular dependency

#### Scenario: Candidate mutation invalidates manifest

- GIVEN a manifest containing candidate-tree hash T1 and envelope hash H1
- WHEN a candidate file outside `.drenyra/control-plane/manifests/` changes
- THEN rederiving the candidate tree produces T2 distinct from T1
- AND the stored manifest no longer matches the candidate
- AND the gate rejects publication without mutating the manifest

#### Scenario: Manifest stored in PR

- GIVEN a successful candidate construction
- WHEN the control plane generates the manifest
- THEN the manifest is committed inside the candidate PR at
  `.drenyra/control-plane/manifests/<change-id>.json`
- AND the manifest is part of the PR diff reviewed by humans

### REQ-CCP-011: Post-merge receipt

The control plane MUST emit a post-merge receipt after the PR is merged. The
receipt MUST include: final merge SHA, PR number, reviewer and approval evidence,
pre-PR manifest hash, repository identity, and merge strategy.

The receipt MUST be authenticated and content-addressed as GitHub evidence. It
MUST be retained under a documented policy and independently verifiable from
the merge SHA, manifest hash, and repository identity without relying on
Engram.

The receipt MUST be saved to Engram with topic key
`control-plane/receipt/<change-id>` as supplemental operational context. Engram
is never the sole safety authority; safety verdicts and GitHub candidate/receipt
evidence remain authoritative when Engram is unavailable. An Engram persistence
failure MUST be recorded as observable `EVIDENCE_DEGRADATION` but MUST NOT
silently weaken or authorize publication.

The receipt MUST NOT mutate the reviewed candidate.

#### Scenario: Receipt stored as GitHub evidence after merge

- GIVEN an autonomous PR merged by a human reviewer
- WHEN the control plane generates the post-merge receipt
- THEN the receipt references the final merge SHA, PR number, and manifest hash
- AND the receipt is stored as content-addressed GitHub evidence
- AND no commit is added to the merged code

#### Scenario: Receipt saved to Engram as supplemental context

- GIVEN a successfully stored GitHub receipt
- WHEN the control plane saves the Engram record
- THEN the Engram topic key is `control-plane/receipt/<change-id>`
- AND Engram is saved as supplemental operational context

#### Scenario: Engram failure does not block receipt

- GIVEN a valid GitHub receipt that was generated successfully
- AND Engram is temporarily unavailable
- WHEN the control plane attempts to save the Engram record
- THEN the `EVIDENCE_DEGRADATION` diagnostic is emitted
- AND the receipt remains authoritative via GitHub evidence
- AND publication is not blocked

#### Scenario: Receipt not generated for unmerged PR

- GIVEN an autonomous PR that is closed without merge
- WHEN the control plane checks merge status
- THEN no post-merge receipt is generated
- AND the GitHub close event remains the authoritative terminal event
- AND an Engram follow-up MAY be attempted as supplemental context

### REQ-CCP-012: Observability and audit fields

Every control-plane operation MUST emit structured diagnostics. Each record
includes the operation, timestamp, input hashes, outcome, applicable error
code, and correlation ID for the run.

#### Scenario: Operation diagnostic on success

- GIVEN a path-canonicalization operation for three paths
- WHEN all paths pass validation
- THEN the diagnostic record includes operation `path-canonicalize`,
  outcome `pass`, path count 3, and the run correlation ID

#### Scenario: Operation diagnostic on failure

- GIVEN a budget check that fails due to per-file limit
- WHEN the control plane records the diagnostic
- THEN the record includes error taxonomy code `BUDGET_PER_FILE`,
  the offending path, the limit, and the actual line count

### REQ-CCP-013: Error taxonomy

The control plane MUST classify failures with a stable error taxonomy. Categories
SHALL include:

- `SCHEMA_ERROR` — trigger or response fails schema validation;
- `TRANSPORT_SIZE` — trigger or response exceeds configured size limit;
- `PATH_AUTHORITY` — absolute path, traversal, NUL, symlink escape, or path
  outside authoritative root;
- `PATH_CONFLICT` — Unicode normalization conflict, duplicate path, or
  case-folding conflict;
- `PROTECTED_PATH` — path matches a protected domain;
- `BUDGET_PER_FILE` — per-file changed-line budget exceeded;
- `BUDGET_TOTAL` — total-diff budget exceeded;
- `BUDGET_FILE_COUNT` — file-count budget exceeded;
- `EMPTY_DIFF` — candidate diff contains zero changes;
- `VERIFICATION_ERROR` — required verification command failed;
- `VERIFICATION_UNRESOLVED` — required verification could not be resolved;
- `POLICY_DENIED` — trigger ineligible or policy verdict is deny;
- `BASE_DRIFT` — publication base SHA differs from frozen candidate base;
- `BRANCH_COLLISION` — target branch name already exists on remote;
- `IDENTITY_MISMATCH` — repository identity does not match candidate origin;
- `PUBLICATION_AUTHORITY` — publication token, ruleset, or permission check
  failed;
- `MANIFEST_INVALID` — manifest hash mismatch or structural invalidity;
- `RECEIPT_FAILURE` — post-merge receipt generation or storage failed;
- `EVIDENCE_DEGRADATION` — non-authoritative evidence persistence
  (e.g., Engram) degraded but safety verdicts intact;
- `INTERNAL` — unexpected internal error.

#### Scenario: Error code on protected-path request

- GIVEN a change-set that includes a path matching a protected domain
- WHEN the control plane rejects the request
- THEN the diagnostic includes error code `PROTECTED_PATH`
- AND the diagnostic includes the specific protected domain that matched

#### Scenario: Error code on evidence degradation

- GIVEN a successful publication where Engram save fails
- WHEN the control plane records the diagnostic
- THEN the error code is `EVIDENCE_DEGRADATION`
- AND the diagnostic confirms that GitHub evidence and safety verdicts are intact
