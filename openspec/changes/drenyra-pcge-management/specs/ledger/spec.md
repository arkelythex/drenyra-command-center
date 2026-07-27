# Ledger Specification

## Purpose

PCGE (Plan Contable General Empresarial) account management API for Drenyra. This domain provides CRUD operations, hierarchical navigation, and on-demand catalog seeding for the Peruvian chart of accounts.

## Requirements

### Requirement: Create Account

The system MUST allow authenticated company members to create user-level PCGE accounts (levels 4–5).

#### Scenario: Create a valid level-4 account

- GIVEN a company with seeded PCGE catalog (levels 1–3)
- WHEN a company member sends `POST /api/ledger/accounts` with `{ code: "10111", name: "Caja M.N. — Oficina Principal", type: "Activo", parentId: "<uuid-of-101>" }`
- THEN the system creates the account with `level: "4"`, `isActive: true`, `isSystem: false`
- AND returns 201 with the account JSON

#### Scenario: Reject system-level account creation (level ≤ 3)

- GIVEN a company with seeded PCGE catalog
- WHEN a company member sends `POST /api/ledger/accounts` with `{ code: "101", name: "Caja", type: "Activo", parentId: "<uuid-of-10>" }`
- THEN the system returns 422 with error code `FORBIDDEN_SYSTEM_LEVEL`

#### Scenario: Reject duplicate account code

- GIVEN account "10111" already exists for the company
- WHEN a company member sends `POST /api/ledger/accounts` with `code: "10111"`
- THEN the system returns 409 with error code `DUPLICATE_CODE`

#### Scenario: Reject non-existent parent

- GIVEN a company with seeded PCGE catalog
- WHEN a company member sends `POST /api/ledger/accounts` with `parentId: "<non-existent-uuid>"`
- THEN the system returns 422 with error code `PARENT_NOT_FOUND`

#### Scenario: Validate PCGE code structure

- GIVEN the Account domain entity validation rules
- WHEN an invalid code is provided (wrong length for level, type mismatch with first digit, non-numeric)
- THEN the system returns 422 with the entity's validation message

### Requirement: Update Account

The system MUST allow partial updates to account fields, with restrictions for system accounts (levels 1–3).

#### Scenario: Update user account name

- GIVEN a user-created account (level 4)
- WHEN a company member sends `PUT /api/ledger/accounts/:id` with `{ name: "Nuevo nombre" }`
- THEN the system updates only the name field
- AND returns 200 with the updated account

#### Scenario: Restrict system account updates to safe fields

- GIVEN a system account (level ≤ 3)
- WHEN a company member sends `PUT /api/ledger/accounts/:id` with `{ code: "99" }` or any restricted field
- THEN the system returns 403 with error code `SYSTEM_ACCOUNT_RESTRICTED`

#### Scenario: Allow safe field updates on system accounts

- GIVEN a system account (level ≤ 3)
- WHEN a company member sends `PUT /api/ledger/accounts/:id` with `{ name: "Nombre actualizado" }`
- THEN the system updates the name
- AND returns 200

#### Scenario: Return 404 for non-existent account

- GIVEN any authenticated company member
- WHEN they send `PUT /api/ledger/accounts/:id` with a non-existent UUID
- THEN the system returns 404

### Requirement: Toggle Account Active Status

The system MUST allow toggling the active/inactive status of any account, including system accounts.

#### Scenario: Deactivate an active account

- GIVEN an active account
- WHEN a company member sends `PATCH /api/ledger/accounts/:id/toggle`
- THEN the system sets `isActive` to `false`
- AND returns 200

#### Scenario: Activate an inactive account

- GIVEN an inactive account
- WHEN a company member sends `PATCH /api/ledger/accounts/:id/toggle`
- THEN the system sets `isActive` to `true`
- AND returns 200

#### Scenario: Toggle system account

- GIVEN a system account (level ≤ 3)
- WHEN a company member toggles it
- THEN the system allows the operation (no system restriction on toggle)
- AND returns 200

### Requirement: Delete Account

The system MUST allow deletion of user-created accounts that have no dependencies (children or journal entries). System accounts (levels 1–3) MUST NOT be deletable.

#### Scenario: Delete a user account without dependencies

- GIVEN a user-created account (level 4+) with no children and no journal entry lines
- WHEN a company member sends `DELETE /api/ledger/accounts/:id`
- THEN the system deletes the account
- AND returns 204

#### Scenario: Reject deletion of system account

- GIVEN a system account (level ≤ 3)
- WHEN a company member sends `DELETE /api/ledger/accounts/:id`
- THEN the system returns 403 with error code `SYSTEM_ACCOUNT_DELETE_FORBIDDEN`

#### Scenario: Reject deletion of account with children

- GIVEN an account that has child accounts
- WHEN a company member sends `DELETE /api/ledger/accounts/:id`
- THEN the system returns 409 with error code `HAS_CHILDREN`

#### Scenario: Reject deletion of account with journal entries

- GIVEN an account whose code is referenced in `journal_entry_lines.accountCode`
- WHEN a company member sends `DELETE /api/ledger/accounts/:id`
- THEN the system returns 409 with error code `HAS_JOURNAL_ENTRIES`

### Requirement: View Account Hierarchy

The system MUST return the full hierarchical tree of accounts for the company, with roots at level 2.

#### Scenario: Retrieve hierarchy for a company with seeded catalog

- GIVEN a company with PCGE catalog seeded (levels 2–3)
- WHEN a company member sends `GET /api/ledger/accounts/hierarchy`
- THEN the system returns a tree rooted at level-2 accounts
- AND each node includes `id`, `code`, `name`, `level`, `type`, `isActive`, `isSystem`, and nested `children`
- AND `isSystem` is derived as `true` when `level ∈ {"1","2","3"}`

#### Scenario: Include inactive accounts in hierarchy

- GIVEN some accounts are inactive
- WHEN a company member requests the hierarchy
- THEN inactive accounts appear with `isActive: false`

### Requirement: Seed PCGE Catalog On-Demand

The system MUST provide an endpoint to seed the standard PCGE catalog (levels 1–3) for the current company idempotently.

#### Scenario: Seed catalog for a company without accounts

- GIVEN a company with no PCGE accounts
- WHEN a company member sends `POST /api/ledger/accounts/seed`
- THEN the system inserts ~217 standard PCGE accounts (levels 1–3)
- AND returns 200 with the total account count

#### Scenario: Seed is idempotent

- GIVEN a company that already has the PCGE catalog seeded
- WHEN a company member sends `POST /api/ledger/accounts/seed` again
- THEN the system does not duplicate accounts
- AND returns 200 with the same total account count

### Requirement: Company Context Authentication

All PCGE account management endpoints MUST require company context via `companyScopeGuard`.

#### Scenario: Reject unauthenticated request

- GIVEN no valid company context
- WHEN a request is made to any `/api/ledger/accounts` endpoint
- THEN the system returns 401 with `COMPANY_CONTEXT_REQUIRED`

### Requirement: Account Code Journal Entry Validation

When validating account deletion, the system MUST check for journal entry lines by exact `accountCode` match within the same company scope.

#### Scenario: Exact code match for journal entry check

- GIVEN account with code "10111"
- AND a journal entry line referencing `accountCode: "10111"` in the same company
- WHEN deletion is attempted
- THEN the system blocks deletion (409)

#### Scenario: No false positive from code prefix

- GIVEN account with code "101"
- AND a journal entry line referencing `accountCode: "10111"` (different, longer code)
- WHEN deletion of "101" is attempted
- THEN the journal entry check uses exact match, "101" ≠ "10111"
- AND the result depends on other constraints (system account check would block level-3 deletion first)
