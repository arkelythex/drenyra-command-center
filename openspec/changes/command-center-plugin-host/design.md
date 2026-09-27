# Technical Design — Command Center Plugin Host

## Decision summary

Command Center will become an **external-authority financial application host**. The host owns authenticated workspace context, profiles, deterministic bundles, plugin/provider policy, lifecycle, UI composition, and host-owned persistence. A verified released external accounting runtime remains the sole writer of canonical missions, ledger state, receipts, gates, approvals, and fiscal state.

This is the target architecture, not a promise to preserve the current package layout. Existing code is migration evidence. It is retained, adapted, extracted, replaced, quarantined, or deleted only after the evidence gates in this design pass.

The first implementation slice is deliberately read-only: establish the host kernel and contracts, resolve one pinned bundle, validate one accounting-provider candidate through release-verification seams, and render one authoritative fiscal-status projection or an explicit unavailable state. No production mock, local authority fallback, or deletion is allowed in that slice.

## Architectural principles

1. **One accounting authority per scope.** A bundle has exactly one accounting-authority assignment for an organization/RUC/company/period scope. The host rejects zero or multiple writers whenever an authoritative operation is requested.
2. **Ports, not provider internals.** Host code depends on host-owned ports and versioned transport contracts. It does not import provider source trees or infer APIs from repository intent.
3. **Activation is not authority.** Discovery, installation, validation, and readiness do not grant capabilities. Every privileged call is checked against the active bundle, scope, policy, provider health, and release evidence.
4. **Exact fiscal transport.** Money crosses boundaries as integer minor units or an equivalent exact versioned representation with currency, scale, and rounding policy. JavaScript numbers are forbidden for fiscal amounts.
5. **Provider evidence stays provider evidence.** The host verifies, transports, caches, and presents authority results; it never creates, re-signs, reorders, completes, or semantically substitutes receipts, gates, approvals, missions, or ledger entries.
6. **Deterministic composition.** Profile resolution consumes explicit immutable inputs and emits a content-addressed bundle lock. Ambient time, registry ordering, and network discovery cannot change a resolution result.
7. **Fail closed, explain clearly.** Absence, skew, ambiguity, partial initialization, unverifiable provenance, or unknown mutation outcome blocks authoritative work. Stale projections are read-only and visibly stale.
8. **Migration by ownership seam.** Packages are not migrated wholesale. Symbols, routes, jobs, schemas, object prefixes, and tests are classified by authority and capability.

## Target package topology

The target is a set of Turborepo workspace packages with explicit public exports. Package names below are architectural names; final package creation remains implementation work.

```text
packages/
  host/                       # Composition facade and application use cases
  kernel/                     # Pure host policy, ports, lifecycle decisions
  plugin-sdk/                 # Stable plugin/provider contracts and schemas
  plugin-runtime/             # Discovery, validation, activation, supervision
  profiles/                   # Profile model and validation
  bundles/                    # Deterministic resolver and bundle lock model
  client/                     # Browser/CLI-safe host API client contracts
  server/                     # HTTP/transport adapter and bootstrap composition
  ui/                         # Host shell, slots, status/degraded presentation
  workspace/                  # Host-owned workspace aggregate and activation
  plugins/
    fiscal-status-panel/      # First trusted read-only host extension
    ...                       # Future trusted host extensions
  providers/
    accounting-authority/     # External accounting-runtime adapter boundary
    drenyra-ai/               # AI capability adapter
    drenyra-engram/           # Memory capability adapter
    drenyra-pi/               # Operator execution adapter
    guardian/                 # Verification evidence adapter
    postgres/                 # Host-persistence/infrastructure adapter
    object-storage/           # Host-object/infrastructure adapter
```

Nested `packages/plugins/*` and `packages/providers/*` become workspace globs only when those directories contain independently versioned packages. The root workspace remains orchestration-only; build, typecheck, lint, test, and conformance scripts live in each package and are registered in `turbo.json`. Packages declare `workspace:*` dependencies and never reach into another package's `src/` tree.

### Package responsibilities

| Package | Owns | Must not own |
| --- | --- | --- |
| `packages/plugin-sdk` | Manifest, capability, trust, scoped-context, lifecycle observation, health, provenance, and provider-result schemas | Runtime loading, provider credentials, fiscal state machines |
| `packages/kernel` | Host policies, provider ports, accounting-authority port, authority-conflict checks, operation admission, lifecycle transition rules | Transport clients, database drivers, UI, provider-specific message shapes |
| `packages/profiles` | Declarative profile intent and validation | Provider discovery or activation |
| `packages/bundles` | Catalog snapshot model, deterministic resolution, bundle lock/identity, compatibility diagnostics | Network lookups, provider process lifecycle, implicit version selection |
| `packages/workspace` | Workspace identity, host layout/navigation metadata, activation into one validated fiscal scope | Canonical mission, ledger, receipt, gate, approval, or fiscal state |
| `packages/plugin-runtime` | Candidate registration, release/trust verification orchestration, capability grants, lifecycle supervision, health aggregation, quiesce/replace | Accounting semantics or local approval decisions |
| `packages/host` | Use cases that compose workspace, profile, bundle, runtime, provider ports, host projections, and policy decisions | Provider implementations, HTTP concerns, canonical accounting writes |
| `packages/client` | Versioned host transport DTOs, error decoding, projection queries | Server bootstrap, provider credentials, authority logic |
| `packages/server` | Authentication adapter, request-to-context translation, composition root, transport endpoints, shutdown | Fiscal state reconstruction or direct provider bypasses |
| `packages/ui` | Workspace shell, plugin slots, provenance/health/degraded views, human action forms | Provider calls, local gate completion, ledger mutation |
| `packages/plugins/*` | Trusted UI or host feature extensions using granted SDK capabilities | Direct persistence, unrestricted secrets, canonical accounting authority |
| `packages/providers/*` | Explicit adapters from host-owned ports to verified released provider contracts | Host policy decisions or cross-provider orchestration |

### Dependency direction

```text
plugin-sdk                 workspace                 profiles
    ^                          ^                         ^
    |                          |                         |
    +----------- kernel ------+-------------------------+
                    ^                                  ^
                    |                                  |
             plugin-runtime <------ bundles -----------+
                    ^                 ^
                    |                 |
providers/* --------+-----------------+      plugins/* --> plugin-sdk
                    ^
                    |
                   host
                    ^
            +-------+-------+
            |               |
          server          client <--- ui
```

More precisely:

- `plugin-sdk`, `workspace`, and the pure portions of `profiles` are low-level packages and do not depend on `host`, `server`, `ui`, or providers.
- `kernel` may depend on `plugin-sdk` and host-owned value contracts, but never on an adapter.
- `bundles` depends on manifest/profile contracts and pure compatibility functions only.
- `plugin-runtime` depends inward on `kernel`, `plugin-sdk`, and `bundles`.
- Provider adapters implement `kernel` ports and use only verified external release contracts behind adapter-local seams.
- `host` composes interfaces; `server` is the executable composition root. UI consumes `client`, not `server` or a provider adapter.
- A provider adapter may not import another provider adapter. Cross-provider composition belongs to `host` under kernel policy.

A static boundary check must reject imports from core packages to adapters, UI-to-provider imports, package-internal path imports, and any dependency from new host packages to sunset local authority modules.

## Core contracts

All public contracts are immutable, schema-versioned, runtime-validated at trust boundaries, and designed so that unknown fields can be preserved without granting behavior.

### Scoped host context

A workspace may reference multiple companies or periods for navigation, but a provider operation receives one narrow activated scope.

```ts
interface HostContext {
  readonly contextVersion: string;
  readonly hostContractVersion: string;
  readonly organizationId: string;
  readonly ruc: ValidatedRuc;
  readonly companyId: string;
  readonly fiscalPeriodId: string;
  readonly principal: {
    readonly kind: "user" | "service";
    readonly id: string;
  };
  readonly authorization: ScopeGrant;
  readonly policyVersion: string;
  readonly correlationId: string;
  readonly workspaceId: string;
  readonly bundleId: string;
}
```

`ValidatedRuc` can only be created after checksum validation and organization-ownership authorization. `ScopeGrant` is an opaque, bounded grant; it is not a copied role list and contains no unrestricted secret. The runtime derives a provider-specific `ProviderContext` containing only fields required by the granted capability. Context derivation is audited and rejects widening, cross-RUC access, and mismatched bundle/workspace identity.

Cross-RUC work is represented as separate authorized operations with explicit evidence. It is never modeled by replacing `HostContext.ruc` in-place.

### Manifest, capability, and trust model

```ts
interface PluginManifest {
  readonly manifestVersion: string;
  readonly identity: ProviderIdentity;
  readonly implementationVersion: string;
  readonly hostCompatibility: VersionRange;
  readonly contracts: readonly ContractDeclaration[];
  readonly requestedCapabilities: readonly CapabilityRequest[];
  readonly requiredScopes: readonly ScopeRequirement[];
  readonly lifecycle: LifecycleDeclaration;
  readonly health: HealthDeclaration;
  readonly trust: TrustDeclaration;
  readonly conformance: readonly EvidenceReference[];
  readonly dependencies: readonly ProviderDependency[];
}

interface ProviderIdentity {
  readonly namespace: string;
  readonly name: string;
}

interface CapabilityRequest {
  readonly capability: CapabilityId;
  readonly access: "read" | "append" | "mutate" | "admin";
  readonly resourceScope: readonly string[];
  readonly authorityCategory?: AuthorityCategory;
}

type AuthorityCategory =
  | "missions"
  | "ledger"
  | "receipts"
  | "gates"
  | "approvals"
  | "fiscal-state";

interface TrustDeclaration {
  readonly publisher: string;
  readonly releaseReference: EvidenceReference;
  readonly integrityReference: EvidenceReference;
  readonly executionClass: "built-in" | "trusted-external";
  readonly credentialProfile: string;
}
```

Capability identifiers are host-defined and versioned, for example `workspace.projection.read`, `accounting.status.read`, `accounting.mission.mutate`, `memory.observation.read`, and `verification.evidence.read`. Provider-declared names are mapped by adapters; declarations never self-grant.

The first slice supports only `built-in` and explicitly configured `trusted-external` execution classes. Arbitrary package installation, untrusted code execution, marketplace distribution, and general sandbox claims are out of scope.

### Release-verification seams

No provider-specific release API is assumed. The runtime depends on ports that can be implemented once released artifacts are known:

```ts
interface ReleaseEvidenceVerifier {
  verify(input: ReleaseVerificationRequest): Promise<ReleaseVerificationResult>;
}

interface ContractCompatibilityVerifier {
  verify(input: ContractCompatibilityRequest): Promise<CompatibilityResult>;
}
```

Results are `verified`, `rejected`, or `unavailable`, with evidence references and bounded diagnostics. `unavailable` never means compatible. Repository source, an unreleased checkout, a local mock, or prose documentation cannot produce `verified`.

Provider adapters keep external DTOs private. They translate only after a verified release contract is bound. Until then, `providers/accounting-authority` exposes an `UnavailableAccountingAuthorityAdapter` and contract-validation fixtures; neither can be registered as production authority or return authoritative success.

### Accounting-authority port

The accounting port is host-owned and deliberately narrower than a fiscal domain implementation:

```ts
interface AccountingAuthorityPort {
  getFiscalStatus(
    context: AccountingReadContext,
    query: FiscalStatusQuery,
  ): Promise<AuthorityResult<FiscalStatusProjection>>;

  getMissionProjection(
    context: AccountingReadContext,
    reference: MissionReference,
  ): Promise<AuthorityResult<MissionProjection>>;

  getLedgerProjection(
    context: AccountingReadContext,
    query: LedgerProjectionQuery,
  ): Promise<AuthorityResult<LedgerProjection>>;

  getGateProjection(
    context: AccountingReadContext,
    reference: GateReference,
  ): Promise<AuthorityResult<GateProjection>>;

  getReceipt(
    context: AccountingReadContext,
    reference: ReceiptReference,
  ): Promise<AuthorityResult<ReceiptTransport>>;

  submitAuthoritativeCommand(
    context: AccountingMutationContext,
    command: OpaqueAccountingCommand,
  ): Promise<AuthorityResult<AuthoritativeAcknowledgement>>;
}
```

The projection types contain displayable state and opaque authority references, not transition methods. `OpaqueAccountingCommand` is admitted only after a released contract defines its schema and semantics; the first slice does not expose this method through server or UI. Future mutation enablement requires current conformance, capability, scope, approval-path, idempotency, receipt, and authority-binding proof.

The port does not expose `advanceMission`, `writeLedger`, `completeGate`, `approveLocally`, or `issueReceipt`. Provider fallback cannot implement this port for the same authority scope unless a separately proven authority-transfer procedure has completed.

### Provenance and receipt transport

```ts
interface AuthorityEnvelope<T> {
  readonly envelopeVersion: string;
  readonly issuer: ProviderIdentity;
  readonly authorityReference: string;
  readonly providerVersion: string;
  readonly contractVersion: string;
  readonly scope: FiscalScope;
  readonly correlationId: string;
  readonly ordering: OrderingMetadata;
  readonly integrity: IntegrityMetadata;
  readonly freshness: FreshnessMetadata;
  readonly verification: "verified" | "unverified" | "invalid";
  readonly payload: T;
}

interface ReceiptTransport {
  readonly mediaType: string;
  readonly bytesOrExternalReference: OpaqueContent;
  readonly digest: string;
  readonly signatureReference?: string;
  readonly issuerKeyReference?: string;
}
```

The adapter preserves provider bytes and unknown signed fields. The host may parse a verified, version-supported projection for display, but stores the original transport or provider reference alongside it. A cache copy is content-addressed and append-only; it is not the canonical receipt. Invalid digest, signature, scope, ordering, issuer, or contract version produces `unverifiable`, never success.

## Profiles and deterministic bundles

### Inputs

Resolution is a pure function of:

- a versioned `ProfileSpec`;
- an immutable `ProviderCatalogSnapshot` containing only verified or explicitly unavailable release candidates;
- the host compatibility matrix version;
- the capability-policy version;
- organization/RUC policy inputs that affect eligibility; and
- the resolver algorithm version.

A profile expresses intent and constraints. A bundle lock records the exact result:

```ts
interface BundleLock {
  readonly bundleFormatVersion: string;
  readonly resolverVersion: string;
  readonly bundleId: string;
  readonly profileId: string;
  readonly profileRevision: string;
  readonly catalogSnapshotId: string;
  readonly policyVersion: string;
  readonly providers: readonly LockedProvider[];
  readonly capabilityGrants: readonly CapabilityGrant[];
  readonly authorityAssignments: readonly AuthorityAssignment[];
  readonly provenance: readonly ResolutionEvidence[];
}
```

### Resolution algorithm

1. Validate profile and catalog schemas without network discovery.
2. Filter candidates by verified release evidence, host/contract compatibility, trust policy, declared scopes, and dependency constraints.
3. Resolve every required role to an exact provider identity and implementation/contract version. An unresolved range is an error.
4. Compute proposed granular capability grants; deny undeclared, conflicting, or policy-forbidden grants.
5. Group authority assignments by fiscal scope and authority category. Reject ambiguous ownership and any second canonical writer.
6. Sort all semantically unordered collections by stable identifiers.
7. Serialize canonical JSON using a versioned canonicalization rule and compute `bundleId` from its digest. Timestamps and observed health are excluded from identity.
8. Re-run resolution as a determinism check in conformance tests and persist the lock plus decision evidence before activation.

Activation health does not change `bundleId`; it creates a separate versioned `BundleActivation` observation. Any provider version, contract, capability, policy, profile, catalog, or authority-assignment change produces a new bundle lock.

## Runtime composition and lifecycle

### Bootstrap

`packages/server` is the composition root. It loads a minimal deployment `BootstrapDescriptor` that identifies the host contract version, release-verifier implementations, isolated host-persistence adapters, and the profile reference. This descriptor cannot assign fiscal authority by itself.

Bootstrap proceeds as follows:

1. Authenticate the principal and initialize only the adapters required to read host-owned configuration.
2. Load and validate workspace/profile data under organization scope.
3. Create the narrow activated `HostContext`, including validated RUC ownership.
4. load an immutable provider-catalog snapshot and resolve a `BundleLock`.
5. Verify release, compatibility, trust, dependency, capability, and single-authority policy for every candidate.
6. Initialize providers in deterministic topological order from declared dependencies.
7. Probe compatibility, authorization, read health, and mutation health separately.
8. Grant only capabilities whose provider reached `ready`; mutation capabilities additionally require accounting-authority proof.
9. Publish a host session snapshot to `client`/`ui`, including bundle identity, health, provenance, and unavailable/degraded reasons.

Postgres and object storage can be composed providers, but bootstrap credentials and namespaces are role-bound. A host metadata connection has no canonical accounting write permission. A provider-owned connection is controlled by that provider contract and is not surfaced as a generic SQL or object capability to plugins.

### Lifecycle state machine

The runtime exposes these observable states:

```text
discovered
  -> validating
  -> initializing
  -> ready <-> degraded
  -> stopping
  -> stopped

validating | initializing | ready | degraded -> failed
ready | degraded -> replacement
replacement -> stopping | ready | failed
failed -> validating          # explicit supervised recovery only
```

Each transition records provider identity/version, bundle ID, scope, reason code, correlation ID, observed time, and evidence references. A restart invalidates all prior capability grants and requires release, trust, scope, policy, compatibility, and health revalidation.

`degraded` is capability-specific. Read capability may remain available while mutation is denied. `initializing`, `replacement`, `stopping`, `stopped`, and `failed` never expose new mutation capability. Shutdown first closes admission, then settles or marks in-flight operations unconfirmed, and finally stops providers in reverse dependency order.

Replacement initializes the candidate without mutation grants, verifies compatibility and continuity, quiesces the current adapter, obtains external authority/data handoff evidence where applicable, and atomically activates a new bundle. Two accounting providers are never writable concurrently. Hot unload of arbitrary code is not promised.

## Operation data flow

### First-slice read-only fiscal status

1. UI selects a host-owned workspace and profile through `client`.
2. Server authenticates the principal and asks `workspace` to activate one organization/RUC/company/period scope.
3. Host resolves or loads the exact `BundleLock` and asks the runtime for `accounting.status.read`.
4. Runtime checks bundle activation, release evidence, context scope, capability grant, provider lifecycle, and read health.
5. Accounting adapter invokes only the verified external contract seam. If no release is verified, the unavailable adapter returns a typed unavailable result without provider I/O.
6. Adapter returns an `AuthorityEnvelope<FiscalStatusProjection>` or a typed failure.
7. Host validates scope, issuer, authority binding, ordering, integrity, contract version, and freshness before optionally storing a disposable projection.
8. UI renders authoritative status with issuer, bundle, contract version, and freshness, or renders unavailable/degraded/stale/unverifiable explicitly.

No step calls a local mission state machine, ledger writer, gate evaluator, approval engine, or receipt issuer.

### Future authoritative command

A future mutation follows the same path plus mutation health, idempotency, exact Money, approval-path, conformance, and receipt-continuity checks. An accepted request is not success. If the provider disappears before a verifiable authoritative acknowledgement or receipt is obtained, the result is `unconfirmed`; the host does not retry until provider status is reconciled through the released contract.

## Error model and degraded behavior

Provider boundaries return a discriminated result rather than leaking transport-specific exceptions:

```ts
type ProviderResult<T> =
  | { readonly kind: "ok"; readonly value: T }
  | { readonly kind: "unavailable"; readonly reason: ProviderReason }
  | { readonly kind: "degraded"; readonly reason: ProviderReason; readonly stale?: T }
  | { readonly kind: "blocked"; readonly reason: PolicyReason }
  | { readonly kind: "incompatible"; readonly reason: CompatibilityReason }
  | { readonly kind: "denied"; readonly reason: ScopeOrCapabilityReason }
  | { readonly kind: "unverifiable"; readonly reason: IntegrityReason }
  | { readonly kind: "unconfirmed"; readonly operationReference?: string };
```

Rules:

- `unavailable`: provider or released proof is absent; no authoritative call is attempted.
- `degraded`: an explicitly stale read projection may be returned with source/freshness; mutation is blocked.
- `incompatible`: release or contract range does not satisfy the bundle; activation is rejected.
- `blocked`/`denied`: policy, authority, approval, scope, or capability admission failed; denial is audited.
- `unverifiable`: response integrity/provenance/order cannot be established; UI cannot label it authoritative.
- `unconfirmed`: an authoritative operation may have reached the provider but completion is unknown; automatic replay is prohibited.

Errors carry stable host reason codes, correlation identity, provider identity when safe, retry classification, and evidence references. Secrets, unrestricted provider payloads, and data from another RUC are never included in diagnostics.

## Persistence ownership

### Host-owned persistence

Host adapters may write only mechanically isolated namespaces such as a dedicated `cc_host` Postgres schema and `host/<organization>/<ruc>/...` object prefixes. Exact names are deployment decisions, but isolation is mandatory.

Host-owned records include:

- workspace identity, navigation, layout metadata, and schema revisions;
- profile specifications and revisions;
- provider catalog snapshots, bundle locks, activations, and rollback pointers;
- capability/trust policy decisions and denials;
- provider registry and lifecycle observations;
- provider health observations;
- disposable read-model metadata and content-addressed cache references; and
- host audit records for scope derivation and administrative composition changes.

Every row/object includes organization and validated RUC where fiscally scoped. Queries enforce both; cross-RUC access uses a separately authorized path with evidence. Provider credentials are referenced by bounded credential profiles and are not copied into plugin context.

### Provider-owned persistence

Canonical missions, ledger, gates, approvals, receipts, fiscal state, and provider memory remain in provider-owned stores and namespaces. The host does not create their schemas, migrations, retention rules, or writers. Postgres and object-storage adapters expose role-specific ports, not unrestricted database or bucket handles.

A host projection includes authority reference, issuer, provider/contract version, scope, correlation/order metadata, integrity state, observed time, source time, and expiration/freshness. It has no repository method that can promote it to canonical state. Cached receipt bytes are append-only, content-addressed copies; provider receipt ownership is unchanged.

Persistence inventory must identify every current table, writer, repository, migration, object prefix, cache, job, backup, retention rule, and restore procedure before migration. Physical co-location does not imply shared ownership.

## Compatibility adapters

Compatibility is an anti-corruption layer, not a permanent second architecture.

- Existing web/API consumers may temporarily call `packages/host` through bounded adapters.
- Read adapters may translate legacy local DTOs into host projection queries only when provenance and scope are preserved.
- A compatibility adapter cannot call a local canonical state machine as fallback, synthesize receipts, or expose new write paths.
- Every adapter has an owner, consumer list, allowed capabilities, removal criterion, telemetry, and expiry milestone.
- New code cannot import sunset internals. Static dependency checks enforce this rule.
- External contract types are wrapped at the adapter edge; they are not copied into `kernel` or re-exported as host authority types.

## Current asset disposition candidates

These are design classifications, not deletion approvals. Final classification is symbol- and persistence-level after inventory.

| Current area | Target treatment candidate | Evidence required |
| --- | --- | --- |
| `packages/workspace-domain`, `workspace-application`, `workspace-contracts`, `workspace-control`, `workspace-projections`, `workspace-layout` | Adapt and consolidate toward `packages/workspace`; preserve identity, revisioning, serialization, migration, and property tests that satisfy scoped-host rules | Explicit RUC/company/period activation, schema migration, consumer map, no provider-authority leakage |
| `packages/ui` and `apps/web` | Adapt into target `packages/ui`; keep `apps/web` as a thin deployment shell during migration | UI contract tests for provenance, stale/degraded state, approval non-bypass, accessibility |
| `apps/api` | Adapt into `packages/server` transport and composition boundaries; retain a thin executable shell | Route inventory, context derivation tests, no direct local-authority imports |
| `packages/pi/src/plugin/*` | Extract generic manifest/lifecycle lessons only; reconstruct the host SDK/runtime contract | Capability, trust, release, scope, failure, and lifecycle conformance; current replacement-on-name and dynamic install behavior is insufficient |
| `packages/pi` | Split host-relevant adapter code from local runtime/orchestration; candidate provider adapter plus quarantine/replace/delete remainder | Released Drenyra Pi contract and consumer/data inventory |
| `packages/ai` | Candidate `providers/drenyra-ai` adapter; local gateway/control-plane/orchestrator is replace/quarantine/delete candidate where it duplicates provider ownership | Released Drenyra AI contract, parity/conformance evidence, no hidden local writers |
| `packages/memory` | Candidate `providers/drenyra-engram` adapter or host cache only where explicitly non-canonical | Released Engram contract, ownership and retention evidence |
| `packages/mission-domain`, `mission-protocol`, `mission-client` | Local state-machine/domain copies are replacement/quarantine/delete candidates; client translation may temporarily become a read-only compatibility adapter | Verified released accounting contract, contract diff, conformance, rollback, all consumers migrated |
| `packages/fiscal-sdd`, `fiscal-approval`, `phase-gatekeeper`, `drenyra-orchestrator` | Extract invariant vectors only where ownership-neutral; authority engines are replacement/quarantine/delete candidates | Proof that tests validate external behavior rather than local authority shape |
| `packages/fiscal-query-engine`, `fiscal-agent-domain`, `skill-sire-filing` | Reclassify as UI/query plugin, provider adapter, or external-provider concern; no implicit mutation authority | Capability-level inventory and released provider seams |
| `packages/domain`, `packages/application` | Mixed: extract exact Money, RUC, scope, and neutral contracts; replace local mission/ledger/gate writers that conflict with external authority | Symbol-level ownership matrix and dependency impact |
| `packages/persistence` | Split host-owned repositories from provider-owned/canonical persistence; canonical writers become migration candidates | Table/writer/retention/backup inventory and data reconciliation |
| `packages/infrastructure` | Extract explicit Postgres, object-storage, auth, SUNAT/integration, and other provider adapters; eliminate generic cross-boundary access | Credential/namespace separation and capability tests |
| `packages/security`, `shared`, `test-utils` | Retain/adapt when dependency-neutral and scope-safe | Boundary checks and cross-RUC/security conformance |

The current workspace model is reusable evidence, not the final context contract: it supports organization, company lists, period lists, revisioning, and migration, but active provider scope must add validated RUC ownership, one company, one period, principal, policy, correlation, and bundle identity.

## Inventory and classification method

Before source movement or deletion, create a machine-readable inventory with one row per independently ownable asset:

```text
asset_id
path_and_symbol_or_data_name
runtime_entrypoints
importers_and_consumers
routes_jobs_scripts_and_ui_flows
persistence_writers_readers_and_retention
current_tests_and_contracts
authority_category
current_owner
target_owner
required_capabilities
scope_fields
classification
replacement_release_evidence
migration_and_rollback_dependencies
deletion_gate_status
```

Inventory procedure:

1. Capture the Turborepo/package dependency graph and public exports.
2. Trace web/API routes, jobs, CLI/scripts, plugin loading, and provider calls to symbols.
3. Map Postgres schemas/tables/migrations/repositories/RLS, object prefixes, caches, queues, backups, restore paths, and credentials to readers/writers.
4. Map tests to invariants versus implementation shape. Mark tests that prove Money, RUC scope, approval, receipt integrity, determinism, or migration independently of the local owner.
5. Assign authority categories: host metadata, projection, mission, ledger, receipt, gate, approval, fiscal state, AI, memory, execution, verification, or infrastructure.
6. Classify each asset as `retain`, `adapt`, `extract`, `replace`, `quarantine`, or `delete-candidate`, with evidence links and an accountable owner.
7. Compare the inventory against verified released provider contracts. Unknown or conflicting assets default to `quarantine`, not retain or delete.
8. Re-run the inventory after each slice and block new dependencies on quarantine/delete candidates.

## Testing and conformance strategy

### Package-level tests

- `plugin-sdk`: schema compatibility, unknown-field preservation, invalid manifest rejection, capability parsing, exact fiscal-value serialization.
- `kernel`: policy denial, duplicate-authority rejection, context narrowing, cross-RUC denial, approval non-bypass, lifecycle transition legality.
- `profiles`/`bundles`: property tests for determinism and order independence; golden bundle IDs; skew, ambiguity, missing pin, dependency cycle, and policy-version changes.
- `plugin-runtime`: partial initialization, restart/revalidation, capability revocation, timeout, crash, reverse-order shutdown, in-flight unconfirmed operation, replacement without parallel writers.
- `workspace`: current migration/property evidence plus activated-scope and RUC-ownership tests.
- `providers/*`: adapter contract tests against released artifacts only; unavailable fixtures when no release is proven.
- `host`: read-only vertical workflow, stale projection behavior, no writable projection path, audit decision recording.
- `client`/`ui`/`server`: transport versioning, auth-to-context mapping, provenance presentation, unavailable/degraded/unverifiable UX, and mutation endpoint absence in the first slice.

### Accounting provider TCK

A host-owned technology compatibility kit runs against every accounting adapter candidate:

- released artifact and compatibility evidence verification;
- tenant/RUC/company/period isolation and cross-RUC denial;
- exact Money, currency, scale, and rounding vectors;
- deterministic status/projection semantics for fixed authoritative inputs;
- immutable receipt digest/signature/order/provenance preservation;
- R2/R3 or equivalent human/dual approval preservation;
- no local completion, receipt issuance, or authority fallback;
- absence, timeout, crash, restart, skew, ambiguous response, stale reads, and unknown mutation outcomes;
- one canonical writer and replacement continuity; and
- persistence namespace and credential isolation.

A fake provider is allowed only inside unit tests and is structurally incapable of production registration. Contract-validation fixtures prove validation behavior, not provider authority.

### Repository and Turborepo checks

Each new package defines its own `build`, `typecheck`, `test`, `lint`, and relevant `conformance` scripts. Root commands delegate through `turbo run`. Task dependencies follow declared workspace dependencies; source-reading checks use a transit-node pattern if they need dependency-source invalidation without serialized builds. File-producing tasks declare outputs. Boundary and sunset-import checks run as package tasks and in CI with affected dependents.

First-slice acceptance runs at minimum:

- unit/property tests for SDK, kernel, profiles, bundles, workspace, and runtime;
- accounting TCK against the unavailable adapter and, only if available, a verified released adapter;
- persistence ownership/static writer checks;
- one server/client/UI integration test for authoritative projection or explicit unavailable state;
- negative tests proving mutation is absent or blocked and no local state machine is invoked; and
- existing invariant tests reclassified as ownership-neutral conformance evidence.

## Staged migration

### Slice 0 — Evidence baseline

- Produce the complete ownership inventory and import/data graph.
- Record current invariant and consumer tests without treating them as target-architecture proof.
- Inspect released external artifacts through release-verification seams.
- Freeze new dependencies on known local mission/ledger/receipt/gate/approval authority.
- Perform no deletion.

### Slice 1 — Host kernel and safe read boundary

- Create `plugin-sdk`, `kernel`, `profiles`, `bundles`, `workspace`, `plugin-runtime`, and `host` contracts.
- Create the provisional `providers/accounting-authority` boundary with an unavailable adapter unless a released compatible contract is verified.
- Implement deterministic profile/bundle resolution, lifecycle observations, capability denial, and single-authority checks.
- Route one read-only fiscal-status flow through thin `server`, `client`, and `ui` seams.
- Add one trusted read-only plugin such as `plugins/fiscal-status-panel` only after its SDK capabilities are enforceable.
- Leave existing product paths operating behind their current boundary; do not add a bridge that writes through both architectures.

### Slice 2 — Host-owned persistence and workspace composition

- Adapt proven workspace packages into the target `workspace` boundary.
- Introduce isolated host schemas/object prefixes for profiles, bundle locks, activation records, lifecycle observations, and disposable projections.
- Migrate one workspace/profile cohort with reversible schema changes and projection rebuild tests.
- Keep canonical provider data untouched.

### Slice 3 — Released accounting adapter and read consumers

- Bind the accounting adapter only to a verified released contract.
- Run the accounting TCK and operational failure suite.
- Move read-only mission/fiscal/ledger/gate/receipt consumers behind `AccountingAuthorityPort` or bounded compatibility adapters.
- Reconcile cached projections against provider references; do not migrate canonical state into host ownership.

### Slice 4 — Composed providers

- Add explicit adapters for Drenyra AI, Drenyra Engram, Drenyra Pi, Guardian, Postgres, and object storage as their released contracts are independently verified.
- Grant only role-specific capabilities; one adapter may satisfy multiple roles only when its verified manifest declares them and policy keeps authority assignments unambiguous.
- Split mixed `ai`, `pi`, `persistence`, and `infrastructure` code by owner and quarantine duplicates.

### Slice 5 — Authoritative operations

- Expose one mutation only after released-contract, approval, receipt, idempotency, failure-reconciliation, data, operational, consumer, and rollback gates pass.
- Prove no local state transition or second writer is reachable.
- Roll out by explicit organization/RUC cohort and bundle activation; no silent fiscal-provider fallback.

### Slice 6 — Reconstruction and deletion

- Reconstruct remaining host surfaces against target packages rather than preserving obsolete package shapes.
- Delete only separately approved assets whose complete deletion gates are green.
- Remove compatibility adapters after all consumers and rollback dependencies have cleared.
- Update canonical architecture/product/operations documentation to the proven deployed boundary.

## Deletion gates

A delete candidate remains quarantined until all applicable gates have recorded evidence:

1. **Inventory:** all symbols, imports, routes, UI flows, jobs, scripts, tables, objects, caches, queues, credentials, operations, and rollback dependencies are classified.
2. **Released contract:** a released versioned replacement contract and supported compatibility range are verified; source intent and unreleased builds do not qualify.
3. **Conformance:** invariant and adapter TCK results cover scope, exact Money, determinism, approvals, receipts, provenance, failure, and replacement.
4. **Authority:** configuration and runtime admission prove exactly one canonical writer for every affected scope/category.
5. **Data:** migration/projection rebuild, reconciliation, retention, backup, restore, and cross-RUC isolation are rehearsed on representative data.
6. **Operations:** absence, skew, partial init, timeout, crash/restart, in-flight uncertainty, degraded reads, and replacement are observable and tested.
7. **Consumers:** every consumer uses a target host port or explicitly bounded adapter; static checks prevent new imports.
8. **Rollback:** the last compatible host/provider bundle can be restored without reverting canonical fiscal state or reactivating a second authority.
9. **Observability:** audit, health, provenance, and support procedures can diagnose the replacement without the candidate asset.
10. **Separate approval:** deletion receives an explicit review after gates 1–9; this design is not deletion approval.

## Rollback and rollout controls

- Bundle locks and activations are immutable and auditable. Rollback activates the last verified compatible bundle; it never rewinds provider-owned canonical state.
- Host schema migration uses expand/migrate/verify/contract sequencing. Readers remain forward-compatible until the rollback window closes.
- Provider rollout is cohort-scoped by organization and validated RUC. Cross-cohort state or credentials are not shared.
- A failed read adapter falls back only to a visibly stale disposable projection when policy permits. It never falls back to local authority.
- A failed mutation adapter enters `unconfirmed` or `blocked`; it does not replay approvals, issue a local receipt, or switch providers.
- Replacement keeps the previous adapter available for rollback only while it cannot become a concurrent writer. Authority transfer proof precedes new mutation grants.
- Deletions wait until rollback no longer imports or executes the candidate. Before that point, sunset code is isolated and denied new consumers.
- Physical database or object-storage rollback does not overwrite canonical provider state. Provider-owned recovery follows the verified provider contract and its operational authority.

## Explicitly out of scope

- Implementing, vendoring, reconstructing, or specifying the unreleased API of the external accounting runtime.
- Treating Drenyra AI, Engram, Pi, Guardian, Postgres, or object-storage APIs as available without released-contract verification.
- Changing fiscal rules, SUNAT semantics, Money rounding, RUC policy, receipt meaning, materiality, or R2/R3 approval requirements.
- An unrestricted third-party plugin marketplace, arbitrary dynamic package installation, general code sandbox, or guaranteed hot unload.
- Automatic accounting-authority failover or semantic substitution.
- Migrating all routes, jobs, providers, persistence, and UI in one release.
- Deleting current local authority code in the first slice.
- Making host projections, caches, Postgres tables, or object copies canonical.
- Moving provider memory, ledger, missions, receipts, gates, approvals, or fiscal state into Command Center ownership.

## Design verification checklist

- [ ] Every authoritative category has exactly one external owner per scope.
- [ ] Dependency checks prevent core-to-adapter, UI-to-provider, and sunset-authority imports.
- [ ] Profile resolution is deterministic, pinned, content-addressed, and ambiguity-rejecting.
- [ ] Provider activation requires release, compatibility, trust, scope, capability, and health proof.
- [ ] Context derivation validates organization ownership and RUC checksum and cannot widen scope.
- [ ] The accounting port contains projections/references and no local state-transition authority.
- [ ] Receipts and evidence retain original provenance, order, integrity, and provider ownership.
- [ ] Host/provider persistence is mechanically distinct and RUC-scoped.
- [ ] Missing or unverified provider releases produce unavailable state and block mutation.
- [ ] The first slice proves one read-only vertical flow and performs no deletion.
- [ ] Every extraction or deletion has inventory, conformance, data, operational, consumer, rollback, and separate approval evidence.
