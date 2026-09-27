# Command Center Plugin Host Specification

## Purpose

Command Center MUST act as the host and composition layer for fiscal workspaces. It owns workspace context, user interface composition, profiles, bundles, plugin policy, and provider lifecycle. A released external accounting runtime MUST remain the sole authority for canonical missions, ledger entries, receipts, gates, approvals, and fiscal state. This specification defines the boundary without assuming unreleased provider APIs or behavior.

## Requirements

### Requirement: Host context and authority scope

The host MUST establish an authenticated context before activating a workspace or provider. The context MUST identify the organization, validated RUC, company, fiscal period, user or service principal, authorization scope, policy version, correlation identity, and host contract version. Every provider request, query, mutation, job, export, cache entry, profile, and bundle activation MUST be derived from that context.

The host MUST reject a context whose RUC is invalid, is not owned by the organization, or is outside the caller's authorization. Cross-RUC operations MUST require explicit authorization and auditable evidence. Providers MUST receive only the minimum context required for the requested capability.

#### Scenario: Scoped workspace activation

- GIVEN an authorized user selects a workspace for an organization, company, period, and valid RUC
- WHEN the host activates the workspace
- THEN it creates a provider context containing that scope and refuses requests that do not carry the same scope

#### Scenario: Cross-RUC access is denied

- GIVEN a request is authenticated for RUC A
- WHEN a plugin attempts to read or mutate data for RUC B without explicit authorization
- THEN the host denies the operation, records the denial, and exposes no data from RUC B

### Requirement: Versioned provider and plugin manifest

Every provider or plugin considered for discovery, activation, or replacement MUST expose a versioned manifest. The manifest MUST declare a stable identity, implementation version, provider contract versions, supported host compatibility range, requested capabilities, required scopes, trust metadata, lifecycle and health semantics, and conformance evidence references.

Provider-specific fields, endpoints, message shapes, and release identifiers MUST be treated as compatibility inputs until a released external artifact proves them. Repository source, local intent, an unreleased build, or an unverified mock MUST NOT establish an authoritative provider contract.

#### Scenario: Manifest validation precedes activation

- GIVEN a candidate manifest omits its contract version, required scope, or trust metadata
- WHEN the host evaluates the candidate
- THEN the host rejects activation and reports the missing compatibility evidence

#### Scenario: Released compatibility input is accepted

- GIVEN a manifest references a released provider contract and a host-compatible implementation version
- WHEN the referenced release and conformance evidence are verified
- THEN the host may continue to capability and policy evaluation

### Requirement: Capability, trust, and authority policy

The host MUST evaluate requested capabilities against an explicit policy before activation and before each privileged operation. Installation or discovery MUST NOT grant capability access. Capabilities MUST be granular, scope-bound, and deny-by-default.

A provider MUST NOT receive accounting authority merely by declaring a capability. Only the configured released accounting provider may write canonical missions, ledger state, receipts, gates, approvals, or fiscal state. The host MUST reject a configuration that creates a second canonical writer or permits a plugin to bypass approval, tenant, period, or provider isolation. Trust status and policy decisions MUST be auditable.

#### Scenario: Undeclared access is denied

- GIVEN a plugin is activated with read-only workspace capability
- WHEN it requests fiscal mutation, unrestricted secrets, or another tenant's context
- THEN the host denies the request and records the capability-policy decision

#### Scenario: Duplicate authority is rejected

- GIVEN a bundle declares two providers as writers of canonical ledger state
- WHEN the host validates the bundle
- THEN it rejects the bundle before activation and identifies the conflicting authority scope

### Requirement: Lifecycle and health are observable and safe

The host MUST expose observable lifecycle states for discovery, validation, initialization, ready, degraded, stopping, stopped, failed, and replacement. Health MUST distinguish provider availability, compatibility, authorization, and ability to perform read-only versus authoritative operations.

A provider that is partially initialized, unhealthy, incompatible, or ambiguous MUST NOT receive fiscal mutation capability. Restart and recovery MUST re-establish scoped context and policy before readiness is reported. Shutdown or replacement MUST prevent new operations and MUST settle or explicitly fail in-flight operations without fabricating completion.

#### Scenario: Partial initialization fails closed

- GIVEN a provider has passed discovery but has not completed contract, scope, and health checks
- WHEN a caller requests an authoritative fiscal operation
- THEN the host blocks the operation and reports the provider as not ready

#### Scenario: Restart requires revalidation

- GIVEN an active provider process restarts
- WHEN the host detects the restart
- THEN it marks the provider unavailable, revalidates its release, manifest, trust, scope, and health, and restores capabilities only after readiness

### Requirement: Deterministic profile and bundle resolution

A profile MUST resolve to a deterministic bundle containing pinned provider identities and versions, contract versions, granted capabilities, policy versions, configuration provenance, and the authority assignment. Resolution MUST be reproducible from the same profile, compatibility inputs, policy, and available releases.

The host MUST reject ambiguous, incompatible, incomplete, or unpinned resolutions before activation. A changed provider, policy, or contract input MUST produce a new bundle identity and an auditable activation decision. Rollback MUST select a previously compatible bundle without changing canonical fiscal state.

#### Scenario: Repeated resolution is identical

- GIVEN the same profile, released compatibility inputs, policy, and provider catalog
- WHEN the host resolves the profile twice
- THEN both resolutions produce the same bundle identity, versions, capabilities, authority assignment, and provenance

#### Scenario: Version skew blocks activation

- GIVEN a provider's contract version is outside the host's supported range
- WHEN the profile is resolved
- THEN resolution fails before activation and no provider operation is started

### Requirement: Accounting authority port preserves external ownership

The host MUST expose a narrow accounting-authority port through which it requests provider-owned mission status, ledger projections or references, gate and approval status, receipts, evidence, and fiscal errors. The port MUST transport authoritative results and references; it MUST NOT recreate the external runtime's mission state machine, ledger writer, gate evaluator, receipt issuer, or fiscal state transitions.

Authoritative mutations MUST be blocked unless the accounting provider is a verified released contract, the requested scope and capability are authorized, the applicable approval path is available, and receipt/conformance proof is current. Provider fallback MUST NOT silently change fiscal semantics.

#### Scenario: Read-only projection through the port

- GIVEN a resolved, healthy, released accounting provider and an authorized workspace
- WHEN the user requests fiscal status
- THEN the host displays the provider-owned projection with its authority reference, contract version, scope, and freshness

#### Scenario: Mutation is blocked without provider proof

- GIVEN the accounting provider is absent, unreleased, incompatible, or lacks current conformance evidence
- WHEN a caller requests a canonical fiscal mutation
- THEN the host rejects it without local state transition, local receipt, or alternate-provider substitution

### Requirement: Provenance and immutable receipts

Every authoritative status, evidence item, approval, projection, and receipt presented or cached by the host MUST retain its issuer, authority reference, contract version, provider version, tenant/RUC/company/period scope, correlation identity, ordering information, integrity information, and freshness where applicable.

Provider-issued receipts MUST be append-only and content-verifiable. Command Center MUST preserve and verify them but MUST NOT rewrite, re-sign, re-order, duplicate, or locally issue a receipt, mark a gate complete, or represent an unverified result as successful.

#### Scenario: Receipt integrity is preserved

- GIVEN the accounting provider returns an immutable receipt with integrity and provenance metadata
- WHEN the host stores and displays it
- THEN the metadata and content remain verifiable and a subsequent modification is rejected or detected

#### Scenario: Invalid evidence is not promoted

- GIVEN a provider result has missing provenance, invalid integrity, or an ordering conflict
- WHEN the host receives it
- THEN the host marks it unverifiable, does not present it as authoritative success, and records the failure

### Requirement: Persistence ownership and disposable projections

Host persistence MUST be limited to host-owned workspace identity, navigation and layout metadata, profiles, bundle selections, policy decisions, provider registry state, lifecycle observations, and disposable read models or caches. Provider persistence MUST remain owned by the provider contract, including canonical missions, ledger, receipts, gates, approvals, fiscal state, and provider memory.

Host and provider schemas, tables, object keys, caches, retention rules, and writers MUST be mechanically distinguishable and scope-enforced. A host projection MUST include authority reference, source contract/provider version, scope, and freshness, and MUST NOT be an alternate write path for canonical state.

#### Scenario: Projection cannot become authority

- GIVEN the host has a cached ledger projection
- WHEN a caller attempts to use that projection as the source for a fiscal mutation
- THEN the host rejects the operation and requires the external accounting authority

#### Scenario: Provider-owned data is not host-owned

- GIVEN a migration inventory identifies canonical receipts and mission state owned by the external runtime
- WHEN host persistence is reviewed
- THEN no host schema or object namespace is permitted to claim ownership or act as their writer

### Requirement: Fail-closed absence, skew, failure, and replacement

Provider absence, timeout, crash, health failure, version skew, trust failure, incompatible replacement, and ambiguous response MUST produce an explicit unavailable, degraded, or blocked result. The host MAY display a clearly marked stale read-only projection with source and freshness, but MUST NOT permit authoritative mutation or infer success.

Provider replacement MUST require compatibility and conformance checks, an authority and data handoff decision where applicable, audit evidence, and a rollback plan. Replacement MUST not replay approvals, rewrite receipts, duplicate ledger state, or activate a competing writer. Infrastructure failover MAY preserve equivalent storage behavior only when it does not alter accounting authority or semantics.

#### Scenario: Provider disappears during operation

- GIVEN an accounting provider becomes unavailable before an authoritative result is confirmed
- WHEN the host handles the failure
- THEN it reports the operation as unconfirmed or failed, preserves no fabricated receipt or completion, and blocks retry until authority status is known

#### Scenario: Replacement is rejected on semantic mismatch

- GIVEN a replacement provider passes connectivity but cannot prove compatible fiscal semantics or receipt continuity
- WHEN replacement is requested
- THEN the host rejects activation and retains the previous compatible bundle or a blocked state

### Requirement: Fiscal invariants and migration/deletion gates

All host/provider interactions MUST preserve exact Money representation with explicit currency, scale, and rounding rules; floating-point values MUST NOT cross a fiscal boundary. RUC validation and organization ownership MUST precede fiscal operations. Human and dual-approval requirements, including R2/R3 or equivalent provider gates, MUST remain intact and cannot be downgraded, replayed, or bypassed by the host or plugins.

Replacement, extraction, or deletion of a local implementation MUST be gated by an evidence-linked inventory of consumers and persistence; a released compatible contract; conformance evidence; one canonical writer; rehearsed migration, reconciliation, retention, and rollback; tested failure/recovery behavior; migrated consumers; and separate deletion approval. This specification authorizes no deletion by itself.

#### Scenario: Money and approval invariants hold

- GIVEN a fiscal request contains an exact amount, currency, scale, rounding policy, and an R2 approval requirement
- WHEN the host sends it to the accounting provider
- THEN the request preserves the exact representation and approval requirement, and the host cannot mark it complete without the provider's required approval evidence

#### Scenario: Deletion gate remains closed

- GIVEN a local mission or ledger implementation has no released replacement contract or rollback evidence
- WHEN deletion is proposed
- THEN the implementation remains a migration candidate and deletion is blocked

### Requirement: Conformance evidence and first-slice acceptance

The host MUST maintain executable or otherwise verifiable conformance evidence for manifest/version compatibility, capability and trust denial, tenant/RUC isolation, exact Money behavior, deterministic resolution, lifecycle recovery, provider failure, provenance and receipt integrity, persistence ownership, approval preservation, and no-duplicate-authority behavior.

The first implementation slice MUST demonstrate one read-only vertical workflow: select a scoped workspace and profile, resolve a pinned bundle, validate provider compatibility and health, and display one provider-owned mission or fiscal-status projection with provenance and freshness. If no suitable released accounting contract is available, the slice MUST expose an explicitly unavailable adapter or contract-validation fixture and MUST keep authoritative mutations blocked. No local competing state machine or deletion is acceptable as first-slice evidence.

#### Scenario: First slice succeeds safely

- GIVEN a valid tenant/RUC context, a deterministically resolved bundle, and a released provider with verified compatibility and health
- WHEN the user selects the profile and requests the read-only fiscal workflow
- THEN the host displays the provider-owned result with complete provenance and freshness and records the bundle decision

#### Scenario: First slice exposes missing release safely

- GIVEN no released compatible accounting provider contract is available
- WHEN the user selects the profile and requests fiscal status
- THEN the host shows an explicit unavailable state, records the missing proof, and blocks all authoritative mutations without substituting a mock or local authority
