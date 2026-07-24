# Autonomous Change Control Plane — Policy Specification

**Change:** `autonomous-change-control-plane`
**Domain:** `control-plane-policy`
**Capability:** `autonomous-change-control-plane` (New)
**Last updated:** 2026-07-22

## Purpose

Define the policy layer of the autonomous change control plane: request-scoped
writable roots, deny-first protected-path precedence, fiscal and security domain
protection, Dependabot qualification, fail-closed autonomy modes, and rollback-plan
selection. Policy is enforced mechanically; it is never advisory.

## Requirements

### REQ-POL-001: Request-scoped writable roots

Every autonomous run MUST declare exactly one set of writable roots. The control
plane MUST reject any proposed path that does not fall within a declared writable
root after canonicalization.

#### Scenario: Path within writable root accepted

- GIVEN a writable root `packages/drenyra-orchestrator/src/`
- AND a proposed canonical path
  `packages/drenyra-orchestrator/src/control-plane/manifest.ts`
- WHEN the control plane checks the writable root
- THEN the path is accepted

#### Scenario: Path outside writable root rejected

- GIVEN a writable root `packages/drenyra-orchestrator/src/`
- AND a proposed canonical path `packages/shared/src/utils.ts`
- WHEN the control plane checks the writable root
- THEN the path is rejected with a policy-error diagnostic

#### Scenario: No writable root declared

- GIVEN an autonomous run with no writable root configured
- WHEN the control plane validates the run context
- THEN the run fails before any path processing begins

### REQ-POL-002: Deny-first protected-path precedence

The control plane MUST maintain a deny-first registry of protected paths. A
protected-path match MUST reject the change-set before any writable-root check,
budget evaluation, or delivery-tree mutation. Protection is based on a maintained
path registry, not only keyword matching in path names.

#### Scenario: Protected path denied before writable-root check

- GIVEN a writable root `packages/drenyra-orchestrator/src/`
- AND a protected path pattern `**/fiscal/**`
- AND a proposed path
  `packages/drenyra-orchestrator/src/fiscal/calculator.ts`
- WHEN the control plane evaluates the path
- THEN the protected-path check runs first and denies the path
- AND the writable-root check is never reached for that path

#### Scenario: Protected path denied before budget check

- GIVEN a change-set with one file matching a protected path and the diff
  within budget
- WHEN the control plane evaluates the change-set
- THEN the run fails at the protected-path gate
- AND the budget gate is never reached

### REQ-POL-003: Fiscal and security domain protection

The protected-path registry MUST include at minimum: fiscal and accounting logic;
SUNAT, UBL, SIRE, IGV, and CDR paths; auth, security, and payment paths;
migrations, seeds, and tenant/RUC scoping infrastructure; environment and
secret-bearing files; GitHub workflows and actions; release and deployment
configuration; OpenSpec and agent-governance files; and the control-plane policy
configuration itself.

#### Scenario: Fiscal path protected

- GIVEN a proposed path matching `**/sunat/**`, `**/sire/**`, or `**/igv/**`
- WHEN the control plane checks the path against the protected registry
- THEN the path is denied with the protected domain name in the diagnostic

#### Scenario: Tenant/scoping path protected

- GIVEN a proposed path matching a tenant isolation module or RUC-scoping file
- WHEN the control plane checks the path
- THEN the path is denied

#### Scenario: CI/release path protected

- GIVEN a proposed path matching `.github/workflows/*.yml` or
  `.github/actions/**`
- WHEN the control plane checks the path
- THEN the path is denied

#### Scenario: Secrets path protected

- GIVEN a proposed path matching `.env*` or any configured secret-bearing
  pattern
- WHEN the control plane checks the path
- THEN the path is denied

#### Scenario: Control-plane policy self-protection

- GIVEN a proposed path matching the control-plane configuration file
- WHEN the control plane checks the path
- THEN the path is denied
- AND no autonomous run may modify its own policy

### REQ-POL-004: No protected-path runtime override

A protected-path request MUST stop autonomous execution and reroute to human-owned
SDD or normal development. A policy change MUST require its own separately reviewed
change and MUST NOT authorize the current run retroactively.

#### Scenario: Escalation on protected-path request

- GIVEN a change-set that includes a protected path
- WHEN the control plane rejects the change
- THEN the diagnostic records the protected domain
- AND the run terminates without producing a branch or PR
- AND authoritative GitHub or local evidence records the terminal result
- AND an Engram follow-up MAY be attempted as supplemental context

### REQ-POL-005: `proposal-only` and `disabled` fail-closed modes

The control plane MUST support two fail-closed autonomy modes. `proposal-only` mode
MUST emit evidence and diagnostics without modifying Git. `disabled` mode MUST stop
autonomous generation entirely. The system MUST NOT restore the current unguarded
workflow as a rollback from either mode.

#### Scenario: Proposal-only mode emits evidence only

- GIVEN autonomy mode `proposal-only`
- WHEN an eligible trigger arrives
- THEN the control plane validates input and produces diagnostics
- AND no Git branch, commit, or PR is created
- AND authoritative local or GitHub evidence stores the result
- AND Engram persistence is supplemental

#### Scenario: Disabled mode stops all generation

- GIVEN autonomy mode `disabled`
- WHEN any trigger arrives
- THEN the control plane rejects the trigger immediately
- AND no model call, path validation, or Git operation occurs

### REQ-POL-006: Dependabot separate profile

The control plane MUST support a Dependabot qualification profile distinct from
the standard AI-code profile. The Dependabot profile MUST require: only declared
dependency manifests and lockfiles; deny-first protected-path checks; explicit
package-manager and directory allowlists; vulnerability, license, and compatibility
policy checks; a policy-recorded lockfile budget exception; and human merge
approval. Generic gates MUST NOT be silently disabled for Dependabot.

The vulnerability policy check MUST reject an update that introduces or worsens
a vulnerability above the configured policy threshold in any affected workspace.
An update merely associated with a CVE identifier in the advisory database that
does not introduce or worsen an exploitable path above threshold MUST NOT be
rejected on that basis alone.

#### Scenario: Lockfile diff exceeds standard budget

- GIVEN a Dependabot change modifying `bun.lock` with 600 diff lines
- AND the standard AI-code total-diff budget is 400 lines
- WHEN the Dependabot profile evaluates the change
- THEN the explicit lockfile budget exception is applied
- AND the change is not rejected under the standard budget

#### Scenario: Dependabot change outside allowlist rejected

- GIVEN a Dependabot change that modifies a file outside the declared
  dependency manifest and lockfile allowlist
- WHEN the Dependabot profile evaluates the change
- THEN the change is rejected

#### Scenario: Vulnerability above threshold rejected

- GIVEN a Dependabot update that introduces a vulnerability rated CRITICAL
  in an affected workspace
- AND the policy threshold is HIGH (block CRITICAL and HIGH)
- WHEN the Dependabot profile runs the vulnerability check
- THEN the update is rejected
- AND the diagnostic records the vulnerability identifier and severity

#### Scenario: Vulnerability below threshold not rejected

- GIVEN a Dependabot update associated with a LOW-severity CVE advisory
- AND the policy threshold is HIGH
- AND the update does not introduce or worsen an exploitable path rated
  above the threshold
- WHEN the Dependabot profile runs the vulnerability check
- THEN the update is not rejected on vulnerability grounds

#### Scenario: License policy violation rejected

- GIVEN a Dependabot update introduces a dependency with a license
  prohibited by the configured license policy
- WHEN the Dependabot profile runs the license check
- THEN the update is rejected
- AND the diagnostic records the prohibited license identifier

#### Scenario: Compatibility failure rejected

- GIVEN a Dependabot update where the affected workspace's test suite
  fails with the updated dependency
- WHEN the Dependabot profile runs compatibility verification
- THEN the update is rejected
- AND the diagnostic records the failing workspace and test exit code

#### Scenario: Dependabot auto-merge disabled in v1

- GIVEN a Dependabot PR that passes all qualification checks
- WHEN the publication phase attempts to auto-merge
- THEN auto-merge is not performed
- AND the PR requires human merge approval

### REQ-POL-007: Rollback-plan selection by merge strategy

The control plane MUST select a rollback plan based on the merge method reported
by GitHub. For merge-commit: revert the merge commit with correct parent. For
squash-merge: revert the squash commit. For rebase-merge: record the merged
commit list and propose reverse-order reverts. The plan is evidence and guidance,
not automatic execution. A human MUST review and execute any revert.

#### Scenario: Merge-commit rollback

- GIVEN a merged autonomous PR using merge-commit strategy
- WHEN the control plane selects the rollback plan
- THEN the plan specifies `git revert -m 1 <merge-commit-sha>`

#### Scenario: Squash-merge rollback

- GIVEN a merged autonomous PR using squash-merge strategy
- WHEN the control plane selects the rollback plan
- THEN the plan specifies `git revert <squash-commit-sha>`

#### Scenario: Rebase-merge rollback

- GIVEN a merged autonomous PR using rebase-merge strategy with commits
  C1, C2, C3 on main
- WHEN the control plane selects the rollback plan
- THEN the plan proposes reverts of C3, then C2, then C1 in reverse order

#### Scenario: Rollback plan is evidence, not execution

- GIVEN a selected rollback plan
- WHEN the control plane emits the plan
- THEN no destructive Git command is executed
- AND the plan is included in the post-merge receipt as guidance
