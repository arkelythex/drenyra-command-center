# Proposal — Command Center Plugin Host

## Decision

Adopt an **external-authority host architecture**. Drenyra Command Center owns the user-facing workspace and composition experience; a released external accounting runtime remains the sole authority for canonical missions, ledger entries, receipts, gates, and fiscal state through versioned contracts.

This is a deliberate product-boundary reset, not an incremental refactor. Existing assets are retained only when tests or versioned contracts prove that they fit the new ownership model. Deletion and reconstruction are permitted after explicit migration gates pass.

## Intent and problem

Command Center currently combines strong workspace and fiscal primitives with local AI, Pi, plugin, mission, receipt, gate, and persistence behavior. At the same time, existing architecture documents assign several of those authorities to external runtimes. This creates an unsafe and difficult-to-explain boundary: retaining both local and external implementations can produce divergent fiscal state, duplicated receipts, conflicting approvals, and unclear tenant ownership.

The change establishes Command Center as a host and composition layer inspired by DeepSeek Harness:

- Command Center provides workspace, UI, profiles, bundles, plugin policy, and provider composition.
- Drenyra AI, Drenyra Engram, Drenyra Pi, Guardian, Postgres, object storage, and the external accounting runtime are integrated through explicit provider contracts.
- Provider capabilities are composed without importing their internal authority into the host.
- Canonical accounting state has exactly one owner.

## Users and product outcome

### Target users

- Accountants and fiscal operators who need one coherent workspace for fiscal workflows.
- Organization administrators who select profiles, bundles, providers, and policy.
- Compliance and audit users who inspect approvals, evidence, gates, and immutable receipts.
- Maintainers who integrate or replace providers without rewriting the Command Center product surface.

### Outcome

Users experience a stable Command Center workspace even as provider implementations evolve. Profiles resolve to deterministic provider bundles; provider health and incompatibility are visible; fiscal actions fail safely when authority is unavailable; and every authoritative fiscal result remains traceable to the external runtime that produced it.

## Ownership boundaries

| Area | Canonical owner | Command Center responsibility |
| --- | --- | --- |
| Workspace identity, navigation, UI state, and layout metadata | Command Center | Create and render tenant/RUC-scoped workspaces; persist host-owned presentation state. |
| Profiles, bundles, provider selection, and activation policy | Command Center | Resolve deterministic compositions, enforce compatibility and capability policy, and record provenance. |
| Plugin/provider registry and lifecycle | Command Center | Validate manifests, establish scoped context, monitor health, and prevent unauthorized capabilities. |
| Missions and mission transitions | External accounting runtime | Request operations and render authoritative status; never recreate the mission state machine. |
| Ledger and canonical fiscal state | External accounting runtime | Consume versioned projections or references; never write a competing ledger. |
| Gates and approval state | External accounting runtime | Present approval requests and submit authenticated human decisions; never bypass or locally mark gates complete. |
| Receipts and fiscal evidence ordering | External accounting runtime | Preserve, display, and verify provider-issued immutable receipts without reissuing them. |
| AI execution | Drenyra AI provider | Supply scoped requests and consume results under host policy; do not absorb AI orchestration authority. |
| Memory | Drenyra Engram provider | Select and scope memory capabilities; do not duplicate canonical provider memory. |
| Operator/runtime execution | Drenyra Pi provider | Compose approved execution capabilities without importing Pi's runtime authority into the host kernel. |
| Verification and protection | Guardian provider | Invoke and display provider-owned verification evidence without fabricating approval. |
| Relational and object persistence | Postgres and object-storage providers | Persist only data assigned by contract; enforce separate host and authority namespaces and access policy. |

Host-owned caches and read models are disposable projections. They must carry authority references, source contract versions, tenant/RUC scope, and freshness information, and must never become an alternate write path for canonical fiscal state.

## Fiscal and security invariants

These invariants apply during migration and after the reset:

1. **No duplicate authority:** one released external accounting runtime is the sole writer of canonical missions, ledger, receipts, gates, and fiscal state for a configured authority scope. The host must reject configurations or writes that introduce a second owner.
2. **Tenant and RUC isolation:** every host context, provider request, query, mutation, job, export, object key, cache entry, profile, and bundle activation is scoped to the authenticated organization and validated RUC. Cross-RUC access requires explicit authorization and audit evidence.
3. **Money correctness:** monetary values use an exact versioned representation such as integer minor units or `BigInt`; floating-point fiscal calculations are prohibited. Currency, scale, and rounding rules cross provider boundaries explicitly.
4. **Immutable receipts:** provider-issued receipts are append-only, content-verifiable, attributable to the issuing authority and contract version, and cannot be rewritten by Command Center.
5. **Human approval:** R2/R3 or equivalent fiscal gates retain required human or dual approval. Plugins and providers cannot self-approve, downgrade, replay, or bypass an approval requirement.
6. **Deterministic fiscal behavior:** identical authoritative inputs, policy version, contract version, and provider version must produce reproducible fiscal decisions or a declared, auditable incompatibility. Provider fallback must never silently alter fiscal semantics.
7. **Least privilege:** a provider receives only declared capabilities and the minimum tenant/RUC/company/period context needed for an operation. Capability denial is fail-closed.
8. **Evidence provenance:** authoritative status, evidence, approvals, receipts, and projections retain issuer, contract version, correlation identity, ordering, and integrity metadata across host boundaries.
9. **Released-contract requirement:** no external provider is treated as authoritative based on repository intent alone. Its released versioned contract, compatibility range, and conformance evidence must be available and validated first.

## Provider and plugin principles

- **Contract first:** each provider exposes a versioned manifest, contract version, implementation version, capabilities, required scopes, lifecycle hooks, health semantics, and compatibility range.
- **Ports over internals:** Command Center depends on host-owned ports and provider contracts, not provider source layout or internal package paths.
- **Capability-based access:** plugins request named, granular capabilities. Installation does not imply activation, and activation does not imply unrestricted workspace or persistence access.
- **Deterministic composition:** a profile resolves to a pinned bundle of provider identities, versions, capabilities, policy versions, and configuration provenance. Resolution is reproducible and validated before activation.
- **Explicit lifecycle:** discovery, validation, initialization, readiness, degraded operation, shutdown, and replacement have observable states. Partial initialization cannot expose fiscal mutation capabilities.
- **Fail closed for authority:** an absent, unhealthy, incompatible, or ambiguous accounting provider blocks authoritative fiscal mutations. Read-only stale projections may be shown only with visible source and freshness status.
- **No semantic fallback:** infrastructure failover may preserve equivalent storage behavior, but fiscal authority cannot fail over to a different implementation unless compatibility, continuity, and single-authority transfer are explicitly proven.
- **Provider-owned evidence:** the host transports and presents evidence; it does not synthesize successful receipts, gates, or verification outcomes.
- **Isolation by construction:** provider adapters cannot bypass host policy to reach another tenant, RUC, company, period, provider namespace, or unrestricted secret set.
- **Replaceability with accountability:** provider replacement requires compatibility checks, state/authority handoff where applicable, audit records, and a rollback plan.

## Scope

### In scope

- Define the host kernel boundary for workspace, UI composition, profiles, bundles, plugin policy, provider registry, and provider lifecycle.
- Define the minimum provider contract: identity, version negotiation, capabilities, scoped context, lifecycle, health, errors, evidence provenance, and trust metadata.
- Define a dedicated accounting-authority port that exposes external canonical missions, ledger projections, receipts, gates, and fiscal status without local reimplementation.
- Define provider adapters for Drenyra AI, Drenyra Engram, Drenyra Pi, Guardian, Postgres, and object storage as composition targets, while keeping their specific contracts provisional until released artifacts are verified.
- Separate host persistence from provider-owned persistence and document ownership for schemas, tables, objects, caches, and retention.
- Inventory existing packages, routes, jobs, scripts, UI flows, and persisted data by owner: retain, adapt, extract, replace, or delete.
- Establish compatibility, migration, deletion, and rollback gates.
- Preserve proven workspace, fiscal, RUC, Money, receipt, approval, and conformance assets where they remain valid under the new boundary.

### Affected areas

- Workspace domain, application, contracts, control, projections, and layout packages.
- Web and API composition paths that currently call local AI, Pi, mission, gate, receipt, ledger, or persistence behavior.
- Existing plugin concepts under `packages/pi/src/plugin/` as evidence for extraction, not as an approved host ABI.
- Local AI/Pi orchestration and fiscal runtime packages that may duplicate external ownership.
- Host and provider persistence namespaces in Postgres and object storage.
- Architecture, product, operational, and migration documentation after implementation decisions are proven.
- Turborepo package boundaries and dependency direction for future host/provider packages.

## Non-goals

- Implementing, vendoring, or reconstructing the external accounting runtime inside Command Center.
- Assuming that any external AI, Engram, Pi, Guardian, Postgres, object-storage, or accounting contract is stable merely because a local implementation or document exists.
- Deleting local authority implementations before equivalent released contracts, conformance evidence, data ownership, and rollback paths are proven.
- Replacing the entire UI or workspace layout in the first slice.
- Building an unrestricted third-party plugin marketplace, arbitrary code sandbox, or hot-unload system in the first slice.
- Changing fiscal rules, approval thresholds, SUNAT semantics, receipt meaning, or tenant/RUC policy as part of the architectural reset.
- Providing automatic fiscal-provider fallback that can change canonical outcomes.
- Migrating all routes, jobs, data, and providers in one release.

## Migration and deletion gates

Migration proceeds by capability and authority seam, not by package name alone.

Before a local implementation can be replaced or deleted, all applicable gates must pass:

1. **Inventory gate:** every dependent route, UI flow, job, script, schema/table/object namespace, import, and operational procedure is mapped to a target owner.
2. **Released-contract gate:** the replacement provider contract exists as a released, versioned artifact with an explicit compatibility range; intent or unreleased source is insufficient.
3. **Conformance gate:** current invariant tests and provider contract tests prove tenant/RUC isolation, Money representation, deterministic fiscal behavior, approval rules, receipt integrity, evidence provenance, and failure behavior.
4. **Authority gate:** there is one documented writer for each canonical state category, and attempts to configure or invoke duplicate authority are rejected.
5. **Data gate:** migration, projection rebuild, reconciliation, retention, and rollback procedures are rehearsed against representative data without cross-RUC leakage or receipt mutation.
6. **Operational gate:** provider absence, version skew, partial initialization, timeout, crash/restart, replacement, and degraded read behavior have observable and tested outcomes.
7. **Consumer gate:** affected UI/API consumers use the new host port or a bounded compatibility adapter; no new dependency on sunset internals is allowed.
8. **Rollback gate:** the previous compatible host release and provider bundle can be restored without reverting canonical fiscal state or creating a second authority.
9. **Deletion approval gate:** deletion is separately reviewed after the preceding evidence is recorded. This proposal alone authorizes no deletion.

Assets without sufficient proof are quarantined as migration candidates rather than automatically preserved. Assets with proven contracts may be adapted, but proof of current behavior does not automatically prove suitability as a host ABI.

## First implementation slice

Deliver a narrow **host-kernel and accounting-provider contract slice** before broader extraction:

1. Define host-owned types and policies for scoped workspace context, provider manifests, capabilities, lifecycle state, compatibility negotiation, profiles, and deterministic bundle resolution.
2. Define an accounting-authority port that represents provider-owned mission status, ledger projections, gates, receipts, evidence, and fiscal errors as references and immutable results—not local state machines.
3. Add one adapter boundary for a released external accounting runtime. If no suitable released contract is available, deliver a contract-validation fixture and an explicitly unavailable adapter; do not invent or promote a mock as production authority.
4. Route one read-only vertical workflow through the host kernel: select a tenant/RUC-scoped workspace and profile, resolve the pinned provider bundle, validate provider compatibility/health, and display one provider-owned mission or fiscal-status projection with provenance and freshness.
5. Prove that authoritative mutations remain blocked in this slice unless the released provider contract, approval path, and receipt behavior pass conformance gates.
6. Produce the ownership inventory and classify existing local AI, Pi, mission, gate, receipt, ledger, persistence, and plugin assets as retain/adapt/extract/replace/delete candidates. Perform no deletion in this slice.

This slice creates a real architectural seam while minimizing the risk of migrating canonical state before external contracts are proven.

## Acceptance outcomes and success criteria

The proposal is successful when the first slice demonstrates all of the following:

- A reviewer can identify one canonical owner for every mission, ledger, receipt, gate, and fiscal-state operation in scope.
- Command Center can resolve the same pinned profile and bundle deterministically from the same inputs and reject incompatible or ambiguous provider compositions.
- Provider manifests and requests carry validated tenant/RUC scope, version information, capabilities, and provenance.
- A read-only fiscal projection can be displayed through the accounting-authority port without importing or invoking a local competing state machine.
- Missing, unhealthy, incompatible, or unreleased accounting providers result in an explicit unavailable/degraded state and block authoritative mutations.
- The host cannot fabricate, rewrite, or locally complete provider-owned receipts, gates, approvals, ledger entries, or mission transitions.
- Exact Money representation crosses the contract without floating-point conversion, and conformance vectors verify scale and rounding behavior.
- Receipt integrity, human approval requirements, deterministic behavior, and cross-RUC denial are covered by executable contract tests.
- Host-owned persistence and provider-owned persistence are documented and mechanically distinguishable, including Postgres schemas/namespaces and object-storage keys.
- Existing assets have an evidence-linked ownership classification, and no deletion occurs without every applicable deletion gate.
- Rollback restores a previously compatible host/provider bundle without rolling back or duplicating canonical fiscal state.

## Risks and unresolved questions

| Risk or unknown | Severity | Required resolution |
| --- | --- | --- |
| No released external accounting contract has yet been proven available or compatible. | Critical | Verify released artifacts and contract tests before enabling any authoritative operation or deleting local behavior. |
| Local and external mission, ledger, receipt, gate, or approval implementations may overlap during migration. | Critical | Enforce the no-duplicate-authority rule at configuration and invocation boundaries; migrate one seam at a time. |
| Provider plugins may escalate capability or cross tenant/RUC/company/period boundaries. | High | Define granular capabilities, scoped credentials, isolation tests, audit evidence, and fail-closed defaults. |
| Existing persistence ownership is not fully inventoried. | High | Map every schema, table, object prefix, cache, retention rule, and writer before migration. |
| Provider version skew or replacement may change fiscal semantics. | High | Pin bundles, validate compatibility and conformance, and prohibit silent semantic fallback. |
| Existing local tests prove behavior but may encode the wrong ownership boundary. | High | Separate invariant/conformance evidence from implementation-shape tests before deciding reuse. |
| Plugin lifecycle behavior for partial initialization, restart, unload, and crash is unproven. | High | Specify observable lifecycle states and test failure/recovery before granting mutation capabilities. |
| Host projections may accidentally become writable shadow state. | High | Make projections disposable, source-attributed, freshness-aware, and write-protected by architecture and tests. |
| UI and layout migration may invalidate stored workspace metadata. | Medium | Version host-owned schemas and prove forward migration and rollback with representative layouts. |
| Package extraction may create cross-package imports or task-graph drift. | Medium | Preserve declared workspace dependencies and enforce package boundaries through the Turborepo graph. |
| Trust and sandbox expectations for future third-party plugins remain undefined. | Medium | Keep the first slice to trusted, explicitly configured providers; specify broader sandboxing separately. |

## Rollback strategy

- Profile and bundle activation is versioned and auditable; rollback selects the last known compatible host/provider bundle rather than mutating canonical fiscal state.
- Host schema changes require reversible migrations or forward-compatible readers before activation.
- Compatibility adapters remain bounded and read-only where possible until replacement contracts pass conformance and operational gates.
- A failed provider migration disables the new adapter and restores the previous host composition. It must not replay approvals, rewrite receipts, reverse ledger state, or activate a local competing authority.
- Deletions occur only after rollback no longer depends on the candidate asset and after a separately approved deletion gate. Until then, sunset code may be isolated and blocked from new use rather than removed.

## Next step

Create normative specifications for the host/provider contract, ownership and persistence boundaries, profile/bundle resolution, fiscal/security invariants, lifecycle failures, and migration/deletion gates. Keep provider-specific API details provisional until released external contracts are inspected and proven compatible.
