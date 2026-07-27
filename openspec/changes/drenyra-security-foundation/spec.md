# Drenyra Security Foundation Specification

## Purpose

Define the security baseline for Drenyra: a documented threat model mapped to NIST CSF 2.0, a single unified RBAC system, mandatory MFA, hardened secret management, and a security monitoring & incident response runbook. This specification formalizes and unifies existing production security code without reimplementing working auth flows.

---

## Phase 0: Threat Model & NIST CSF Baseline

### Requirement: STRIDE Threat Model

The system MUST have a documented STRIDE threat model covering all trust boundaries and data flows across Drenyra's architecture.

#### Scenario: Full trust boundary coverage

- GIVEN the Drenyra system architecture
- WHEN the threat model is produced
- THEN it MUST document at minimum these trust boundaries: client ↔ API, API ↔ database, API ↔ SUNAT, API ↔ AI providers, API ↔ R2 object storage
- AND each boundary MUST enumerate Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege threats

#### Scenario: Minimum threat scenarios

- GIVEN the STRIDE analysis of all trust boundaries
- WHEN the threat model is complete
- THEN it MUST contain at least 15 distinct threat scenarios
- AND each scenario MUST include a severity rating, likelihood assessment, and mapped mitigation control

#### Scenario: Threat model is versioned and reviewable

- GIVEN the threat model document at `docs/05-security/threat-model.md`
- WHEN a security-relevant architectural change is proposed
- THEN the threat model MUST be consulted as a reference for impact analysis
- AND the document MUST include a last-reviewed date and version identifier

### Requirement: NIST CSF 2.0 Baseline Mapping

The system MUST map existing security controls against the NIST Cybersecurity Framework 2.0 to establish a measurable baseline.

#### Scenario: Full subcategory coverage

- GIVEN the NIST CSF 2.0 framework categories (Identify, Protect, Detect, Respond, Recover)
- WHEN the baseline mapping is produced
- THEN every subcategory across all five functions MUST be scored as one of: Satisfied, Partially Satisfied, or Missing
- AND each score MUST include a brief rationale referencing the specific Drenyra control or gap

#### Scenario: Gap summary with priorities

- GIVEN the completed NIST CSF baseline mapping
- WHEN the document is produced at `docs/05-security/nist-csf-baseline.md`
- THEN it MUST include a prioritized gap summary listing all Missing and Partially Satisfied subcategories
- AND each gap MUST include a recommended remediation action and an estimated effort level (Low / Medium / High)

#### Scenario: No certification claim

- GIVEN the NIST CSF baseline mapping document
- WHEN referenced externally
- THEN the document MUST explicitly state it is a baseline self-assessment and does NOT constitute a formal NIST CSF certification or third-party attestation

---

## Phase 1: RBAC Unification

### Requirement: Unified Role Hierarchy

The system MUST provide a single, canonical role hierarchy that replaces the two parallel RBAC systems currently in use.

#### Scenario: Single role source of truth

- GIVEN the unified RBAC system is active
- WHEN any authorization check is performed
- THEN exactly one role hierarchy MUST be consulted
- AND the hierarchy MUST contain exactly eight roles with strict numeric ordering: superadmin (8) > admin (7) > owner (6) > senior (5) > analyst (4) > junior (3) > client (2) > viewer (1)

#### Scenario: Role resolution is unambiguous

- GIVEN a user with an assigned role
- WHEN their permissions are evaluated
- THEN the assigned role MUST map to exactly one position in the unified hierarchy
- AND role comparison MUST use numeric level comparison (`>=`) to determine if a role satisfies a minimum role requirement

### Requirement: Unified Permission Namespaces

The system MUST consolidate all existing permissions into two complementary namespaces with consistent naming conventions.

#### Scenario: Business permissions namespace

- GIVEN a permission check for business operations (journal, SUNAT, payroll, company, users, audit)
- WHEN `hasBusinessPermission(role, 'business:journal:read')` is called
- THEN the system MUST evaluate the permission using the unified `business:*` namespace
- AND the check MUST reflect the role hierarchy such that a role at or above the required level for that permission returns true

#### Scenario: Platform permissions namespace

- GIVEN a permission check for platform operations (AI tools, cognitive streams, SIRE, observability, audit trails)
- WHEN `hasPlatformPermission(role, 'platform:sire:submit')` is called
- THEN the system MUST evaluate the permission using the unified `platform:*` namespace
- AND the check MUST reflect the role hierarchy for platform-scoped operations

#### Scenario: Cross-domain permission check

- GIVEN a feature that requires both a business permission and a platform permission
- WHEN the unified guard evaluates the request
- THEN both `hasBusinessPermission()` and `hasPlatformPermission()` MUST pass for the operation to be authorized
- AND a failure in either namespace MUST result in a denied request with a clear audit log entry

### Requirement: Unified Guard Module

The system MUST expose a single guard API that all authorization checks use, replacing the ad-hoc guards in `packages/infrastructure` and `apps/api/features/security`.

#### Scenario: Guard module location

- GIVEN the unified RBAC implementation
- WHEN the guard functions are imported
- THEN all imports MUST resolve to `packages/security/src/rbac/`
- AND the module MUST export at minimum: `hasBusinessPermission()`, `hasPlatformPermission()`, `requirePermission()`, and `resolveActor()`

#### Scenario: Actor resolution from request context

- GIVEN an incoming HTTP request with auth session
- WHEN `resolveActor(request)` is called
- THEN it MUST extract the authenticated user's ID, role, and company/tenant context from the session
- AND it MUST return a structured actor object with all three fields populated
- AND it MUST reject unauthenticated requests before permission evaluation

### Requirement: RBAC Migration Safety

The system MUST migrate from the old dual-RBAC systems to the unified system without breaking existing access control during the transition.

#### Scenario: Feature-flag controlled cutover

- GIVEN the feature flag `UNIFIED_RBAC_ENABLED`
- WHEN the flag is set to `false`
- THEN all authorization checks MUST use the old dual-system guards (System 1 for business routes, System 2 for platform routes)
- AND no unified guard code path MUST be executed

#### Scenario: Instant rollback

- GIVEN the unified RBAC system is active (`UNIFIED_RBAC_ENABLED=true`)
- WHEN the feature flag is toggled to `false`
- THEN all authorization checks MUST immediately revert to the old dual-system behavior
- AND no process restart MUST be required for the rollback to take effect

#### Scenario: Old modules deprecated

- GIVEN the unified RBAC system is the active path
- WHEN a developer imports from `packages/infrastructure/src/auth/permissions.ts` or `apps/api/src/features/security/rbac-policy.ts`
- THEN the import MUST trigger a `@deprecated` warning pointing to the unified module
- AND the old guard functions MUST remain functional as delegation wrappers (not removed)

### Requirement: RBAC Test Coverage

The system MUST have comprehensive test coverage for the unified RBAC system before old guards are removed.

#### Scenario: Role-permission matrix coverage

- GIVEN the unified RBAC test suite
- WHEN tests are executed
- THEN every role-permission combination in the business namespace MUST have at least one test case
- AND every role-permission combination in the platform namespace MUST have at least one test case
- AND test cases MUST verify that lower roles are denied permissions reserved for higher roles

#### Scenario: Protected route integration coverage

- GIVEN the Route Protection Matrix with 31 mounted surfaces
- WHEN RBAC integration tests are executed
- THEN every protected route MUST have at least one test case verifying correct authorization behavior
- AND at least one test per route MUST verify that an insufficiently-privileged role is denied with the appropriate HTTP status

---

## Phase 2: MFA/2FA Implementation

### Requirement: TOTP Enrollment

The system MUST support TOTP-based two-factor authentication enrollment following RFC 6238.

#### Scenario: Enrollment flow

- GIVEN an authenticated user without MFA enabled
- WHEN they initiate MFA enrollment
- THEN the system MUST generate a unique TOTP secret and return it along with a provisioning URI suitable for QR code generation
- AND the secret MUST NOT be stored as enabled until the user successfully verifies a TOTP code
- AND the verification window MUST follow RFC 6238 tolerances (±1 step)

#### Scenario: QR code provisioning

- GIVEN the generated TOTP secret and provisioning URI
- WHEN the enrollment UI renders
- THEN the URI MUST encode the issuer as "Drenyra" and the account label as the user's email
- AND the QR code MUST be displayed alongside a manual entry key as fallback

#### Scenario: Enrollment completion

- GIVEN a user has generated a TOTP secret and provisioned their authenticator app
- WHEN they submit a valid TOTP code
- THEN the system MUST mark `totp_enabled = true` and set `totp_verified_at` to the current timestamp
- AND the system MUST generate exactly 8 one-time recovery codes
- AND the recovery codes MUST be displayed to the user exactly once

### Requirement: TOTP Authentication

The system MUST require TOTP verification during login for users with MFA enabled.

#### Scenario: Login with MFA

- GIVEN a user with `totp_enabled = true`
- WHEN they authenticate with a valid password
- THEN the system MUST NOT issue a full session yet
- AND the system MUST respond with a TOTP challenge indicating MFA is required
- AND the password-authenticated intermediate state MUST be short-lived (maximum 5 minutes)

#### Scenario: Successful TOTP verification

- GIVEN a TOTP challenge is active after password authentication
- WHEN the user submits a valid TOTP code within the validity window
- THEN the system MUST issue a full authenticated session with HTTP-only cookie
- AND the system MUST log the successful MFA verification in the audit log

#### Scenario: Failed TOTP verification

- GIVEN a TOTP challenge is active
- WHEN the user submits an invalid TOTP code
- THEN the system MUST increment a TOTP failure counter
- AND after 5 consecutive failures the TOTP challenge MUST be invalidated and the user MUST restart from password authentication
- AND each failed attempt MUST be logged in the audit log

### Requirement: MFA Recovery Codes

The system MUST provide one-time-use recovery codes for MFA account recovery.

#### Scenario: Recovery code generation

- GIVEN MFA enrollment is completed
- WHEN recovery codes are generated
- THEN exactly 8 codes MUST be produced
- AND each code MUST be stored as a bcrypt hash in the database (not plaintext)
- AND the plaintext codes MUST be displayed to the user exactly once at enrollment time

#### Scenario: Recovery code redemption

- GIVEN a user is locked out of their TOTP device
- WHEN they submit a valid recovery code during the TOTP challenge
- THEN the system MUST accept it, mark that specific code as consumed, and issue a full session
- AND the redemption event MUST be logged in the audit log with the consumed code index
- AND a consumed recovery code MUST NOT be valid for a second authentication

### Requirement: MFA Session Step-Up

The system MUST require MFA re-verification for routes marked as MFA-protected when the session was created before MFA enrollment.

#### Scenario: Step-up challenge

- GIVEN a user enrolled in MFA and has an existing session created before enrollment
- WHEN they access a route marked `requireMfa: true` in the Route Protection Matrix
- THEN the system MUST intercept the request and require a fresh TOTP verification
- AND upon successful verification the session MUST be upgraded with an MFA-verified flag
- AND subsequent requests to MFA-protected routes MUST NOT re-challenge within the same session

#### Scenario: MFA route marker

- GIVEN the Route Protection Matrix
- WHEN a route is configured with `requireMfa: true`
- THEN the MFA middleware MUST enforce the step-up check before the route handler executes
- AND routes without `requireMfa` MUST NOT trigger MFA challenges even for MFA-enabled users

### Requirement: MFA Audit Trail

The system MUST log all MFA-related events for security monitoring.

#### Scenario: MFA event logging

- GIVEN MFA is operational
- WHEN any of the following events occur: enrollment, disable, recovery code use, failed TOTP attempt, step-up challenge success, step-up challenge failure
- THEN each event MUST produce an audit log entry with: timestamp, user ID, event type, IP address, and outcome
- AND failed attempts MUST include the failure count within the current window

### Requirement: MFA Rate Limiting

The system MUST apply rate limiting to TOTP verification attempts.

#### Scenario: TOTP rate limiting

- GIVEN the AUTH rate limit tier is configured
- WHEN TOTP verification requests are made
- THEN the verification endpoint MUST be subject to the same rate limit tier as password authentication
- AND exceeding the rate limit MUST return HTTP 429 with a clear Spanish error message

### Requirement: MFA Feature Flag

The system MUST support disabling MFA globally via a feature flag.

#### Scenario: Global MFA disable

- GIVEN the feature flag `TOTP_ENABLED` is set to `false`
- WHEN any MFA-protected request is processed
- THEN the MFA middleware MUST skip TOTP verification
- AND existing sessions MUST continue to function without MFA challenges
- AND the enrollment endpoint MUST return a clear "MFA not available" response

---

## Phase 3: Secret Management Hardening

### Requirement: Secrets Inventory

The system MUST maintain a documented inventory of all secrets used in the Drenyra stack.

#### Scenario: Complete inventory

- GIVEN the secrets inventory document
- WHEN reviewed by a security operator
- THEN it MUST list every secret by name, environment scope (dev/staging/prod), rotation frequency, and blast radius if compromised
- AND the inventory MUST include at minimum: BETTER_AUTH_SECRET, DATABASE_URL, SUNAT_CLIENT_ID, SUNAT_CLIENT_SECRET, DRENYRA_MASTER_KEY, LLM_GATEWAY_KEY_PASSPHRASE, and all R2/S3 keys

#### Scenario: Rotation schedule

- GIVEN the secrets inventory
- WHEN rotation frequency is specified
- THEN each secret MUST have a documented rotation interval or an explicit "manual only" designation with rationale
- AND secrets marked "manual only" MUST include a documented manual rotation procedure

### Requirement: SecretProvider Abstraction

The system MUST provide a secret retrieval abstraction that decouples secret consumers from the underlying storage mechanism.

#### Scenario: Env-var provider

- GIVEN the default `SecretProvider` implementation
- WHEN `getSecret('BETTER_AUTH_SECRET')` is called
- THEN it MUST read from the process environment variables
- AND return the resolved string value or throw a typed `SecretNotFoundError` if the variable is unset or empty

#### Scenario: Provider interface

- GIVEN the `SecretProvider` interface at `packages/security/src/secrets/provider.ts`
- WHEN a new secret backend is implemented (e.g., Infisical, HashiCorp Vault)
- THEN the implementation MUST satisfy the `SecretProvider` interface without changes to consumer code
- AND the interface MUST define at minimum: `getSecret(name: string): Promise<string>` and `validateSecrets(): Promise<ValidationResult>`

### Requirement: Startup Secret Validation

The system MUST validate all required secrets at application startup.

#### Scenario: Non-empty validation

- GIVEN the application starts
- WHEN secret validation executes
- THEN every secret in the inventory MUST be checked for non-empty, non-placeholder values
- AND any missing or placeholder secret MUST produce a logged warning with the secret name

#### Scenario: Entropy validation

- GIVEN the application starts in CI or strict mode
- WHEN secret validation executes
- THEN secrets used for cryptographic purposes (BETTER_AUTH_SECRET, DRENYRA_MASTER_KEY, LLM_GATEWAY_KEY_PASSPHRASE) MUST meet a minimum entropy threshold (configurable, default 128 bits)
- AND a secret failing the entropy check MUST cause the process to exit with a non-zero code in strict mode

#### Scenario: Production leniency

- GIVEN the application starts in production with strict mode disabled
- WHEN a secret validation fails
- THEN the process MUST log an ERROR-level warning but MUST NOT crash the process
- AND the validation result MUST be surfaced in health-check endpoints

### Requirement: Secret Pattern Pre-Commit Hook

The system MUST prevent accidental commits of secret-like patterns.

#### Scenario: Secret pattern rejection

- GIVEN a pre-commit hook is installed
- WHEN a developer attempts to commit a file containing patterns that match known secret formats (API keys, private keys, connection strings with embedded credentials, high-entropy base64 strings ≥ 40 chars)
- THEN the hook MUST reject the commit with a clear message identifying the file and line
- AND the hook MUST provide instructions for remediation (use environment variables, `.env` files, or the `SecretProvider`)

#### Scenario: False-positive bypass

- GIVEN the pre-commit hook flags a legitimate non-secret match
- WHEN the developer adds a `// nosec` comment on the flagged line
- THEN the hook MUST skip that specific match
- AND the bypass MUST be logged for audit purposes

### Requirement: Vault Migration Strategy

The system MUST document a migration path from environment-variable-based secret management to a vault solution.

#### Scenario: Migration document

- GIVEN the vault migration strategy document
- WHEN reviewed by an infrastructure engineer
- THEN it MUST identify Infisical as the target vault solution
- AND it MUST describe the step-by-step migration path: initial deployment → secret import → provider switch → env-var deprecation
- AND it MUST estimate effort and downtime impact for each step

### Requirement: Key Rotation Procedure

The system MUST document procedures for rotating cryptographic keys and secrets.

#### Scenario: BETTER_AUTH_SECRET rotation

- GIVEN the key rotation procedure document
- WHEN BETTER_AUTH_SECRET must be rotated (e.g., after a suspected compromise)
- THEN the procedure MUST describe the exact steps, including: generate new secret → deploy to all instances → restart → invalidate existing sessions or allow grace period
- AND the procedure MUST state the blast radius (all user sessions invalidated) and recommend a maintenance window

#### Scenario: Encryption passphrase rotation

- GIVEN the key rotation procedure document
- WHEN DRENYRA_MASTER_KEY must be rotated
- THEN the procedure MUST describe how to re-encrypt existing data with the new key
- AND it MUST acknowledge that current implementation does not support online rotation and requires a data migration window

---

## Phase 4: Security Monitoring & Incident Response

### Requirement: Current Monitoring Documentation

The system MUST document the existing security monitoring posture.

#### Scenario: Monitoring inventory

- GIVEN the monitoring strategy document at `docs/05-security/monitoring-strategy.md`
- WHEN reviewed
- THEN it MUST enumerate: what security events are currently logged, where logs are stored, retention periods for each log category, and current alerting mechanisms (if any)
- AND it MUST explicitly identify alerting gaps where security-relevant events are logged but not alerted on

### Requirement: Security Alert Triggers

The system MUST define security-relevant metrics and log events that warrant alerting.

#### Scenario: Defined alert triggers

- GIVEN the monitoring strategy document
- WHEN security operators configure alerting
- THEN the document MUST define at minimum these alert triggers:
  - Consecutive failed login attempts exceeding threshold (>10 within 5 minutes for a single account)
  - Failed MFA verification attempts exceeding threshold (>5 consecutive)
  - Role or permission changes to any user account
  - Access to destructive endpoints (delete, bulk operations) by non-superadmin roles
  - Unusual SUNAT query volume or patterns (deviation from baseline)
  - Secret validation failures at application startup

#### Scenario: Alert severity classification

- GIVEN each defined alert trigger
- WHEN an alert fires
- THEN it MUST be classified with a severity level (Critical / High / Medium / Low)
- AND the classification MUST include guidance on expected response time per severity

### Requirement: Incident Response Runbook

The system MUST provide a documented incident response runbook with at least four playbooks.

#### Scenario: Credential compromise playbook

- GIVEN the incident response runbook at `docs/05-security/incident-response-runbook.md`
- WHEN a credential compromise is suspected (session hijack, leaked API keys)
- THEN the playbook MUST specify: immediate containment actions, investigation steps, credential rotation procedure, user notification template, and post-incident review requirements

#### Scenario: Brute force attack playbook

- GIVEN a brute force or credential stuffing attack is detected
- WHEN the playbook is activated
- THEN it MUST specify: rate-limit adjustment steps, IP blocklist procedure, affected account identification method, and communication to affected users
- AND it MUST define thresholds that distinguish normal activity from an active attack

#### Scenario: Data exfiltration suspicion playbook

- GIVEN unusual data access patterns are detected (unusual SUNAT query patterns, bulk exports)
- WHEN the playbook is activated
- THEN it MUST specify: access log audit steps, affected data scope determination, tenant isolation verification, and regulatory notification requirements for Peruvian data protection law

#### Scenario: Privilege escalation attempt playbook

- GIVEN a privilege escalation attempt is detected (RBAC bypass, role change without audit trail)
- WHEN the playbook is activated
- THEN it MUST specify: immediate access revocation steps, audit trail reconstruction method, vulnerability assessment of the escalation path, and patch/deploy urgency classification

### Requirement: Security Review Cadence

The system MUST define a recurring security review schedule.

#### Scenario: Review schedule

- GIVEN the security review cadence documented in the runbook
- WHEN the review dates arrive
- THEN the organization MUST conduct:
  - Threat model review every 6 months (or after any major architectural change)
  - NIST CSF re-baseline annually
  - RBAC permission audit quarterly (review all role-permission assignments for least-privilege compliance)
- AND each review MUST produce a dated summary with findings and action items

---

## Cross-Cutting Requirements

### Requirement: Non-Regression of Existing Auth

The system MUST preserve all existing authentication and authorization behavior throughout all phases of this SDD.

#### Scenario: Existing auth flow unchanged

- GIVEN any phase of this SDD is deployed
- WHEN existing authentication flows execute (login, registration, email verification, password reset, session management)
- THEN all flows MUST produce identical outcomes as before the change
- AND the BetterAuth integration MUST remain unchanged
- AND HTTP-only cookie session management MUST remain unchanged

#### Scenario: Existing encryption unchanged

- GIVEN any phase of this SDD is deployed
- WHEN existing encryption operations execute (fiscal data E2E, AI tool context AES-256-GCM)
- THEN encryption and decryption MUST produce identical results as before the change
- AND no re-encryption of existing data MUST be required for phases 0-4

### Requirement: Rollback Safety

The system MUST support rollback to pre-SDD behavior for all code changes.

#### Scenario: RBAC rollback

- GIVEN the unified RBAC has been deployed
- WHEN `UNIFIED_RBAC_ENABLED=false` is set
- THEN all authorization checks MUST use the old dual-system guards
- AND no unified RBAC code path MUST execute

#### Scenario: MFA rollback

- GIVEN MFA has been deployed
- WHEN `TOTP_ENABLED=false` is set
- THEN no MFA challenge MUST be presented during login or route access
- AND existing MFA enrollment data MUST remain in the database but be ignored

#### Scenario: Secret validation rollback

- GIVEN secret validation is active
- WHEN strict mode is disabled
- THEN validation failures MUST log warnings but MUST NOT prevent application startup

### Requirement: Documentation Location

All security documentation produced by this SDD MUST live under the `docs/05-security/` directory.

#### Scenario: Documentation structure

- GIVEN the SDD is complete
- WHEN the documentation tree is inspected
- THEN the following files MUST exist:
  - `docs/05-security/threat-model.md`
  - `docs/05-security/nist-csf-baseline.md`
  - `docs/05-security/incident-response-runbook.md`
  - `docs/05-security/monitoring-strategy.md`
- AND each document MUST be referenced from `docs/05-security/README.md` with a one-line description

### Requirement: Dependency on H02 Tenant Isolation

The system MUST acknowledge the dependency on the H02 tenant isolation change for threat model completeness.

#### Scenario: H02 dependency documented

- GIVEN the threat model is produced
- WHEN trust boundaries involving tenant isolation are described
- THEN the threat model MUST reference `drenyra-h02-tenant-isolation` as a dependency
- AND if H02 materially changes after threat model publication, the threat model MUST be updated before PR1 merge

### Requirement: No Workflow Incidents

The system MUST pass all existing CI gates — lint, typecheck, and test — for code changes introduced by this SDD.

#### Scenario: CI gate compliance

- GIVEN code changes from any phase of this SDD
- WHEN CI executes
- THEN all existing lint rules MUST pass
- AND TypeScript compilation MUST succeed with no new errors
- AND all existing test suites MUST pass with no regressions
