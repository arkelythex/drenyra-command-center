# Tasks: Autonomous Change Control Plane

<!-- markdownlint-configure-file {"MD013": false, "MD040": false, "MD060": false} -->
<!-- Wide traceability tables and task lists require these exceptions. -->

**Change:** `autonomous-change-control-plane`
**Phase:** plan (tasks)
**Created:** 2026-07-22
**Revised:** 2026-07-22 (gate correction — 30 items)
**Artifact store:** hybrid (OpenSpec + Engram)
**Status:** planning complete; awaiting interactive authorization for the first apply slice

---

## Review Workload Forecast

| Field                         | Value                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estimated total changed lines | 6300–8900                                                                                                                                                                                                                                                                                                                                    |
| Slice count                   | 27 stacked-to-main slices                                                                                                                                                                                                                                                                                                                    |
| Per-slice estimate            | 180–400 additions + deletions; hard stop before 400                                                                                                                                                                                                                                                                                          |
| 400-line budget risk          | High: isolation, publication, receipts, and active workflows require independent review units                                                                                                                                                                                                                                                |
| Chained PRs recommended       | Yes                                                                                                                                                                                                                                                                                                                                          |
| Suggested split               | PR1 → PR2 → PR2B → PR2C → PR2D → PR2E → PR3 → PR4 → PR5A → PR5B → PR6 → PR7A → PR7B → PR8A → PR8B → PR9A → PR9B → PR10A → PR10B → PR10C → PR10D → PR10E → PR10F → PR10G → PR10H → PR10I → PR10J                                                                                                                                              |
| Delivery strategy             | auto-forecast: apply only the next dependency-ready slice; split again before overflow                                                                                                                                                                                                                                                       |
| Chain strategy                | stacked-to-main                                                                                                                                                                                                                                                                                                                              |
| Reviewer path                 | foundations → schemas/transport → identity/schema → approval evidence → SDD authority → CI authority → paths → admission/modes → isolation → materialization/budgets → diff/hashing → manifest/verification → authority preflight → execution pipeline/CLI → patch → publication/rollback → receipt → Dependabot → action → workflows → docs |
| Estimated review time         | 15–30 min per slice                                                                                                                                                                                                                                                                                                                          |
| Native bounded review         | Selects lenses per exact candidate; not prescribed here                                                                                                                                                                                                                                                                                      |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

---

## Pre-Apply Verification

- [x] **EVIDENCE-01:** Commands `bun run lint:all` and `bun run docs:verify` verified in root `package.json` (2026-07-22). Both exist and are functional; `bun run workflows:validate` must still be created before first use (PR10A).
- [x] **PR0-T01:** Strict TDD authority reconciled on 2026-07-23. The user selected repository persistence and `openspec/config.yaml` now declares `strict_tdd: true`. Every apply/verify slice must receive the non-negotiable Strict TDD instruction and preserve RED → GREEN → TRIANGULATE → REFACTOR evidence. <!-- sdd-owner: implementation -->

---

## PR 1 — Types, Diagnostics, Config

```
main
  │
  └── 📍 PR1: types, diagnostics, config
       │
       └── PR2: schemas, transport (depends on PR1)
```

**Objective:** Deploy the static foundation: domain types, error taxonomy, diagnostic recorder, and configuration model. No I/O, no schemas, no Git. All modules are pure.

**Start state:** `packages/drenyra-orchestrator/` has zero runtime dependencies. No `control-plane/` directory exists.

**End state:** `control-plane/types.ts`, `control-plane/index.ts`, `control-plane/diagnostics/taxonomy.ts`, `control-plane/diagnostics/recorder.ts`, and `control-plane/config/control-plane-config.ts` exist with passing tests. `bun run typecheck` and `bun run --filter @drenyra/orchestrator test` pass.

### Tasks

- [x] **PR1-T01 (RED):** Write failing tests at `packages/drenyra-orchestrator/src/control-plane/__tests__/diagnostics.taxonomy.test.ts`. Assert that `ERROR_TAXONOMY` is a const object with exactly 20 unique string values matching REQ-CCP-013 codes. Assert `ErrorTaxonomyCode` type extracted via `typeof ERROR_TAXONOMY[keyof typeof ERROR_TAXONOMY]`. Add `@ts-expect-error` fixture proving an arbitrary string literal like `"FAKE_CODE"` is not assignable to `ErrorTaxonomyCode`. <!-- sdd-owner: implementation -->
- [x] **PR1-T02 (GREEN):** Implement `control-plane/diagnostics/taxonomy.ts` using the const-object + type-extraction pattern (not const enum). Implement `control-plane/diagnostics/recorder.ts` with `createDiagnostic(op, correlationId, inputHash, outcome, errorCode?, detail?)` returning `DiagnosticRecord`. `inputHash` is SHA-256 of the operation's input bytes per REQ-CCP-012. <!-- sdd-owner: implementation -->
- [x] **PR1-T03 (TRIANGULATE):** Test: undefined `detail` defaults to `{}`. Empty `correlationId` returns `INTERNAL` error result. `outcome` accepts only `"pass"`, `"fail"`, `"degraded"`. `inputHash` is always a 64-char lowercase hex string; missing or non-hex inputHash is rejected as `INTERNAL`. <!-- sdd-owner: implementation -->
- [x] **PR1-T04 (REFACTOR):** Verify `DiagnosticRecord` uses flat interfaces (no inline nested objects per TypeScript skill). Run `bun run typecheck`. <!-- sdd-owner: implementation -->
- [x] **PR1-T05 (RED):** Write failing config tests covering required expected repository ID/owner/name/protected base ref, autonomy, paths, budgets, verification, Dependabot, manifest path, explicit receipt retention, and publication branch prefix. Missing or placeholder repository identity fails closed. <!-- sdd-owner: implementation -->
- [x] **PR1-T06 (GREEN):** Implement `ControlPlaneConfig` and a defaults type that deliberately omits compliance-owned receipt retention AND expected repository identity. Those values must come from versioned repository config. `resolveConfig` rejects missing/placeholder ID, owner/name/ref, or nonpositive retention. Environment overrides are limited to stricter mode and diagnostics directory and cannot alter repository identity, authority, paths, budgets, verification, or merge behavior. <!-- sdd-owner: implementation -->
- [x] **PR1-T07 (TRIANGULATE):** Test equal-or-stricter mode overrides, rejection of widening attempts, ignored budget/identity environment values, missing repository identity/retention, malformed protected ref, and empty protected registry. <!-- sdd-owner: implementation -->
- [x] **PR1-T08 (REFACTOR):** Extract `validateConfig(config: ControlPlaneConfig): DiagnosticRecord[]`. Use const-object pattern for `AUTONOMY_MODE` and `TRIGGER_PROFILE`. Verify: `bun run --filter @drenyra/orchestrator typecheck` PASS; `bun run --filter @drenyra/orchestrator test` PASS; full root `bun run typecheck` executed with zero diagnostics under `packages/drenyra-orchestrator/` (1190 pre-existing errors documented outside candidate paths; root green never claimed). <!-- sdd-owner: implementation -->
- [x] **PR1-T09:** Write the plain TypeScript domain types and an internal `control-plane/index.ts` barrel. Do not add the incomplete control plane to the package's public export map yet; public exposure waits for the documented CLI/API slice. <!-- sdd-owner: implementation -->
- [x] **PR1-T10 (VERIFY):** `bun run --filter @drenyra/orchestrator typecheck` PASS; `bun run --filter @drenyra/orchestrator test` PASS (60 tests, 7 files); full root `bun run typecheck` executed — zero diagnostics under `packages/drenyra-orchestrator/src/control-plane/`, `packages/drenyra-orchestrator/__tests__/control-plane/`, `packages/drenyra-orchestrator/vitest.config.ts`, `packages/drenyra-orchestrator/tsconfig.json`. Existing orchestrator tests unbroken. Baseline: 1190 pre-existing errors outside candidate paths (documented, not claimed green). <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy. No runtime dependency was added and existing modules do not import these files.
**Docs:** None beyond JSDoc on public types.
**Out-of-scope:** Zod, schemas, transport, paths, admission, candidates, pipeline, CLI, workflows, skill.
**Estimated:** 360–400 additions+deletions (actual: 369 candidate lines — 6 tracked, 363 untracked). Review: 20 min.

---

## PR 2 — Schemas, Transport

```
main
  │
  ├── PR1: types, diagnostics, config ✅
  │
  └── 📍 PR2: schemas, transport (depends on PR1)
       │
       └── PR2B: identity and approval schema (depends on PR2)
```

**Objective:** Add Zod 4 as the first runtime dependency. Implement trigger and change-set schemas with `.strict()` validation. Implement untrusted transport layer. No path processing yet.

**Start state:** PR1 merged. Types exist. No runtime dependencies in orchestrator.

**End state:** `schemas/trigger.ts`, `schemas/change-set.ts`, `transport/input.ts` exist. Zod 4 in `package.json` dependencies and `bun.lock`. Deterministic fixture tests pass.

### Tasks

- [ ] **PR2-T01 (RED):** Write failing tests at `control-plane/__tests__/schemas.trigger.test.ts`. Assert: valid trigger passes. Missing `change_id` → `SCHEMA_ERROR`. Unknown fields rejected (`.strict()`). `schema_version` other than literal `1` rejected. Oversized payload → `TRANSPORT_SIZE`. <!-- sdd-owner: implementation -->
- [ ] **PR2-T02 (GREEN):** Add `"zod": "^4.4.3"` to `packages/drenyra-orchestrator/package.json` dependencies. Run `bun install`. Implement `schemas/trigger.ts` with `TriggerPayloadSchema` (Zod `.strict()`). Implement `schemas/change-set.ts` with `ChangeSetSchema` + `FileOperationSchema`. Create/update require content; delete forbids content and mode. Max 50 operations. v1 UTF-8 text only. <!-- sdd-owner: implementation -->
- [ ] **PR2-T03 (TRIANGULATE):** Test: `change_id` >256 chars rejected. `operations` array empty (0) rejected. `operations` with 51 entries rejected. `operation: "create"` without `content` rejected. `operation: "delete"` with `content` rejected. `operation: "delete"` with `mode` rejected. `content` with embedded NUL byte rejected at materialization boundary (content passes schema, rejected later). <!-- sdd-owner: implementation -->
- [ ] **PR2-T04 (REFACTOR):** Run `bun run typecheck`. Verify `bun.lock` pins exact Zod version. `bun run --filter @drenyra/orchestrator test` passes. <!-- sdd-owner: implementation -->
- [ ] **PR2-T05 (RED):** Write failing tests at `control-plane/__tests__/transport.input.test.ts`. Assert: `readTriggerFromFile(path, maxSize)` returns `TriggerPayload`. Malformed JSON → `SCHEMA_ERROR`. File >maxSize → `TRANSPORT_SIZE`. Non-UTF-8 bytes → decode failure. Bytes with `$()`, backticks, `${VAR}`, single quotes preserved exactly. <!-- sdd-owner: implementation -->
- [ ] **PR2-T06 (GREEN):** Implement `transport/input.ts` with `readTriggerFromFile` and `readResponseFromFile`. Use `Bun.file(path).arrayBuffer()`. Decode with `TextDecoder("utf-8", { fatal: true })`. Apply Zod schemas. Return `ControlPlaneResult<T>`. <!-- sdd-owner: implementation -->
- [ ] **PR2-T07 (TRIANGULATE):** Harmless injection fixture: create an owned temporary directory, choose a nonexistent sentinel child, embed shell-looking text that references that child in JSON content, then read it back. Prove bytes match exactly and the sentinel remains absent. File not found → `INTERNAL`; empty or whitespace-only file → `SCHEMA_ERROR`. <!-- sdd-owner: implementation -->
- [ ] **PR2-T08 (REFACTOR):** Verify `transport/input.ts` never uses `eval`, `exec`, shell interpolation, or string concatenation into command strings. All process spawning (none yet) will use `Bun.spawn({ cmd: [...], shell: false })`. Run `bun run typecheck && bun run --filter @drenyra/orchestrator test`. <!-- sdd-owner: implementation -->
- [ ] **PR2-T09 (VERIFY):** Full orchestrator test suite passes. Zod is the only new runtime dependency; no minimatch, micromatch, or other additions in this PR. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; remove Zod only through that reviewed revert and regenerate the lock with Bun.
**Docs:** None beyond code comments.
**Out-of-scope:** Path canonicalization, admission, policy, candidates, pipelines.
**Estimated:** 320–400 additions+deletions. Review: 25 min.

---

## PR 2B — Repository Identity and Approval Schema

```
main
  │
  ├── PR1–PR2 merged ✅
  │
  └── 📍 PR2B: identity and approval schema (depends on PR2)
       │
       └── PR2C: approval evidence adapter (depends on PR2B)
```

**Objective:** Derive live repository/base identity against repository-controlled expectations and define the non-self-referential approval schema. No Git-tree evidence or authority decision yet.
**Start state:** PR2 merged; config, types, and Zod transport schemas exist.
**End state:** `delivery/identity.ts` and `schemas/approval.ts` pass config/Git/event cross-check and strict-schema tests.

### Tasks

- [ ] **PR2B-T01 (RED):** Test identity derivation from versioned expected repository ID/owner/name/protected ref plus live remote and Git SHA. GitHub API/environment evidence, when present, must match. Cover push/workflow-dispatch with empty `GITHUB_BASE_REF`, local mode, remote mismatch, SHA mismatch, and no hardcoded literals. <!-- sdd-owner: implementation -->
- [ ] **PR2B-T02 (GREEN):** Implement `delivery/identity.ts` with injected Git/event/GitHub adapters. Config supplies expected identity and protected ref; Git supplies remote + live SHA. Missing live branch-protection evidence is represented explicitly and never upgraded by local config. <!-- sdd-owner: implementation -->
- [ ] **PR2B-T03 (TRIANGULATE):** Prove local config + Git can produce validation/proposal identity, while full/publication authority remains unavailable without live `ProtectedBaseEvidence`. <!-- sdd-owner: implementation -->
- [ ] **PR2B-T04 (RED):** Test strict `ApprovalRecordSchema`: fixed version, canonical change name, repository identity, `approved_artifact_commit_sha`, `protected_base_ref`, artifact-set hash, autonomy ceiling, writable roots, budgets, policy version, and informational approver/time. Reject unknown fields and any self-referential `base.sha`. <!-- sdd-owner: implementation -->
- [ ] **PR2B-T05 (GREEN):** Implement `schemas/approval.ts` with Zod `.strict()` and no I/O. <!-- sdd-owner: implementation -->
- [ ] **PR2B-T06 (VERIFY):** Run root typecheck and package tests; verify identity code contains no repository literals and every external dependency is injected. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** JSDoc on public identity and approval fields.
**Out-of-scope:** Approval-file reads, artifact hashing, branch protection, SDD/CI authority.
**Estimated:** 240–360 additions + deletions. Review: 25 min.

---

## PR 2C — Approval Evidence and Artifact Hashing

```
main
  │
  ├── PR2B merged ✅
  │
  └── 📍 PR2C: approval evidence (depends on PR2B)
       │
       └── PR2D: SDD authority (depends on PR2C)
```

**Objective:** Read approval/artifact bytes from the exact live base tree, compute the artifact hash purely, and prove approved-commit ancestry without conflating Git I/O with hashing.
**Start state:** PR2B merged; identity and approval schema exist.
**End state:** Pure `canonicalization/artifact-hash.ts` and adapter `authority/approval-store.ts` pass exact-tree tests.

### Tasks

- [ ] **PR2C-T01 (RED):** Test pure `computeArtifactSetHash(entries)`: exact proposal/spec/design bytes; tasks bytes with ONLY leading `[ ]`/`[x]` markers normalized; path-byte ordering; missing/duplicate required entry rejection; approval-record exclusion; zero Git/fs/process imports. <!-- sdd-owner: implementation -->
- [ ] **PR2C-T02 (GREEN):** Implement pure `canonicalization/artifact-hash.ts` over `{ path, bytes }[]`. <!-- sdd-owner: implementation -->
- [ ] **PR2C-T03 (RED):** In temporary Git repos, test `authority/approval-store.ts`: validate canonical change slug before path construction; read the fixed approval path from `liveBaseSha`; enumerate/read required artifacts from that same tree with argv-only Git; and run `git merge-base --is-ancestor approvedArtifactSha liveBaseSha`. Reject missing files, path injection, malformed record, non-ancestor, and wrong Git common directory. <!-- sdd-owner: implementation -->
- [ ] **PR2C-T04 (GREEN):** Implement the Git-tree adapter returning plain `ApprovalEvidence` to the pure hasher/authority layer. Never label Git-tree operations pure. <!-- sdd-owner: implementation -->
- [ ] **PR2C-T05 (TRIANGULATE):** Prove approval-record commits and checkbox-only progress preserve the hash; task text/order/owner changes and every proposal/spec/design byte change invalidate it. Reject malformed task markers rather than over-normalizing. <!-- sdd-owner: implementation -->
- [ ] **PR2C-T06 (VERIFY):** Run root typecheck and package tests twice; assert all Git argv include validated revisions/paths and no shell. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** JSDoc documents pure-vs-adapter boundary.
**Out-of-scope:** Branch rulesets, native SDD, CI reproduction, pipeline.
**Estimated:** 260–390 additions + deletions. Review: 25 min.

---

## PR 2D — Protected-Base and SDD Authority

```
main
  │
  ├── PR2C merged ✅
  │
  └── 📍 PR2D: protected-base and SDD authority (depends on PR2C)
       │
       └── PR2E: CI-failure authority (depends on PR2D)
```

**Objective:** Mechanically authorize an approved SDD trigger only when all eight repository/native/protection/scope checks agree.
**Start state:** PR2C merged; repository and approval evidence can be derived.
**End state:** `authority/protected-base.ts`, `authority/native-sdd.ts`, and the SDD branch of pure `authority/trigger.ts` pass adapter-mock and policy tests.

### Tasks

- [ ] **PR2D-T01 (RED):** Test injected GitHub protected-base adapter for repository ID, exact protected ref/SHA, active ruleset/branch-protection evidence, and the reviewed approval-record commit. Missing permission, fork ambiguity, stale SHA, or unprotected ref fails closed. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T02 (GREEN):** Implement `authority/protected-base.ts`; return plain `ProtectedBaseEvidence`, never a caller-controlled boolean. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T03 (RED):** Test exact argv and strict JSON parsing for `gentle-ai sdd-status <canonical-change> --cwd <repo> --json --instructions`. Require same `changeName`, `applyState: ready`, `nextRecommended: apply`, and empty blockers. Missing binary/nonzero/malformed/foreign change fails closed. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T04 (GREEN):** Implement `authority/native-sdd.ts` with injected argv process adapter and no shell. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T05 (RED):** Test pure SDD authority across all eight checks: config/live/record identity, live base derivation, fixed-tree record, ancestry, live-tree artifact hash, native status, approved ceiling/scope, and protection evidence. Caller status/ref and Engram claims have no input capable of granting authority. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T06 (GREEN):** Implement the SDD branch of `authority/trigger.ts` using plain evidence only; no adapter imports. <!-- sdd-owner: implementation -->
- [ ] **PR2D-T07 (VERIFY):** Run root typecheck and package tests with network/process adapters mocked; prove offline local full/publication authority is denied while proposal-only validation remains available. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** JSDoc enumerates all eight checks.
**Out-of-scope:** CI-failure authority and pipeline integration.
**Estimated:** 280–400 additions + deletions. Review: 30 min.

---

## PR 2E — Attested CI-Failure Authority

```
main
  │
  ├── PR2D merged ✅
  │
  └── 📍 PR2E: CI-failure authority (depends on PR2D)
       │
       └── PR3: canonicalization (depends on PR2E)
```

**Objective:** Authorize only a reproducible CI failure proven by authenticated original GitHub evidence plus one trusted, attested reproduction report at the same SHA.
**Start state:** PR2D merged; pure authority and injected GitHub adapter contracts exist.
**End state:** `schemas/failure-report.ts`, `authority/github-ci.ts`, and the CI branch of `authority/trigger.ts` pass fully mocked, network-free tests.

### Tasks

- [ ] **PR2E-T01 (RED):** Test strict attested reproduction-report schema: repository/workflow identity, reproduction run, head SHA, step ID, allowlisted argv hash, nonzero exit code, normalized fingerprint, bounded log digest, artifact digest, attestation ID, and producer identity. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T02 (GREEN):** Implement `schemas/failure-report.ts`; trigger schema carries only original/reproduction run references and failing SHA. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T03 (RED):** Mock GitHub adapters. Authenticate original run/jobs/workflow-at-SHA/log archive; derive allowlisted argv hash and normalized fingerprint. Verify the reproduction report subject digest, attestation, producer, freshness, clean checkout, and SHA. Compare repository/workflow/SHA/step/argv/fingerprint; require original failure conclusion and nonzero reproduction exit. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T04 (GREEN):** Implement `authority/github-ci.ts` returning `VerifiedCiEvidence | null`; environment or caller payload alone never authorizes. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T05 (TRIANGULATE):** Test unauthenticated original logs, unallowlisted step, missing/stale reproduction, bad attestation, mismatched producer/SHA/argv/fingerprint, zero reproduction exit, fork replay, and successful deterministic reproduction. Every ambiguity denies. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T06 (GREEN):** Extend pure `authority/trigger.ts` with the CI branch over verified evidence only. <!-- sdd-owner: implementation -->
- [ ] **PR2E-T07 (VERIFY):** Run root typecheck and package tests with network disabled; assert tests never call GitHub. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** JSDoc distinguishes normalized fingerprint from raw log digest.
**Out-of-scope:** Workflow production of the two reports (PR10G), pipeline integration.
**Estimated:** 280–400 additions + deletions. Review: 30 min.

---

## PR 3 — Path Canonicalization

```
main
  │
  ├── PR1: types, diagnostics, config ✅
  ├── PR2: schemas, transport ✅
  ├── PR2B: identity and approval schema ✅
  ├── PR2C: approval evidence adapter ✅
  ├── PR2D: protected-base and SDD authority ✅
  ├── PR2E: attested CI-failure authority ✅
  │
  └── 📍 PR3: canonicalization (depends on PR2E)
       │
       └── PR4: admission, modes (depends on PR3)
```

**Objective:** Implement pure lexical/root-containment canonicalization plus a separate pre-materialization filesystem authority adapter. No content is materialized.

**Start state:** PR2E merged. `CanonicalPath`, repository identity, approval evidence, and both verified authority paths exist.

**End state:** Pure `canonicalization/path.ts` and adapter `admission/path-authority.ts` pass lexical, containment, Unicode, conflict, and ancestor-symlink tests.

### Tasks

- [ ] **PR3-T01 (RED):** Write failing tests at `control-plane/__tests__/canonicalization.path.test.ts`. Fixture test cases: empty string → `PATH_AUTHORITY`. `"."` → `PATH_AUTHORITY`. `".."` → `PATH_AUTHORITY`. Absolute `/etc/passwd` → `PATH_AUTHORITY`. Traversal `../../secrets` → `PATH_AUTHORITY`. NUL byte `src/\x00hidden` → `PATH_AUTHORITY`. Windows drive `C:\foo` → `PATH_AUTHORITY`. UNC `\\server\share` → `PATH_AUTHORITY`. Leading `-` → `PATH_AUTHORITY`. ASCII control chars → `PATH_AUTHORITY`. Valid relative `src/utils.ts` → accepted. <!-- sdd-owner: implementation -->
- [ ] **PR3-T02 (GREEN):** Implement pure `canonicalization/path.ts`: reject empty/dot/control/Windows/absolute/traversal/leading-dash inputs, normalize NFC and dot segments, enforce authoritative-root containment and privileged-prefix denial. No filesystem/process imports. <!-- sdd-owner: implementation -->
- [ ] **PR3-T03 (RED→GREEN):** Test/implement `admission/path-authority.ts` as the separate `lstat` adapter over already canonical paths. Reject symlink ancestors, root replacement, and missing/invalid parent types; return plain evidence and perform no writes. <!-- sdd-owner: implementation -->
- [ ] **PR3-T04 (TRIANGULATE):** Batch-test NFC/dot/case-fold conflicts and repeat ancestor checks immediately before materialization. Verify pure canonicalization has no I/O imports. <!-- sdd-owner: implementation -->
- [ ] **PR3-T05 (VERIFY):** Run orchestrator tests and root typecheck. All path fixtures use temporary Git repositories; no production paths. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy. No other module imports canonicalization yet.
**Docs:** None.
**Out-of-scope:** Admission, policy, candidate, diff, hashing.
**Estimated:** 340–400 additions+deletions. Review: 25 min.

---

## PR 4 — Admission, Modes

```
main
  │
  ├── PR1: types, diagnostics, config ✅
  ├── PR2: schemas, transport ✅
  ├── PR3: canonicalization ✅
  │
  └── 📍 PR4: admission, modes (depends on PR3)
       │
       └── PR5A: candidate isolation (depends on PR4)
```

**Objective:** Implement pre-materialization path admission (protected-path deny-first, writable-root enforcement) and the autonomy mode state machine. Before importing `minimatch`, declare `minimatch@10.2.5` as a direct orchestrator dependency and verify the existing lock entry is reused; workspace-hoisted undeclared access is forbidden.

**Start state:** PR3 merged. `CanonicalPath` values can be produced. Config has `paths.protected`, `paths.writableRoots`.

**End state:** `admission/protected-paths.ts`, `admission/writable-roots.ts`, `policy/modes.ts` exist. Path admission runs before any content write. Autonomy mode enforces `proposal-only` and `disabled`.

### Tasks

- [ ] **PR4-T01 (RED):** Write failing tests at `control-plane/__tests__/admission.protected-paths.test.ts`. Use safe fixture paths (NOT the control plane's own source). Assert: path matching `**/fiscal/**` denied with `PROTECTED_PATH` and domain name. Paths matching `**/sunat/**`, `**/sire/**`, `**/igv/**`, `**/auth/**`, `**/security/**`, `**/payments/**`, `.github/workflows/*.yml`, `.drenyra/control-plane/**` denied. Safe path under a fixture writable root passes. Empty protected registry → config validation already rejected it (PR1). <!-- sdd-owner: implementation -->
- [ ] **PR4-T02 (GREEN):** Add `minimatch: "10.2.5"` to the orchestrator's direct dependencies and confirm `bun.lock` reuses the existing exact package. Implement `admission/protected-paths.ts`. For overlapping matches, record ALL matching domains; deterministic primary is the first by configuration-array order. <!-- sdd-owner: implementation -->
- [ ] **PR4-T03 (TRIANGULATE):** Test: overlapping patterns (`**/fiscal/**` and `**/security/**` both match a path under `fiscal/security/`) → all matches recorded, primary is first in config order. Path not matching any pattern → passes. Path under writable root but matching protected pattern → denied (deny-first). Test with a temp fixture repo, never the control plane's own source tree. <!-- sdd-owner: implementation -->
- [ ] **PR4-T04 (REFACTOR):** Verify `checkProtectedPaths` is pure (no I/O, no process). Depends only on `minimatch` and domain types. Run `bun run typecheck`. <!-- sdd-owner: implementation -->
- [ ] **PR4-T05 (RED):** Write failing tests at `control-plane/__tests__/admission.writable-roots.test.ts`. Fixture paths: within writable root → passes. Outside all writable roots → denied. No writable roots configured for profile → all paths denied. Multiple roots → path matching any passes. Prefix-only match (`src/features/` must not admit `src/features-extra/module.ts`). <!-- sdd-owner: implementation -->
- [ ] **PR4-T06 (GREEN):** Implement `admission/writable-roots.ts` with `checkWritableRoots(paths, roots): ControlPlaneResult<PathAdmissionVerdict>`. Path must have a prefix exactly matching a root directory plus `/` or the root directory exactly. <!-- sdd-owner: implementation -->
- [ ] **PR4-T07 (TRIANGULATE):** Test: trailing-slash edge cases. Root with no trailing slash in config. Multiple paths, some denied, some accepted → partial denial in verdict. <!-- sdd-owner: implementation -->
- [ ] **PR4-T08 (RED):** Write failing tests at `control-plane/__tests__/policy.modes.test.ts`. Assert: mode `disabled` → `POLICY_DENIED` for any trigger. Mode `proposal-only` → pipeline may only validate + canonicalize + path-admit. Mode `full` → full pipeline allowed. <!-- sdd-owner: implementation -->
- [ ] **PR4-T09 (GREEN):** Implement `policy/modes.ts` with `evaluateAutonomyMode(config, trigger): ControlPlaneResult<{ mode: AutonomyMode }>`. `disabled` → immediate reject. `proposal-only` → allow up to path admission only. `full` → allow full pipeline. <!-- sdd-owner: implementation -->
- [ ] **PR4-T10 (TRIANGULATE):** Test: transition `full` → `proposal-only` honored. Back to `disabled` honored. No path from `proposal-only`/`disabled` to unguarded operation. <!-- sdd-owner: implementation -->
- [ ] **PR4-T11 (REFACTOR+VERIFY):** Verify protected-path, writable-root, and mode policy modules are pure; the earlier `path-authority.ts` remains the explicit filesystem adapter. Confirm direct imports and no duplicate minimatch lock version; run typecheck and package tests. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy. Admission and mode modules are isolated.
**Docs:** None.
**Out-of-scope:** Budgets, candidate isolation, diff, hashing, pipeline.
**Estimated:** 320–380 additions+deletions. Review: 25 min.

---

## PR 5A — Candidate Isolation and Guarded Cleanup

```
main
  │
  ├── PR1–PR4 merged ✅
  │
  └── 📍 PR5A: candidate isolation (depends on PR4)
       │
       └── PR5B: materialization and budgets (depends on PR5A)
```

**Objective:** Create detached candidate worktrees only inside owned temporary roots and make cleanup ownership-provable.
**Start state:** PR4 merged; no candidate filesystem exists.
**End state:** `candidate/isolation.ts` and deterministic isolation/cleanup tests pass.

### Tasks

- [ ] **PR5A-T01 (RED):** Write temp-repository tests for `createCandidateWorktree(baseSha, tempBase)`. Assert the function creates the owned parent itself, writes a marker containing PID and Git common-directory identity, keeps `<ownedRoot>/candidate` nonexistent until `git worktree add --detach`, and returns the owned root plus candidate path. <!-- sdd-owner: implementation -->
- [ ] **PR5A-T02 (GREEN):** Implement `candidate/isolation.ts` with argv-only Git commands. Normal cleanup verifies marker/common-dir, runs non-force `git worktree remove`, then removes the owned root. Await cleanup from `try/finally` and signal handlers. <!-- sdd-owner: implementation -->
- [ ] **PR5A-T03 (TRIANGULATE):** Test invalid base SHA, wrong/missing marker, mismatched Git common dir, live owner PID, dead owner PID, and startup orphan recovery. Guarded force cleanup is allowed only after marker + common-dir + dead-PID checks all pass. <!-- sdd-owner: implementation -->
- [ ] **PR5A-T04 (VERIFY):** Run package tests twice and assert `git worktree list --porcelain` plus the owned temp base contain no stale candidate. Run root typecheck. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; do not run autonomous rollback.
**Docs:** Ownership-marker invariants in JSDoc.
**Out-of-scope:** Content writes, budgets, diff, hashing.
**Estimated:** 260–380 additions + deletions. Review: 25 min.

---

## PR 5B — Candidate Materialization and Budgets

```
main
  │
  ├── PR5A merged ✅
  │
  └── 📍 PR5B: materialization and budgets (depends on PR5A)
       │
       └── PR6: diff and hashing (depends on PR5B)
```

**Objective:** Materialize only admitted UTF-8 file operations inside the isolated candidate and enforce configured diff budgets as a pure policy.
**Start state:** PR5A merged; candidate ownership is proven.
**End state:** `candidate/materialize.ts` and `policy/budgets.ts` pass boundary and budget tests.

### Tasks

- [ ] **PR5B-T01 (RED):** Test create/update/delete existence rules, allowed modes `100644`/`100755`, rejected symlink/submodule/type-change modes, NUL/non-UTF-8 rejection, and ancestor `lstat` symlink denial. <!-- sdd-owner: implementation -->
- [ ] **PR5B-T02 (GREEN):** Implement `materializeChanges(candidatePath, admittedChanges)` without reinterpreting paths. Recheck ancestors immediately before each write; create directories safely; stage with argv `git -C <candidate> add -A`. <!-- sdd-owner: implementation -->
- [ ] **PR5B-T03 (TRIANGULATE):** Test nested directories, executable bit, TOCTOU-style ancestor substitution, partial-operation failure cleanup, and no write outside candidate. <!-- sdd-owner: implementation -->
- [ ] **PR5B-T04 (RED):** Test `checkBudgets(diffReport, limits)` for file count, per-file additions+deletions, total additions+deletions, exact-boundary pass, and deletion-only diffs. `EMPTY_DIFF` is explicitly not a budget concern. <!-- sdd-owner: implementation -->
- [ ] **PR5B-T05 (GREEN):** Implement pure `policy/budgets.ts`; return all deterministic violations without mutating the report. <!-- sdd-owner: implementation -->
- [ ] **PR5B-T06 (VERIFY):** Run root typecheck and package tests. Confirm tests use owned temporary repos only. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** None.
**Out-of-scope:** Diff derivation, hashing, manifest, verification.
**Estimated:** 260–380 additions + deletions. Review: 25 min.

---

## PR 6 — Diff Derivation, Hashing

```
main
  │
  ├── PR1–PR5B merged ✅
  │
  └── 📍 PR6: diff, hashing (depends on PR5B)
       │
       └── PR7: manifest, verification (depends on PR6)
```

**Objective:** Implement exact diff derivation from the candidate tree and canonical SHA-256 hashing (tree hash, candidate identity hash). `EMPTY_DIFF` is produced here. Candidate identity hash binds stable provenance.

**Start state:** PR5B merged. Candidate worktree populated and staged.

**End state:** `candidate/diff.ts`, `canonicalization/hash.ts` exist. Diff is derived from candidate against exact base SHA. Candidate identity excludes timestamps/run IDs.

### Tasks

- [ ] **PR6-T01 (RED):** Write failing tests at `control-plane/__tests__/candidate.diff.test.ts`. Assert `deriveDiff(worktreePath, baseSha)` uses four separate deterministic commands: `git diff --cached --no-renames --name-status <base-sha>`, `--numstat`, `--raw`, `--full-index --patch`. Reject `T` (type change), `U` (unmerged), `X` (unknown). No `C`/`R` special handling needed with `--no-renames`. Empty diff → `EMPTY_DIFF`. <!-- sdd-owner: implementation -->
- [ ] **PR6-T02 (GREEN):** Implement `candidate/diff.ts` with `deriveDiff(worktreePath, baseSha): ControlPlaneResult<DiffReport>`. Parse each output. Reject `T`, `U`, `X` statuses. `A` = added, `D` = deleted, `M` = modified. Produce `DiffReport` with file list, per-file line counts, total added/deleted. <!-- sdd-owner: implementation -->
- [ ] **PR6-T03 (TRIANGULATE):** Test: added file → `added`. Modified → `modified`. Deleted → `deleted`. Multiple files in diff. Added+deleted lines counted independently. Empty diff detected before budget check. <!-- sdd-owner: implementation -->
- [ ] **PR6-T04 (RED):** Write failing tests at `control-plane/__tests__/canonicalization.hash.test.ts`. Assert `sha256Hex(content)` → lowercase 64-char hex. Same bytes → same hash. `computeCandidateTreeHash(worktreePath, manifestPrefix)` uses `git ls-files -s -z`, sorts by path bytes, skips manifest prefix, concatenates `path + "\0" + mode + "\0" + SHA-256(content) + "\n"`, hashes result. <!-- sdd-owner: implementation -->
- [ ] **PR6-T05 (GREEN):** Implement `canonicalization/hash.ts` with `sha256Hex`, `computeCandidateTreeHash`, and `computeCandidateIdentityHash`. Candidate identity hash binds: `repositoryId + "\0" + baseSha + "\0" + verifiedTriggerAuthorityHash + "\0" + modelId + "\0" + promptHash + "\0" + responseHash + "\0" + [sorted path/mode/content hashes] + "\0" + policyVersion`. Exclude timestamps, `created_at`, correlation IDs, run IDs, `intended_head`, branch name, envelope hash. <!-- sdd-owner: implementation -->
- [ ] **PR6-T06 (TRIANGULATE):** Candidate identity: timestamp/run/correlation changes preserve the hash; trigger authority, model, prompt, response provenance, policy version, path, mode, or content changes alter it. Tree hash excludes the manifest directory. <!-- sdd-owner: implementation -->
- [ ] **PR6-T07 (REFACTOR+VERIFY):** All hashes deterministic across runs. Run `bun run typecheck && bun run --filter @drenyra/orchestrator test`. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`. Hash determinism fixtures produce identical results twice.
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** None.
**Out-of-scope:** Manifest schema, canonicalization, verification, pipeline.
**Estimated:** 340–400 additions+deletions. Review: 25 min.

---

## PR 7A — Canonical Manifest

```
main
  │
  ├── PR1–PR6 merged ✅
  │
  └── 📍 PR7A: canonical manifest (depends on PR6)
       │
       └── PR7B: verification registry (depends on PR7A)
```

**Objective:** Produce a strict, canonical, non-self-referential pre-PR manifest through the privileged internal write channel.
**Start state:** PR6 merged; tree and candidate identity hashes exist.
**End state:** Manifest schema/canonicalization/generation tests pass.

### Tasks

- [ ] **PR7A-T01 (RED):** Test strict manifest schema, canonical UTF-8 JSON, sorted keys, LF endings, and envelope hash excluding only `envelope_hash`. <!-- sdd-owner: implementation -->
- [ ] **PR7A-T02 (GREEN):** Implement `schemas/manifest.ts` and `canonicalization/manifest.ts`; write only through the internal channel under the privileged manifest prefix. <!-- sdd-owner: implementation -->
- [ ] **PR7A-T03 (TRIANGULATE):** Test deterministic replay, manifest exclusion from tree hash, mutation mismatch, path privilege, and no model-authored manifest operation. <!-- sdd-owner: implementation -->
- [ ] **PR7A-T04 (VERIFY):** Run root typecheck and package tests twice for deterministic hashes. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** Public manifest fields receive JSDoc.
**Out-of-scope:** Verification commands and pipeline.
**Estimated:** 220–340 additions + deletions. Review: 20 min.

---

## PR 7B — Polyglot Verification Registry and Runner

```
main
  │
  ├── PR7A merged ✅
  │
  └── 📍 PR7B: verification registry (depends on PR7A)
       │
       └── PR8: pipeline and CLI (depends on PR7B)
```

**Objective:** Resolve every changed path to configured verification roots and execute required argv commands without a shell.
**Start state:** PR7A merged; config defines the registry shape.
**End state:** Resolver, registry, and bounded runner tests pass; unknown required roots fail closed.

### Tasks

- [ ] **PR7B-T01 (RED):** Test path-to-root resolution for orchestrator, Go CLI, Rust core, and reconciliation worker; duplicates collapse and unmatched required paths return `VERIFICATION_UNRESOLVED`. <!-- sdd-owner: implementation -->
- [ ] **PR7B-T02 (GREEN):** Implement `verification/resolver.ts` and default registry with argv arrays for verified existing commands. <!-- sdd-owner: implementation -->
- [ ] **PR7B-T03 (RED):** Test runner success/failure/not-found/timeout, global root typecheck always running, matched-root checks, output truncation plus full hashes, and `shell: false`. <!-- sdd-owner: implementation -->
- [ ] **PR7B-T04 (GREEN):** Implement `verification/runner.ts` with injected process adapter, bounded capture, and deterministic execution records. <!-- sdd-owner: implementation -->
- [ ] **PR7B-T05 (TRIANGULATE):** Test global failure while collecting root evidence, missing argv, unknown root, and stable execution ordering. <!-- sdd-owner: implementation -->
- [ ] **PR7B-T06 (VERIFY):** Run root typecheck and package tests; compare every default argv entry to an existing package script or binary contract. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** Registry entries document their verified command source.
**Out-of-scope:** Pipeline, CLI, delivery.
**Estimated:** 260–400 additions + deletions. Review: 25 min.

---

## PR 8A — Trigger Preflight and Context Binding

```
main
  │
  ├── PR1–PR7B merged ✅
  │
  └── 📍 PR8A: authority preflight (depends on PR7B)
       │
       └── PR8B: execution pipeline and CLI (depends on PR8A)
```

**Objective:** Prove trigger authority before any model invocation and emit a content-bound context that cannot authorize by possession alone.
**Start state:** PR7B merged; all trigger authority, policy, and verification components exist independently.
**End state:** `AuthorizedTriggerContext`, `preflightTrigger`, context canonicalization/hash, and CLI preflight mode pass stale/mismatch tests.

### Tasks

- [ ] **PR8A-T01 (RED):** Test bounded trigger read + strict schema + live repository/SDD-or-CI authority resolution before response/model access. Denial never opens the response path, creates a candidate, or returns a context. <!-- sdd-owner: implementation -->
- [ ] **PR8A-T02 (GREEN):** Define `AuthorizedTriggerContext` in the types layer and implement canonical context hashing over trigger, authority evidence, repository/base, approved mode/scope, and policy version. Exclude only `context_hash`; context is not a bearer token. <!-- sdd-owner: implementation -->
- [ ] **PR8A-T03 (GREEN):** Implement `ControlPlanePipeline.preflightTrigger(triggerPath)` with injected adapters and bounded diagnostics. <!-- sdd-owner: implementation -->
- [ ] **PR8A-T04 (RED→GREEN):** Add CLI `--phase preflight --trigger <file> --context-out <owned-file>`. Reject unsafe output paths, missing adapters, stale base, and unauthorized local full mode. <!-- sdd-owner: implementation -->
- [ ] **PR8A-T05 (TRIANGULATE):** Test SDD and CI preflight success, context byte determinism, policy/base/evidence changes altering the context hash, and caller-edited context rejection. <!-- sdd-owner: implementation -->
- [ ] **PR8A-T06 (VERIFY):** Run root typecheck and package tests; prove a model/process adapter is never invoked by preflight and no model call fixture occurs after failed preflight. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** CLI preflight help and JSDoc explaining non-bearer semantics.
**Out-of-scope:** Model response read, candidate creation, patch, publication.
**Estimated:** 260–380 additions + deletions. Review: 25 min.

---

## PR 8B — Execution Pipeline and CLI

```
main
  │
  ├── PR8A merged ✅
  │
  └── 📍 PR8B: execution pipeline and CLI (depends on PR8A)
       │
       └── PR9A: canonical patch (depends on PR8B)
```

**Objective:** After preflight and model response, rederive live authority before reading response content, then execute the safe candidate pipeline and return only `VerifiedCandidateHandoff`.
**Start state:** PR8A merged; an authorized-trigger context can be produced before model invocation.
**End state:** Final pipeline and execute/dry-run CLI phases pass stale-context, ordering, cleanup, and handoff tests. PR8B never constructs `CanonicalPatch`.

### Tasks

- [ ] **PR8B-T01 (RED):** Test `executeFromFiles(triggerPath, responsePath, context)`: re-read trigger and rederive live authority, compare context binding, and only then open/validate response. Stale base/policy/evidence or edited context denies before response read. <!-- sdd-owner: implementation -->
- [ ] **PR8B-T02 (GREEN):** Implement the execution sequence: trigger revalidation → response transport/schema → pure canonicalization → filesystem authority → protected deny-first → writable roots → candidate → materialize → diff/EMPTY_DIFF → budget → verification → manifest → `VerifiedCandidateHandoff`. Await cleanup in `try/finally`. <!-- sdd-owner: implementation -->
- [ ] **PR8B-T03 (TRIANGULATE):** Test protected path before candidate, budget before verification, verification before manifest, dry-run, empty diff, cleanup on every failure, and handoff manifest/diff/diagnostics/repository/base binding. <!-- sdd-owner: implementation -->
- [ ] **PR8B-T04 (RED→GREEN):** Add CLI `--phase execute --trigger --response --context [--dry-run]`. CLI and programmatic API emit structurally equivalent diagnostics; unknown/missing flags fail. <!-- sdd-owner: implementation -->
- [ ] **PR8B-T05 (REFACTOR):** Keep validated-value helpers private/internal so callers cannot inject an approved verdict or bypass live rederivation. Every process call uses argv + `shell: false`. <!-- sdd-owner: implementation -->
- [ ] **PR8B-T06 (VERIFY):** Run root typecheck and package tests plus owned-file CLI preflight→execute smoke. Verify PR8B never imports/constructs `CanonicalPatch`. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** Same-slice CLI/API section in `packages/drenyra-orchestrator/README.md`; expose only documented stable entry points.
**Out-of-scope:** Canonical patch wrapper/application, publication, receipts, workflows.
**Estimated:** 300–400 additions + deletions. Review: 30 min.

---

## PR 9A — Canonical Patch Generation and Application

```
main
  │
  ├── PR1–PR8B merged ✅
  │
  └── 📍 PR9A: canonical patch (depends on PR8B)
       │
       └── PR9B: publication and rollback (depends on PR9A)
```

**Objective:** Generate/apply the content-bound patch atomically. Repository identity
(`delivery/identity.ts`) already exists from PR2B and is reused.
**Start state:** PR8B merged; pipeline returns a verified candidate handoff (manifest +
diff bytes + diagnostics). `RepositoryIdentity` type and `delivery/identity.ts`
already exist from PR2B.
**End state:** `delivery/patch.ts` passes isolated Git tests for both generation and
application.

### Tasks

- [ ] **PR9A-T01 (RED):** Test patch generation from the PR8B handoff: exact base,
      `git apply --check --index -- <file>` before exact `git apply --index -- <file>`,
      no `--reject`, and no index/worktree delta after check failure.
  <!-- sdd-owner: implementation -->
- [ ] **PR9A-T02 (GREEN):** Implement `delivery/patch.ts` with argv-only Git calls
      and owned temporary patch files. Consume `RepositoryIdentity` from PR2B.
  <!-- sdd-owner: implementation -->
- [ ] **PR9A-T03 (TRIANGULATE):** Test create/delete/mode change, corrupted patch,
      wrong base, cleanup, and byte-identical replay.
  <!-- sdd-owner: implementation -->
- [ ] **PR9A-T04 (VERIFY):** Run root typecheck and package tests; search changed
      delivery files for force flags, shell strings, and hardcoded repository identity.
      Verify `delivery/identity.ts` from PR2B is imported (not reimplemented).
  <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** None.
**Out-of-scope:** Remote branch/PR publication, receipts, workflows.
**Estimated:** 200–300 additions + deletions. Review: 20 min.

---

## PR 9B — Publication Idempotency and Rollback Plans

```
main
  │
  ├── PR9A merged ✅
  │
  └── 📍 PR9B: publication and rollback (depends on PR9A)
       │
       └── PR10A: workflow validation foundation (depends on PR9B)
```

**Objective:** Publish one deterministic non-force branch/PR and emit, but never execute, a merge-strategy-aware rollback plan.
**Start state:** PR9A merged; patch and identity are verified.
**End state:** `delivery/publication.ts` and `rollback/plan.ts` pass mocked-adapter tests with zero network access.

### Tasks

- [ ] **PR9B-T01 (RED):** Test deterministic branch name, remote collision, base drift, matching open-PR replay, closed/mismatched PR denial, and absence of any force-push argv. Mock GitHub and Git transport adapters; tests MUST NOT access a network. <!-- sdd-owner: implementation -->
- [ ] **PR9B-T02 (GREEN):** Implement pure publication planning plus injected Git/GitHub adapters. Re-derive base and identity immediately before a normal push; create at most one PR; fail closed on ambiguity. <!-- sdd-owner: implementation -->
- [ ] **PR9B-T03 (TRIANGULATE):** Test retry after transport timeout, duplicate webhook/run, malicious change slug, and existing branch whose manifest identity differs. <!-- sdd-owner: implementation -->
- [ ] **PR9B-T04 (RED):** Test pure rollback-plan selection for merge commit, squash, and reversed rebase chain. Unknown strategy or missing commit evidence fails. No plan executes commands. <!-- sdd-owner: implementation -->
- [ ] **PR9B-T05 (GREEN):** Implement `rollback/plan.ts` as serializable data only. <!-- sdd-owner: implementation -->
- [ ] **PR9B-T06 (VERIFY):** Run root typecheck and package tests with network disabled. Assert publication code contains no direct-to-main or force-push path. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** None.
**Out-of-scope:** Autonomous rollback execution, merge, receipts, Dependabot, workflows.
**Estimated:** 280–400 additions + deletions. Review: 30 min.

---

## PR 10A — Deterministic Workflow Validation Foundation

```
main
  │
  ├── PR9B merged ✅
  │
  └── 📍 PR10A: workflow validation (depends on PR9B)
       │
       └── PR10B: receipt core (depends on PR10A)
```

**Objective:** Establish a repository-owned, Bun-executed YAML syntax and control-plane contract validator before changing any active workflow.
**Start state:** No verified workflow validator exists; `actionlint` is not installed.
**End state:** `bun run workflows:validate` parses actions/workflows and enforces shared security invariants with deterministic fixtures.

### Tasks

- [ ] **PR10A-T01 (RED):** Add failing tests for malformed YAML, duplicate keys, missing jobs/steps, over-broad top-level write permissions, raw unquoted expression interpolation in `run`, force-push tokens, direct-to-main publication, and missing producer/consumer artifact contracts. <!-- sdd-owner: implementation -->
- [ ] **PR10A-T02 (GREEN):** Add root dev dependency `yaml: "^2.9.0"` and verify `bun.lock` pins it. Implement `scripts/ci/validate-workflows.ts` using the YAML package with unique-key checking plus explicit repository invariants. Add exact root script `"workflows:validate": "bun run scripts/ci/validate-workflows.ts"`. Do not claim full GitHub schema validation. <!-- sdd-owner: implementation -->
- [ ] **PR10A-T03 (TRIANGULATE):** Add valid and invalid fixture actions/workflows. Prove the validator inspects `.github/actions/**/*.yml`, `.github/workflows/*.yml`, and `.yaml` variants, reports path + rule, and exits nonzero on any violation. <!-- sdd-owner: implementation -->
- [ ] **PR10A-T04 (VERIFY):** Run `bun run workflows:validate`, focused validator tests, root typecheck, and `bun run lint:all`. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run typecheck && bun run lint:all`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** Add script purpose and limitations to its module comment.
**Out-of-scope:** Editing active workflows, downloading or inventing actionlint.
**Estimated:** 200–320 additions + deletions. Review: 20 min.

---

## PR 10B — Post-Merge Receipt Core and Adapters

```
main
  │
  ├── PR10A merged ✅
  │
  └── 📍 PR10B: receipt core (depends on PR10A)
       │
       └── PR10C: receipt workflow (depends on PR10B)
```

**Objective:** Generate a deterministic post-merge receipt from verified GitHub evidence and keep pure generation separate from external storage adapters.
**Start state:** Publication exists; no post-merge receipt implementation exists.
**End state:** Pure receipt, GitHub evidence/attestation adapter, optional Engram adapter, and a file-based receipt CLI entry point pass mocked tests.

### Tasks

- [ ] **PR10B-T01 (RED):** Test receipt generation from merge SHA, PR number, required human approvals, manifest hash, repository identity, and merge strategy. Missing required approval evidence, unmerged event, identity mismatch, or hash mismatch returns `RECEIPT_FAILURE`. Receipt hash excludes itself. <!-- sdd-owner: implementation -->
- [ ] **PR10B-T02 (GREEN):** Implement pure `receipt/generate.ts` and canonical hashing. No I/O or mutable timestamps participate in receipt identity. <!-- sdd-owner: implementation -->
- [ ] **PR10B-T03 (RED):** Test injected GitHub evidence/attestation and Engram adapters with mocks only. GitHub authority failure blocks; Engram failure emits `EVIDENCE_DEGRADATION` without replacing GitHub evidence. <!-- sdd-owner: implementation -->
- [ ] **PR10B-T04 (GREEN):** Implement adapters and a receipt CLI/file entry point that reads a structured event/evidence file and writes canonical receipt JSON to an explicit output path. No network in pure core or tests. <!-- sdd-owner: implementation -->
- [ ] **PR10B-T05 (TRIANGULATE):** Test deterministic replay, duplicate delivery, changed approvals, closed-but-unmerged PR, and no mutation of Git/main/candidate. <!-- sdd-owner: implementation -->
- [ ] **PR10B-T06 (VERIFY):** Run root typecheck and package tests with network unavailable. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** Public receipt types receive JSDoc.
**Out-of-scope:** Workflow trigger and artifact publication.
**Estimated:** 280–400 additions + deletions. Review: 30 min.

---

## PR 10C — Post-Merge Receipt Workflow

```
main
  │
  ├── PR10B merged ✅
  │
  └── 📍 PR10C: receipt workflow (depends on PR10B)
       │
       └── PR10D: Dependabot policy (depends on PR10C)
```

**Objective:** Attest a receipt asynchronously after a human merge without writing to `main`.
**Start state:** Receipt CLI exists; no receipt workflow exists.
**End state:** `.github/workflows/autonomous-change-receipt.yml` handles only merged control-plane PRs and stores an attestable external receipt.

### Tasks

- [ ] **PR10C-T01 (RED):** Add workflow contract fixtures asserting trigger `pull_request.closed`, job guard `merged == true`, provenance check that the PR carries a valid control-plane manifest, read-only repository permission, narrowly scoped attestation permissions, and zero branch writes. <!-- sdd-owner: implementation -->
- [ ] **PR10C-T02 (GREEN):** Implement the workflow. Serialize event and API evidence to owned files, call the receipt CLI with quoted file argv, upload receipt artifact, attest its digest, and optionally persist supplemental Engram context. Never commit a receipt to `main`. <!-- sdd-owner: implementation -->
- [ ] **PR10C-T03 (TRIANGULATE):** Test/validate ignored unmerged PRs, ordinary non-control-plane PRs, missing approvals, attestation failure, and Engram degradation. <!-- sdd-owner: implementation -->
- [ ] **PR10C-T04 (VERIFY):** Run `bun run workflows:validate`, root typecheck, and package tests. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; removing the workflow does not mutate historical attestations.
**Docs:** Workflow header documents authority and failure behavior.
**Out-of-scope:** Autonomous merge or rollback execution.
**Estimated:** 180–300 additions + deletions. Review: 20 min.

---

## PR 10D — Dependabot Qualification Policy

```
main
  │
  ├── PR10C merged ✅
  │
  └── 📍 PR10D: Dependabot policy (depends on PR10C)
       │
       └── PR10E: Dependabot workflow (depends on PR10D)
```

**Objective:** Qualify an existing Dependabot PR using ecosystem-specific policy and evidence; never merge or create another PR.
**Start state:** No mechanical qualification policy exists.
**End state:** `policy/dependabot.ts` passes ecosystem, vulnerability, license, compatibility, and budget tests.

### Tasks

- [ ] **PR10D-T01 (RED):** Test Bun/npm, Go, Python, Docker, and GitHub Actions profiles from `.github/dependabot.yml`; Rust participates only when enabled. Cover allowlists, lockfile-only budget exceptions, source-file denial, thresholds, license denial, compatibility failure, and `autoMerge: false`. <!-- sdd-owner: implementation -->
- [ ] **PR10D-T02 (GREEN):** Implement pure qualification plus injected vulnerability/license/verification evidence adapters. A threshold equality uses the documented deny semantics. <!-- sdd-owner: implementation -->
- [ ] **PR10D-T03 (TRIANGULATE):** Test multi-ecosystem ambiguity, missing evidence, stale evidence, unknown package manager, and oversized lockfile diff. All ambiguity fails closed. <!-- sdd-owner: implementation -->
- [ ] **PR10D-T04 (VERIFY):** Run root typecheck and package tests with adapters mocked and network disabled. <!-- sdd-owner: implementation -->

**Verification:** `bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** None.
**Out-of-scope:** Workflow wiring and merge.
**Estimated:** 240–360 additions + deletions. Review: 25 min.

---

## PR 10E — Dependabot Workflow Hardening

```
main
  │
  ├── PR10D merged ✅
  │
  └── 📍 PR10E: Dependabot workflow (depends on PR10D)
       │
       └── PR10F: reusable action (depends on PR10E)
```

**Objective:** Replace auto-merge behavior with qualification/check annotation on the existing PR.
**Start state:** `.github/workflows/dependabot-auto-merge.yml` may merge automatically.
**End state:** It is replaced by `.github/workflows/dependabot-qualification.yml`, which qualifies, reports, and leaves every PR for human merge.

### Tasks

- [ ] **PR10E-T01 (RED):** Add workflow contract fixtures proving no auto-merge API/command, actor/PR identity checks, least privilege, structured file inputs, and qualification result annotation on the same PR. <!-- sdd-owner: implementation -->
- [ ] **PR10E-T02 (GREEN):** Replace `.github/workflows/dependabot-auto-merge.yml` with `.github/workflows/dependabot-qualification.yml`; remove merge capability and route evidence to the qualification policy. Passing leaves the existing PR open; failing emits a blocking check. <!-- sdd-owner: implementation -->
- [ ] **PR10E-T03 (TRIANGULATE):** Validate spoofed actor, fork PR, missing evidence, policy denial, and successful qualification. <!-- sdd-owner: implementation -->
- [ ] **PR10E-T04 (VERIFY):** Run `bun run workflows:validate`, package tests, and a literal search proving merge commands are absent. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; rollback MUST NOT restore auto-merge.
**Docs:** Workflow header explains human merge invariant.
**Out-of-scope:** Creating dependency PRs or merging them.
**Estimated:** 180–300 additions + deletions. Review: 20 min.

---

## PR 10F — Reusable Validation Action

```
main
  │
  ├── PR10E merged ✅
  │
  └── 📍 PR10F: reusable action (depends on PR10E)
       │
       └── PR10G: auto-healing workflow (depends on PR10F)
```

**Objective:** Provide a validation-only composite action with preflight and execute phases; preflight must run before model invocation, and neither phase owns publication authority.
**Start state:** CLI exists; no reusable action exists.
**End state:** `.github/actions/autonomous-change/action.yml` and its contract tests/README pass validation.

### Tasks

- [ ] **PR10F-T01 (RED):** Test `phase: preflight|execute`: preflight requires trigger and creates an owned context file/hash without response; execute requires trigger/response/context, rederives authority, and supports dry-run. Reject invalid phase/input combinations. <!-- sdd-owner: implementation -->
- [ ] **PR10F-T02 (GREEN):** Implement both phases using files/environment plus quoted argv. Emit bounded authority-context path/hash for same-job handoff and bounded manifest/candidate/outcome/error/correlation digests after execute. Context possession never skips live revalidation. <!-- sdd-owner: implementation -->
- [ ] **PR10F-T03 (TRIANGULATE):** Validate failed preflight prevents a model-call sentinel, edited/stale context fails before response read, shell-looking paths stay inert, and the action has no upload/publish/permission steps. <!-- sdd-owner: implementation -->
- [ ] **PR10F-T04 (VERIFY):** Run `bun run workflows:validate`, package tests, and root typecheck. <!-- sdd-owner: implementation -->
- [ ] **PR10F-T05 (DOCS):** Document two-phase invocation order, exact inputs/outputs, non-bearer context semantics, caller-owned permissions/artifacts, and non-publication guarantee. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** `.github/actions/autonomous-change/README.md`.
**Out-of-scope:** Artifact upload, attestation, branch push, PR creation.
**Estimated:** 200–320 additions + deletions. Review: 20 min.

---

## PR 10G — Auto-Healing Workflow Hardening

```
main
  │
  ├── PR10F merged ✅
  │
  └── 📍 PR10G: auto-healing workflow (depends on PR10F)
       │
       └── PR10H: SDD workflow (depends on PR10G)
```

**Objective:** Route verified reproducible CI failures through read-only generation and separately authorized publication.
**Start state:** `auto-healing.yml` has dead `FILES_COMMITTED`, hardcoded identity, direct copying, and unsafe publication behavior.
**End state:** The dead variable is removed; jobs exchange attested canonical artifacts; publication is normal push + PR only.

### Tasks

- [ ] **PR10G-T01 (RED):** Add workflow fixtures for authenticated original failure, clean-checkout reproduction, fingerprint mismatch, bad/missing attestation, protected path, generation failure, artifact mismatch, base drift, collision, and successful human-review PR creation. <!-- sdd-owner: implementation -->
- [ ] **PR10G-T02 (GREEN):** Add a read-only evidence job: authenticate the referenced original run/workflow/log through GitHub, select only an allowlisted failed step, rerun its exact command in a clean checkout at the same SHA, emit the canonical reproduction report, upload it, and attest its digest. No model call occurs before this succeeds. <!-- sdd-owner: implementation -->
- [ ] **PR10G-T03 (GREEN):** Harden generation. Remove `FILES_COMMITTED`, force-push, direct copying, and repository literals. Write trigger references, call action `preflight`, and only on pass call the model. Then call action `execute` with context + response and upload/attest patch, manifest, and diagnostics. <!-- sdd-owner: implementation -->
- [ ] **PR10G-T04 (GREEN):** Add the separate least-privilege publication job, gated on verified authority and exact artifact digest; rederive identity/base, atomically apply the canonical patch, normal-push one deterministic branch, and create one PR. <!-- sdd-owner: implementation -->
- [ ] **PR10G-T05 (TRIANGULATE):** Prove no evidence/generation failure reaches publication, no model runs before reproduction passes, and inputs reach processes only as files/environment plus quoted argv. <!-- sdd-owner: implementation -->
- [ ] **PR10G-T06 (VERIFY):** Run workflow validator, root typecheck, package tests, and forbidden-literal searches. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; fallback is disabled/proposal-only, never restoration of the unsafe workflow.
**Docs:** Workflow header documents authority split.
**Out-of-scope:** Scheduled maintenance and merge.
**Estimated:** 260–400 additions + deletions. Review: 30 min.

---

## PR 10H — Approved-SDD Workflow Hardening

```
main
  │
  ├── PR10G merged ✅
  │
  └── 📍 PR10H: approved-SDD workflow (depends on PR10G)
       │
       └── PR10I: skill and repository docs (depends on PR10H)
```

**Objective:** Route only explicitly approved SDD implementation through the same attested handoff and separate publisher.
**Start state:** `sdd-auto-implement.yml` is not bound to the new control plane.
**End state:** SDD approval authority, artifact identity, budgets, protected paths, and no-merge invariant are mechanically enforced.

### Tasks

- [ ] **PR10H-T01 (RED):** Add workflow fixtures for valid approval authority, missing/stale approval, changed SDD artifact after approval, protected path, budget overflow, digest mismatch, base drift, and valid PR publication. <!-- sdd-owner: implementation -->
- [ ] **PR10H-T02 (GREEN):** Harden `.github/workflows/sdd-auto-implement.yml`: write structured trigger/approval references, call action `preflight`, invoke the model only on pass, call `execute` with context + response, attest the handoff, and use separate least-privilege publication. Remove literal identity and force/direct-main paths. <!-- sdd-owner: implementation -->
- [ ] **PR10H-T03 (TRIANGULATE):** Prove failed/stale approval preflight prevents model invocation, final execution revalidates authority, and no failed validation can publish. Inputs use files/environment plus quoted argv only. <!-- sdd-owner: implementation -->
- [ ] **PR10H-T04 (VERIFY):** Run workflow validator, root typecheck, package tests, and forbidden-literal searches. <!-- sdd-owner: implementation -->

**Verification:** `bun run workflows:validate && bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy; safe fallback is disabled/proposal-only.
**Docs:** Workflow header documents approval authority.
**Out-of-scope:** Automatically approving SDD or merging its PR.
**Estimated:** 240–380 additions + deletions. Review: 30 min.

---

## PR 10I — Skill and Repository-Facing Documentation

```
main
  │
  ├── PR10H merged ✅
  │
  └── 📍 PR10I: skill and repository docs (depends on PR10H)
       │
       └── PR10J: policy documentation (depends on PR10I)
```

**Objective:** Teach operators and agents how to invoke the mechanical controls without implying that prose enforces them.
**Start state:** No control-plane skill or module documentation exists.
**End state:** Skill, registry, `AGENTS.md`, and orchestrator README are synchronized and linted.

### Tasks

- [ ] **PR10I-T01 (RED):** Add deterministic skill-contract checks for valid frontmatter, narrow triggers, evidence requirements, protected-path escalation, proposal-only fallback, reviewer workload, human merge, and explicit mechanical-enforcement disclaimer. <!-- sdd-owner: implementation -->
- [ ] **PR10I-T02 (GREEN):** Create `.agent/skills/autonomous-change-control/SKILL.md`; do not claim the skill itself enforces policy. <!-- sdd-owner: implementation -->
- [ ] **PR10I-T03 (VERIFY):** Run the documented skill-registry refresh procedure, verify exactly one registry entry points to the skill, and rerun its contract checks. <!-- sdd-owner: implementation -->
- [ ] **PR10I-T04 (DOCS):** Update `AGENTS.md` and `packages/drenyra-orchestrator/README.md` with capability boundaries, module map, CLI, authority split, and safe fallback. Include required freshness lines where repository convention requires them. <!-- sdd-owner: implementation -->
- [ ] **PR10I-T05 (VERIFY):** Run `bun run docs:verify`, `bun run lint:all`, root typecheck, and package tests. <!-- sdd-owner: implementation -->

**Verification:** `bun run docs:verify && bun run lint:all && bun run typecheck && bun run --filter @drenyra/orchestrator test`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** This slice is repository/operator documentation.
**Out-of-scope:** Product policy explanation and configuration reference.
**Estimated:** 220–360 additions + deletions. Review: 20 min.

---

## PR 10J — Policy and Configuration Documentation

```
main
  │
  ├── PR10I merged ✅
  │
  └── 📍 PR10J: policy documentation (depends on PR10I)
```

**Objective:** Publish auditable policy rationale and exact configuration reference under the project's documentation standards.
**Start state:** Code and workflows are complete; human policy/reference docs are missing.
**End state:** Policy and configuration docs pass docs-as-code checks and trace to the implemented requirements.

### Tasks

- [ ] **PR10J-T01 (DOCS):** Write `docs/control-plane/policy.md` as explanation: eligible triggers, protected/writable paths, budgets, autonomy modes, evidence, human approval/merge, receipts, Dependabot, rollback, and safe degradation. Include last-updated metadata and requirement links. <!-- sdd-owner: implementation -->
- [ ] **PR10J-T02 (DOCS):** Write `docs/control-plane/configuration.md` as reference for every field, required retention ownership, defaults, equal-or-stricter environment mode, examples, and invalid configurations. <!-- sdd-owner: implementation -->
- [ ] **PR10J-T03 (TRIANGULATE):** Cross-check every public config field and diagnostic code against source; verify docs never promise autonomous merge, protected-path override, immutable Git receipt, or skill-only enforcement. <!-- sdd-owner: implementation -->
- [ ] **PR10J-T04 (VERIFY):** Run `bun run docs:verify`, `bun run lint:all`, and link/coherence checks. <!-- sdd-owner: implementation -->

**Verification:** `bun run docs:verify && bun run lint:all`
**Rollback:** Open a human-reviewed revert PR using the actual merge strategy.
**Docs:** This slice is the policy/reference documentation boundary.
**Out-of-scope:** Canary full mode, automated learning, index restoration, schedules, and autonomous merge.
**Estimated:** 220–380 additions + deletions. Review: 20 min.

---

## Chain Diagram

```
main
  └─ PR1 → PR2 → PR2B → PR2C → PR2D → PR2E → PR3 → PR4 → PR5A → PR5B → PR6 → PR7A → PR7B → PR8A
       → PR8B → PR9A → PR9B → PR10A → PR10B → PR10C → PR10D → PR10E
       → PR10F → PR10G → PR10H → PR10I → PR10J
```

Every arrow means: predecessor merged by a human into `main`, successor rebased from the new `main`, and only then opened. No child targets an unmerged child branch under `stacked-to-main`.

---

## Parent Lifecycle Gate Records

These are non-task gate records; native task progress excludes human merge events. For each slice, finish source-mutating normalization, freeze the exact candidate, start one ordinary native review only when no valid receipt exists, follow its declared action, stage exactly reviewed paths without byte/mode changes, validate the same receipt at pre-commit, and let a human merge. Lifecycle gates never prescribe lenses or reopen review.

| Gate    | Slice | Verification                                                                        |
| ------- | ----- | ----------------------------------------------------------------------------------- |
| GATE-01 | PR1   | Diagnostics/config types, required repository identity, and input hashes            |
| GATE-02 | PR2   | Zod direct + lock-pinned; transport treats hostile text as inert data               |
| GATE-03 | PR2B  | Config/Git/GitHub identity cross-check; strict approval schema                      |
| GATE-04 | PR2C  | Pure artifact hasher; fixed-path Git-tree adapter; ancestor proof                   |
| GATE-05 | PR2D  | Eight SDD checks; native status and protection adapters fail closed                 |
| GATE-06 | PR2E  | Authenticated original CI evidence + valid attested reproduction only               |
| GATE-07 | PR3   | Pure path canonicalization + isolated filesystem authority adapter                  |
| GATE-08 | PR4   | Deny-first order; direct minimatch declaration without duplicate lock version       |
| GATE-09 | PR5A  | No stale owned root or Git worktree                                                 |
| GATE-10 | PR5B  | No write outside candidate; exact budget boundaries                                 |
| GATE-11 | PR6   | Deterministic diff and identity hashes across separate runs                         |
| GATE-12 | PR7A  | Non-self-referential manifest envelope                                              |
| GATE-13 | PR7B  | Every verifier is an existing argv contract with `shell: false`                     |
| GATE-14 | PR8A  | Live trigger authority passes before any model invocation; context is non-bearer    |
| GATE-15 | PR8B  | Authority is rederived before response read; handoff binding is complete            |
| GATE-16 | PR9A  | Failed patch check leaves no partial index/worktree delta                           |
| GATE-17 | PR9B  | Network-mocked tests; no force/direct-main path                                     |
| GATE-18 | PR10A | Validator limitation documented; syntax + repository contracts enforced             |
| GATE-19 | PR10B | Missing approval evidence fails receipt generation                                  |
| GATE-20 | PR10C | Receipt workflow never writes to `main`                                             |
| GATE-21 | PR10D | Every enabled Dependabot ecosystem and threshold semantics                          |
| GATE-22 | PR10E | Existing Dependabot PR remains human-merge-only                                     |
| GATE-23 | PR10F | Action exposes preflight/execute parity and owns no publication authority           |
| GATE-24 | PR10G | Reproduction and authority preflight precede model call; no unsafe publication path |
| GATE-25 | PR10H | Approval preflight binds exact SDD artifact revision and protected base evidence    |
| GATE-26 | PR10I | Skill registry and repository-facing docs cohere                                    |
| GATE-27 | PR10J | Docs verification, links, config fields, and diagnostic references                  |

---

## Explicit Phase 2 Follow-Up Boundaries

These are not v1 implementation tasks and require separate SDD changes.

| Item                                                               | Status                     |
| ------------------------------------------------------------------ | -------------------------- |
| Canary `full` mode in a disposable fixture repository              | Follow-up SDD              |
| Automated learning analysis from post-merge evidence               | Follow-up SDD              |
| `.codebase/index.yml` generation and drift enforcement restoration | Follow-up SDD              |
| Scheduled maintenance triggers                                     | Follow-up SDD              |
| Autonomous merge capability                                        | Rejected product invariant |

---

## Gate-Correction Record

- The plan forecasts **27** stacked-to-main slices and **6300–8900** changed lines; every slice has a hard 400-line review boundary.
- PR2B–PR2E separate identity/schema, approval evidence, SDD authority, and CI authority instead of hiding them in one oversized slice.
- Approval is non-self-referential. Only task checkbox progress is normalized; task content, requirements, design, or scope changes revoke approval.
- CI authority uses authenticated original GitHub run/workflow/log evidence plus one attested clean-checkout reproduction report. Caller fields, raw environment, and step conclusions alone cannot authorize.
- PR8A performs live trigger preflight before any model invocation. PR8B rederives authority before reading response content and returns `VerifiedCandidateHandoff`; PR9A alone constructs/applies `CanonicalPatch`.
- Parent lifecycle gates are records, not task checkboxes; native task progress never waits on an external merge event.
- Workflow validation precedes active workflow edits; Dependabot never auto-merges; receipts never mutate `main`; skills never claim enforcement.
- Strict TDD remains selected but PR0 blocks apply until config-versus-session metadata authority is explicitly resolved.

---

## Requirement Coverage Summary

| Slice group | Primary coverage                                                       |
| ----------- | ---------------------------------------------------------------------- |
| PR1–PR2E    | REQ-CCP-001–003, REQ-CCP-012–013, repository/approval/SDD/CI authority |
| PR3–PR4     | REQ-CCP-004 and REQ-POL-001–005 foundations                            |
| PR5A–PR7A   | REQ-CCP-005–007 and REQ-CCP-009–010                                    |
| PR7B–PR8B   | REQ-CCP-008 and REQ-DEL-006, including preflight-before-model parity   |
| PR9A–PR9B   | REQ-DEL-001–005 and REQ-POL-007                                        |
| PR10A–PR10C | REQ-CCP-011, receipt evidence, active-workflow validation              |
| PR10D–PR10E | REQ-POL-006 and Dependabot delivery behavior                           |
| PR10F–PR10H | REQ-DEL-001–002, REQ-DEL-006–007, and workflow authority               |
| PR10I–PR10J | REQ-DEL-008–009 and repository/operator documentation                  |

Full intended coverage: REQ-CCP-001 through REQ-CCP-013, REQ-POL-001 through REQ-POL-007, and REQ-DEL-001 through REQ-DEL-009.
