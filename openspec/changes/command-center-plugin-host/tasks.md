# Implementation Tasks — Command Center Plugin Host

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | 1,200–2,000 total across 6–8 staged PRs; Slice 0 planning-only |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 Slice 0 evidence → PR 2 SDK/kernel → PR 3 profiles/bundles/runtime → PR 4 accounting read boundary → PR 5 host persistence/workspace → PR 6 consumer migration → PR 7 authoritative operations only after gates → PR 8 deletion approvals |
| Delivery strategy | ask-on-risk → chained PRs selected by human |
| Chain strategy | stacked-to-main |

Decision needed before apply: No — delivery and chain strategy resolved
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

## Execution Rules

- This plan is dependency-ordered and no task is complete at creation time.
- Current phase edits only `openspec/changes/command-center-plugin-host/`; later implementation edits occur in isolated `worktrees/<task-name>/` surfaces after delivery strategy and chain strategy are resolved.
- No task authorizes deletion, dependency changes, runtime configuration changes, sibling-repository edits, or modification of unrelated dirty files.
- Every work unit must leave tests/evidence green, record its owner and rollback boundary, and preserve `external-authority` as the only accounting authority decision.

## Slice 0 — Evidence baseline and ownership inventory (planning-only)

- [x] Build a machine-readable inventory at `openspec/changes/command-center-plugin-host/evidence/ownership-inventory.{md,json}` covering every relevant package, symbol, route, job, script, UI flow, table, migration, object prefix, cache, queue, credential, backup, restore path, reader, writer, retention rule, and test; classify each as `retain`, `adapt`, `extract`, `replace`, `quarantine`, or `delete-candidate`, with current/target owner, authority category, scope fields, consumers, evidence links, and rollback dependencies. <!-- sdd-owner: implementation -->
- [x] Capture the package/export/dependency graph from `package.json`, `turbo.json`, `apps/web`, `apps/api`, `packages/pi/src/plugin/`, `packages/ai`, workspace packages, mission/ledger/receipt/gate packages, `packages/persistence`, and `packages/infrastructure`; record all sunset-authority imports and approved compatibility seams in `evidence/dependency-inventory.md`. <!-- sdd-owner: implementation -->
- [x] Reclassify existing tests under `packages/domain`, `packages/mission-domain`, workspace packages, fiscal packages, and relevant API/UI suites into ownership-neutral invariant evidence versus implementation-shape evidence; preserve links and baseline results in `evidence/conformance-baseline.md`. <!-- sdd-owner: implementation -->
- [x] Verify available released external accounting artifacts and compatibility ranges through a release-verification fixture/record in `evidence/release-verification.md`; distinguish `verified`, `rejected`, and `unavailable`, and reject repository source, unreleased builds, prose, and production mocks as authority proof. <!-- sdd-owner: implementation -->
- [x] Record the explicit migration freeze in `evidence/migration-gates.md`: no new local mission, ledger, receipt, gate, approval, memory, or fiscal-state writers; no deletion; unknown/conflicting assets default to quarantine. <!-- sdd-owner: implementation -->

## Slice 1 — Host contracts and policy kernel

- [ ] Create the initial public contract surfaces under `packages/plugin-sdk/src/` for schema-versioned `HostContext`, validated RUC/scope grants, manifests, capabilities, trust metadata, lifecycle observations, health, provenance, authority categories, provider results, and stable error codes; preserve unknown fields without granting behavior. <!-- sdd-owner: implementation -->
- [ ] Add `packages/plugin-sdk/__tests__/` contract tests for invalid manifest rejection, missing release/scope/trust evidence, unknown-field preservation, exact fiscal-value serialization, and RUC checksum/organization ownership validation using `sunat/ruc.ts` utilities where applicable. <!-- sdd-owner: implementation -->
- [ ] Create pure host policy and ports under `packages/kernel/src/`, including `AccountingAuthorityPort`, capability admission, context narrowing, authority assignment, provenance validation, and mutation admission; omit local mission transitions, ledger writers, gate evaluators, approval completion, and receipt issuance. <!-- sdd-owner: implementation -->
- [ ] Add `packages/kernel/__tests__/` RED/GREEN/TRIANGULATE/REFACTOR coverage for cross-RUC denial and audit evidence, least privilege, deny-by-default capability policy, duplicate canonical-writer rejection, approval non-bypass, exact Money/currency/scale/rounding transport, and projection write rejection. <!-- sdd-owner: implementation -->
- [ ] Add package manifests/exports and package-level `build`, `typecheck`, `test`, `lint`, and relevant `conformance` scripts for `packages/plugin-sdk` and `packages/kernel`; register only package tasks in `turbo.json` with declared `workspace:*` dependencies and no internal `src/` imports. <!-- sdd-owner: implementation -->

## Slice 2 — Profiles, bundles, lifecycle runtime, and release seam

- [ ] Implement validated profile intent and immutable provider catalog contracts in `packages/profiles/src/` and `packages/bundles/src/`; produce canonical, content-addressed `BundleLock` identities with pinned provider/contract versions, capabilities, policy, authority assignments, and provenance. <!-- sdd-owner: implementation -->
- [ ] Add `packages/profiles/__tests__/` and `packages/bundles/__tests__/` property/golden tests proving deterministic repeated resolution, order independence, stable bundle IDs, missing-pin/ambiguity/version-skew rejection, dependency-cycle rejection, policy-version invalidation, and duplicate-authority rejection. <!-- sdd-owner: implementation -->
- [ ] Implement `ReleaseEvidenceVerifier` and `ContractCompatibilityVerifier` seams under `packages/plugin-runtime/src/release/`, plus `providers/accounting-authority/src/UnavailableAccountingAuthorityAdapter.ts` and contract-validation fixtures; ensure unavailable evidence never returns authoritative success or registers production authority. <!-- sdd-owner: implementation -->
- [ ] Implement lifecycle supervision under `packages/plugin-runtime/src/` for discovery, validation, initialization, ready, degraded, stopping, stopped, failed, and replacement; revoke grants on restart, separate read/mutation health, quiesce before replacement, settle in-flight work as unconfirmed, and stop in reverse dependency order. <!-- sdd-owner: implementation -->
- [ ] Add `packages/plugin-runtime/__tests__/` and release-seam tests for partial initialization, crash/timeout, restart revalidation, capability revocation, replacement without concurrent writers, ambiguous responses, stale read-only results, and failed/unavailable/rejected release evidence. <!-- sdd-owner: implementation -->

## Slice 3 — First read-only accounting vertical slice

- [ ] Implement the accounting adapter boundary under `packages/providers/accounting-authority/` with private external DTO translation, verified-release binding, provenance/integrity/order/freshness validation, and an explicitly unavailable result when no released compatible contract exists; do not expose production mutation wiring. <!-- sdd-owner: implementation -->
- [ ] Compose one host-owned read workflow under `packages/host/src/` that activates one organization/RUC/company/period workspace, resolves one profile/bundle, checks release/capability/health, calls only `AccountingAuthorityPort.getFiscalStatus` or `getMissionProjection`, and records the bundle decision without invoking local authority state machines. <!-- sdd-owner: implementation -->
- [ ] Add the first trusted read-only extension at `packages/plugins/fiscal-status-panel/` only after SDK capability enforcement is executable; it may render provider-owned status and provenance but may not access persistence, secrets, or fiscal mutation. <!-- sdd-owner: implementation -->
- [ ] Add thin transport/composition seams under `packages/server/src/`, `packages/client/src/`, and `packages/ui/src/` for authenticated context mapping, projection DTOs, issuer/authority/contract/scope/freshness display, and explicit unavailable/degraded/stale/unverifiable states; omit mutation endpoints and local completion controls in this slice. <!-- sdd-owner: implementation -->
- [ ] Add vertical integration tests in `packages/host/__tests__/`, `packages/server/__tests__/`, `packages/client/__tests__/`, `packages/ui/__tests__/`, and `packages/providers/accounting-authority/__tests__/` proving both a verified released-provider projection and the no-release unavailable path, including no local mission/ledger/gate/receipt call and blocked authoritative mutation. <!-- sdd-owner: implementation -->

## Slice 4 — Persistence separation and workspace composition

- [ ] Adapt proven workspace behavior behind `packages/workspace/src/` using evidence from `packages/workspace-domain`, `workspace-application`, `workspace-contracts`, `workspace-control`, `workspace-projections`, and `workspace-layout`; add activated validated RUC/company/period scope, revisioned host metadata, forward-compatible readers, and no provider-authority ownership. <!-- sdd-owner: implementation -->
- [ ] Define host persistence ports and isolated namespaces in `packages/providers/postgres/`, `packages/providers/object-storage/`, and `packages/host/src/persistence/` for profiles, catalog snapshots, bundle locks, activations, lifecycle observations, policy decisions, audit records, and disposable projections; document concrete schema/object-prefix ownership in `evidence/persistence-ownership.md`. <!-- sdd-owner: implementation -->
- [ ] Add persistence tests/static checks proving `cc_host` (or the approved host namespace) and `host/<organization>/<ruc>/...` keys are RUC-scoped, projections carry authority/source/version/freshness metadata, credentials are bounded, and host code cannot write provider-owned missions, ledgers, receipts, gates, approvals, fiscal state, or memory. <!-- sdd-owner: implementation -->
- [ ] Rehearse expand/migrate/verify/contract migration and projection rebuild for one workspace/profile cohort in `evidence/migration-rehearsal.md`; prove rollback to the prior host bundle without modifying, rewinding, duplicating, or replaying provider canonical state. <!-- sdd-owner: implementation -->

## Slice 5 — Consumer migration and composed providers

- [ ] Move one read-only web/API consumer, one job or CLI path, and one UI flow from existing local calls to `packages/host` or a bounded compatibility adapter; record adapter owner, capability, consumer list, telemetry, expiry/removal criterion, and ensure no new sunset-internal imports. <!-- sdd-owner: implementation -->
- [ ] Add static package-boundary checks for core-to-adapter, UI-to-provider, package-internal path, provider-to-provider, and new-host-to-sunset-authority imports; validate workspace dependencies and Turborepo affected task behavior without root task logic. <!-- sdd-owner: implementation -->
- [ ] Add provider adapter seams under `packages/providers/drenyra-ai/`, `drenyra-engram/`, `drenyra-pi/`, `guardian/`, `postgres/`, and `object-storage/` only when each released contract is independently verified; otherwise retain an unavailable/quarantined candidate and no authority grant. <!-- sdd-owner: implementation -->
- [ ] Run the accounting provider TCK and repository conformance suite against every accounting candidate, covering RUC/tenant isolation, exact BigInt/integer Money and explicit rounding, deterministic fiscal results, immutable receipt digest/signature/order/provenance, R2/R3 human/dual approval, no duplicate authority, namespace isolation, and all failure/recovery cases. <!-- sdd-owner: implementation -->

## Slice 6 — Authoritative operations, rollout, and rollback (gated; later work)

- [ ] Define a separate admission work unit for the first authoritative command in `packages/kernel/`, `packages/host/`, and the verified accounting adapter, requiring released contract, current conformance, exact Money, scope/capability, approval-path, idempotency, receipt-continuity, authority-binding, and failure-reconciliation evidence; keep the operation blocked until every gate is green. <!-- sdd-owner: implementation -->
- [ ] Add negative and fault-injection tests for provider disappearance, timeout, crash/restart, ambiguous acknowledgement, unconfirmed mutation, approval replay/downgrade/bypass, receipt mutation/reissue, semantic fallback, and second-writer activation; assert no local state transition or fabricated success. <!-- sdd-owner: implementation -->
- [ ] Roll out the approved bundle by organization/RUC cohort with immutable activation and rollback pointers; verify health and audit evidence, preserve the previous non-concurrent adapter for rollback, and document support/runbook evidence under `openspec/changes/command-center-plugin-host/evidence/rollout-rollback.md`. <!-- sdd-owner: implementation -->

## Separate deletion approvals (never implied by migration)

- [ ] For each `delete-candidate` in `evidence/ownership-inventory.{md,json}`, assemble a deletion packet containing inventory, released replacement proof, conformance/TCK results, authority proof, data/reconciliation/retention/restore rehearsal, operational failure evidence, migrated consumers, observability, and rollback clearance; leave the candidate quarantined when any item is missing. <!-- sdd-owner: implementation -->
- [ ] Obtain and record a separate human deletion approval for each candidate in `evidence/deletion-approvals.md`; only a later, explicitly authorized work unit may remove source, dependencies, schemas, objects, or compatibility adapters, and that work unit must include post-deletion boundary and rollback verification. <!-- sdd-owner: parent -->

## Parent-owned lifecycle gates

- [x] Before apply, resolve `ask-on-risk`: human selected chained PRs with `stacked-to-main`; no size exception is approved. <!-- sdd-owner: parent -->
- [ ] After each implementation slice, start or reuse the bounded review for that exact candidate and record the review/evidence outcome before advancing to the next slice. <!-- sdd-owner: parent -->
- [ ] Before archive, confirm no deletion occurred in the first slice, all applicable migration gates have evidence, final task status matches implementation, and architecture/product/operations documentation is updated only from proven deployed contracts. <!-- sdd-owner: parent -->
