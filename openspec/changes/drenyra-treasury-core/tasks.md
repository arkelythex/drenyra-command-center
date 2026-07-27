# SDD Tasks: drenyra-treasury-core — Bank Accounts, Transactions, Reconciliation, Cashflow

| Field         | Value                   |
| ------------- | ----------------------- |
| **Change ID** | `drenyra-treasury-core` |
| **SDD Phase** | Tasks                   |
| **Status**    | Complete                |
| **Inputs**    | spec, design            |
| **Created**   | 2026-07-25              |

---

## Review Workload Forecast

| Field                   | Value                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| Estimated changed lines | ~9,200 total (Phase 0: ~3,000, Phase 1: ~2,200, Phase 2: ~2,000, Phase 3: ~2,000) |
| 400-line budget risk    | High — every phase exceeds 400 lines                                              |
| Chained PRs recommended | Yes                                                                               |
| Suggested split         | Phase 0 (3 PRs) → Phase 1 (2 PRs) → Phase 2 (2 PRs) → Phase 3 (2 PRs)             |
| Delivery strategy       | ask-on-risk                                                                       |
| Chain strategy          | pending                                                                           |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

---

## Phase Dependency Map

```
Phase 0 (Formalize)
  ├── PR 0.1: Domain + Schema + Migrations  ──── non-breaking, enables all other phases
  ├── PR 0.2: Tests + Docs                   ──── depends on 0.1
  └── PR 0.3: Contracts + OpenAPI            ──── depends on 0.1

Phase 1 (Prometeo Activation)
  ├── PR 1.1: Provider Abstraction           ──── depends on Phase 0 (bank_providers table)
  └── PR 1.2: Services + Routes + Scheduler  ──── depends on 1.1

Phase 2 (Shadow→Primary)
  ├── PR 2.1: Batch-Aware Reconciliation     ──── depends on Phase 0 (batches), Phase 1 (providers)
  └── PR 2.2: Cutover Engine + Dual Mode     ──── depends on 2.1

Phase 3 (Cashflow + Fiscal)
  ├── PR 3.1: Data Source Validation         ──── depends on Phase 0 (source column), Phase 1 (providers)
  └── PR 3.2: Confidence + Fiscal Reports    ──── depends on 3.1
```

---

## Phase 0 — Formalize Existing (Documentation, Tests, Contracts)

### PR 0.1: Domain Entities + Schema + Migrations

**Goal**: Introduce `ReconciliationBatch` and `ReconciliationRule` entities, extend existing tables, create new tables. All additive — zero behavior changes.

**Estimated lines**: ~1,050

#### 0.1.1 — RED: Write failing tests for ReconciliationBatch entity

- **Files**: `packages/domain/src/entities/__tests__/reconciliation-batch.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests cover: creation with valid period, status transitions (OPEN → IN_PROGRESS → PARTIALLY_MATCHED → CLOSED), discrepancy calculation, immutability after closure, rejection of invalid periods (end before start), rejection of modification after CLOSED status
  - All tests FAIL (entity doesn't exist yet)
- **Dependencies**: None
- **Estimated lines**: ~180
- [x] RED: Write failing ReconciliationBatch entity tests. <!-- sdd-owner: implementation -->

#### 0.1.2 — RED: Write failing tests for ReconciliationRule entity

- **Files**: `packages/domain/src/entities/__tests__/reconciliation-rule.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests cover: creation with valid conditions, priority ordering, activation/deactivation, JSON conditions validation, invalid rule type rejection
  - All tests FAIL
- **Dependencies**: None
- **Estimated lines**: ~120
- [x] RED: Write failing ReconciliationRule entity tests. <!-- sdd-owner: implementation -->

#### 0.1.3 — GREEN: Implement ReconciliationBatch entity

- **Files**: `packages/domain/src/entities/ReconciliationBatch.ts` (NEW)
- **Acceptance criteria**:
  - Aggregate root with: id, tenantId, bankAccountId, periodStart, periodEnd, status (OPEN/IN_PROGRESS/PARTIALLY_MATCHED/MATCHED/CLOSED_WITH_DISCREPANCY/CLOSED), openingBalance, closingBalance, matchedCount, unmatchedCount, discrepancyAmount, mode (MANUAL/AUTO), createdAt, closedAt
  - `close()` method enforces: PARTIALLY_MATCHED → CLOSED_WITH_DISCREPANCY, MATCHED → CLOSED; closedAt set to now; closed batches reject further modifications
  - `addMatch()` increments matchedCount; `addUnmatched()` increments unmatchedCount
  - `calculateDiscrepancy(closingBalance, totalCredits, totalDebits)` returns discrepancy amount
  - Uses `Money` value object for monetary fields (per fiscal-compliance skill)
  - 0.1.1 tests PASS
- **Dependencies**: 0.1.1
- **Estimated lines**: ~200
- [x] GREEN: Implement ReconciliationBatch entity. <!-- sdd-owner: implementation -->

#### 0.1.4 — GREEN: Implement ReconciliationRule entity

- **Files**: `packages/domain/src/entities/ReconciliationRule.ts` (NEW)
- **Acceptance criteria**:
  - Entity with: id, tenantId, name, ruleType, conditions (JSON), priority (int), isActive, createdAt
  - `deactivate()` sets isActive to false
  - `updatePriority(newPriority)` enforces positive integer
  - `updateConditions(newConditions)` validates JSON structure
  - 0.1.2 tests PASS
- **Dependencies**: 0.1.2
- **Estimated lines**: ~120
- [x] GREEN: Implement ReconciliationRule entity. <!-- sdd-owner: implementation -->

#### 0.1.5 — GREEN: Extend BankTransaction entity with source + externalId + reconciliationBatchId

- **Files**: `packages/domain/src/entities/BankTransaction.ts` (UPDATE)
- **Acceptance criteria**:
  - New fields: `source` (MANUAL | CSV_IMPORT | API_FEED, default MANUAL), `externalId` (string | null), `reconciliationBatchId` (UUID | null)
  - `assignToBatch(batchId)` sets reconciliationBatchId
  - `markReconciled()` sets isReconciled=true (existing behavior preserved, enhanced with batch awareness)
  - Existing tests in `packages/domain/src/__tests__/` continue to pass
- **Dependencies**: 0.1.3
- **Estimated lines**: ~60
- [x] GREEN: Extend BankTransaction entity. <!-- sdd-owner: implementation -->

#### 0.1.6 — GREEN: Extend BankAccount entity with providerId + lastSyncAt

- **Files**: `packages/domain/src/entities/BankAccount.ts` (UPDATE)
- **Acceptance criteria**:
  - New fields: `providerId` (UUID | null), `lastSyncAt` (Date | null)
  - `linkProvider(providerId)` sets the provider reference
  - `markSynced()` updates lastSyncAt to now
  - Existing tests continue to pass
- **Dependencies**: 0.1.3
- **Estimated lines**: ~50
- [x] GREEN: Extend BankAccount entity. <!-- sdd-owner: implementation -->

#### 0.1.7 — GREEN: Add repository interfaces for ReconciliationBatch and ReconciliationRule

- **Files**: `packages/domain/src/repositories/reconciliation-batch.repository.ts` (NEW), `packages/domain/src/repositories/reconciliation-rule.repository.ts` (NEW)
- **Acceptance criteria**:
  - `ReconciliationBatchRepository`: save, update, findById, findByBankAccount, findByStatus, findOpenByAccount, count
  - `ReconciliationRuleRepository`: save, update, findById, findByTenant, findActiveByTenant, findByPriority
  - Exported from `packages/domain/src/repositories/index.ts`
- **Dependencies**: 0.1.3, 0.1.4
- **Estimated lines**: ~120
- [x] GREEN: Add repository interfaces. <!-- sdd-owner: implementation -->

#### 0.1.8 — GREEN: Update persistence schema — banking.schema.ts (new columns)

- **Files**: `packages/persistence/src/schema/banking.schema.ts` (UPDATE)
- **Acceptance criteria**:
  - `bankTransactions` table: add `reconciliation_batch_id` UUID (nullable, FK to bank_reconciliations), `external_id` varchar(100) (nullable), `source` varchar(20) default 'MANUAL'
  - `bank_reconciliations` table: add `batch_reference` varchar(50), `mode` varchar(10) default 'MANUAL', `matched_count` integer default 0, `unmatched_count` integer default 0, `discrepancy_amount` decimal(19,4), `closed_at` timestamp, `closed_by` uuid
  - `bank_accounts` table: add `provider_id` UUID (nullable), `last_sync_at` timestamp (nullable)
  - Unique index on `bank_transactions(bank_account_id, external_id)` WHERE `external_id IS NOT NULL`
  - Existing Drizzle relations maintained
- **Dependencies**: 0.1.5, 0.1.6
- **Estimated lines**: ~80
- [x] GREEN: Update banking.schema.ts with new columns. <!-- sdd-owner: implementation -->

#### 0.1.9 — GREEN: Create reconciliation-rules.schema.ts

- **Files**: `packages/persistence/src/schema/reconciliation-rules.schema.ts` (NEW)
- **Acceptance criteria**:
  - `reconciliationRules` table: id (uuid PK), company_id (uuid FK), name (varchar), rule_type (varchar), conditions (jsonb), priority (integer), is_active (boolean default true), created_at (timestamp)
  - Index on `(company_id, priority)`
  - Exported from `packages/persistence/src/schema/index.ts`
- **Dependencies**: 0.1.4
- **Estimated lines**: ~40
- [x] GREEN: Create reconciliation-rules.schema.ts. <!-- sdd-owner: implementation -->

#### 0.1.10 — GREEN: Create bank-providers.schema.ts

- **Files**: `packages/persistence/src/schema/bank-providers.schema.ts` (NEW)
- **Acceptance criteria**:
  - `bankProviders` table: id (uuid PK), company_id (uuid FK), bank_account_id (uuid FK), provider_code (varchar — PROMETEO | MOCK), api_credentials (jsonb — encrypted), connection_status (varchar default 'DISCONNECTED'), feature_flags (jsonb), last_sync_at (timestamp), sync_error (text), created_at (timestamp), updated_at (timestamp)
  - Unique constraint on `(bank_account_id, provider_code)`
  - Exported from index.ts
- **Dependencies**: None
- **Estimated lines**: ~45
- [x] GREEN: Create bank-providers.schema.ts. <!-- sdd-owner: implementation -->

#### 0.1.11 — GREEN: Generate Phase 0 migration SQL

- **Files**: `packages/persistence/drizzle/000X_phase0_treasury_formalize.sql` (NEW)
- **Acceptance criteria**:
  - All ALTER TABLE statements for new columns (bankTransactions, bankReconciliations, bankAccounts)
  - CREATE TABLE for reconciliation_rules and bank_providers
  - CREATE UNIQUE INDEX for external_id
  - All additive — no DROP or data-modifying statements
  - Rollback script included as comment
- **Dependencies**: 0.1.8, 0.1.9, 0.1.10
- **Estimated lines**: ~55
- [x] GREEN: Generate Phase 0 migration. <!-- sdd-owner: implementation -->

---

### PR 0.2: Tests + Documentation

**Goal**: Close the test coverage gap per AD-03 test pyramid. No behavior changes.

**Estimated lines**: ~1,150

#### 0.2.1 — RED: Write failing domain entity unit tests for existing entities (gap coverage)

- **Files**: `packages/domain/src/entities/__tests__/bank-account.test.ts` (NEW), `packages/domain/src/entities/__tests__/bank-transaction.test.ts` (NEW)
- **Acceptance criteria**:
  - BankAccount tests: creation, activation/deactivation, provider linking, sync tracking, tenant isolation, duplicate account number detection, type validation
  - BankTransaction tests: creation with all sources (MANUAL, CSV_IMPORT, API_FEED), reconciliation state, batch assignment, amount precision (2 decimal places), date validation, idempotency key handling
  - Target coverage: ≥95% (from current ~60%)
  - Tests FAIL where entity methods are missing
- **Dependencies**: PR 0.1 (entities exist)
- **Estimated lines**: ~250
- [ ] RED: Write failing domain entity unit tests. <!-- sdd-owner: implementation -->

#### 0.2.2 — GREEN/TRIANGULATE: Fill domain entity gaps to make 0.2.1 pass

- **Files**: `packages/domain/src/entities/BankAccount.ts` (UPDATE), `packages/domain/src/entities/BankTransaction.ts` (UPDATE)
- **Acceptance criteria**:
  - Any missing validation/methods found by 0.2.1 are implemented
  - All 0.2.1 tests pass
  - Existing behavior preserved
- **Dependencies**: 0.2.1
- **Estimated lines**: ~100
- [ ] GREEN/TRIANGULATE: Fill domain entity gaps. <!-- sdd-owner: implementation -->

#### 0.2.3 — Write matching strategy documentation (JSDoc)

- **Files**: `apps/api/src/features/banking/domain/services/matching-strategy.ts` (UPDATE — JSDoc only)
- **Acceptance criteria**:
  - Every matching strategy (ReferenceMatchingStrategy, AmountDateMatchingStrategy, AmountEntityMatchingStrategy, FuzzyEntityMatchingStrategy, PartialPaymentMatchingStrategy) has complete JSDoc with: purpose, algorithm description, scoring formula, edge cases, example match
  - `MatchContext` and `MatchCandidate` interfaces fully documented
  - No behavior changes — documentation only
- **Dependencies**: None (docs-only)
- **Estimated lines**: ~200
- [ ] Write matching strategy JSDoc. <!-- sdd-owner: implementation -->

#### 0.2.4 — Write application service unit tests (ReconciliationService gap)

- **Files**: `apps/api/src/features/banking/__tests__/unit/reconciliation-service.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests for: autoReconcile with all 5 strategies, shadow mode comparison, partial payment matching, ambiguous match handling, rule priority ordering
  - Mock external dependencies (Go worker, DB)
  - Target coverage: ≥90% for ReconciliationService (from current ~40%)
- **Dependencies**: PR 0.1
- **Estimated lines**: ~250
- [ ] Write ReconciliationService unit tests. <!-- sdd-owner: implementation -->

#### 0.2.5 — Write application service unit tests (BankingApplicationService gap)

- **Files**: `apps/api/src/features/banking/__tests__/unit/banking-application-service.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests for: account CRUD, transaction CRUD, CSV import (valid, partial errors, column mapping), auto-reconcile delegation, summary computation
  - Mock repository layer
  - Target coverage: ≥90% (from current ~40%)
- **Dependencies**: PR 0.1
- **Estimated lines**: ~200
- [ ] Write BankingApplicationService unit tests. <!-- sdd-owner: implementation -->

#### 0.2.6 — Write API route integration tests (banking routes)

- **Files**: `apps/api/src/features/banking/__tests__/integration/banking-routes-full.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests for all existing banking endpoints: accounts CRUD, transactions CRUD, import, auto-reconcile, summary, shadow metrics, shadow cutover
  - HTTP-level tests using Elysia test harness (pattern from existing `banking.handlers.test.ts`)
  - Target coverage: ≥80% (from current ~30%)
- **Dependencies**: PR 0.1
- **Estimated lines**: ~350
- [ ] Write banking routes integration tests. <!-- sdd-owner: implementation -->

#### 0.2.7 — REFACTOR: Standardize banking schemas on Zod

- **Files**: `apps/api/src/features/banking/api/banking.schemas.ts` (UPDATE), create `apps/api/src/features/banking/domain/schemas/` (NEW)
- **Acceptance criteria**:
  - All validation schemas defined in Zod (shared domain layer)
  - Elysia route schemas derived from Zod schemas via `zod-to-elysia` or manual mapping
  - No duplicate validation logic between `banking.schemas.ts` and banking-providers
  - Existing API behavior unchanged
  - All existing tests pass
- **Dependencies**: 0.2.6
- **Estimated lines**: ~150
- [ ] REFACTOR: Standardize schemas on Zod. <!-- sdd-owner: implementation -->

---

### PR 0.3: Contracts + OpenAPI

**Goal**: Generate API documentation and formal contract tests.

**Estimated lines**: ~800

#### 0.3.1 — Generate OpenAPI spec for banking endpoints

- **Files**: `docs/api/banking-openapi.yaml` (NEW), setup script in `scripts/` or `apps/api/src/features/banking/api/openapi.ts` (NEW)
- **Acceptance criteria**:
  - OpenAPI 3.1 spec covering all banking endpoints (accounts, transactions, reconciliation, providers, cashflow)
  - Generated from Zod schemas (not hand-written)
  - Includes request/response schemas, error responses, auth requirements
  - Validated against OpenAPI spec (passes `redocly lint` or equivalent)
- **Dependencies**: 0.2.7 (Zod schemas)
- **Estimated lines**: ~300
- [ ] Generate OpenAPI spec. <!-- sdd-owner: implementation -->

#### 0.3.2 — Write contract tests for PrometeoService (existing)

- **Files**: `apps/api/src/features/banking-providers/__tests__/contract/prometeo-service.contract.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests for existing PrometeoService: login returns session key, getAccounts returns normalized list, getMovements returns normalized list with date filtering, logout cleans up session
  - Mock HTTP layer (Prometeo API responses)
  - Target coverage: 100% for PrometeoService (from current 0%)
  - Note: these cover the EXISTING implementation before Phase 1 refactors
- **Dependencies**: None
- **Estimated lines**: ~180
- [ ] Write PrometeoService contract tests. <!-- sdd-owner: implementation -->

#### 0.3.3 — Write contract test suite for BankProviderAdapter interface

- **Files**: `apps/api/src/features/banking-providers/__tests__/contract/provider-adapter.contract.ts` (NEW)
- **Acceptance criteria**:
  - Shared test suite factory `testBankProviderAdapter(createAdapter)` that any adapter implementation must pass
  - Contract tests: login → non-empty key on valid creds, login → throws on invalid creds, getAccounts → normalized list, getMovements → normalized list with date filtering, getMovements → respects date range, logout → no throw even with invalid session, getBalances → current + available balances
  - This file defines the contract; Phase 1 adapters will import and run it
- **Dependencies**: None (tests an interface, not implementation)
- **Estimated lines**: ~150
- [ ] Write BankProviderAdapter contract test suite. <!-- sdd-owner: implementation -->

#### 0.3.4 — TRIANGULATE: Verify full Phase 0 test suite

- **Run**: `bun run test` from monorepo root, targeting banking, domain, and persistence packages
- **Acceptance criteria**:
  - All new tests from PRs 0.1, 0.2, 0.3 pass
  - All existing tests continue to pass
  - Coverage meets or exceeds AD-03 targets: domain ≥95%, services ≥90%, API routes ≥80%
  - TypeScript compilation: `bun run typecheck` passes
- **Dependencies**: 0.3.3
- **Estimated lines**: ~0 (verification only)
- [ ] TRIANGULATE: Verify full Phase 0 test suite. <!-- sdd-owner: implementation -->

#### 0.3.5 — Save Phase 0 completion to Engram

- **Acceptance criteria**:
  - Save apply-progress to engram topic_key `sdd/drenyra-treasury-core/apply-progress` recording Phase 0 completion
  - Include: PRs merged, files changed, test results, coverage metrics
- **Dependencies**: 0.3.4
- **Estimated lines**: ~0 (memory only)
- [ ] Save Phase 0 progress to Engram. <!-- sdd-owner: implementation -->

---

## Phase 1 — Activate Prometeo Integration

### PR 1.1: Provider Abstraction Layer

**Goal**: Create `BankProviderAdapter` interface, `PrometeoAdapter`, `MockBankAdapter`, credential encryption. No endpoint changes yet.

**Estimated lines**: ~950

#### 1.1.1 — RED: Write failing tests for BankProviderAdapter interface

- **Files**: `apps/api/src/features/banking-providers/__tests__/unit/provider-adapter.interface.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests validate the interface contract: login, getAccounts, getMovements, getBalances, logout
  - TypeScript compilation verifies interface shape
  - Tests FAIL (no implementation yet)
- **Dependencies**: Phase 0 (contract tests exist)
- **Estimated lines**: ~80
- [ ] RED: Write failing BankProviderAdapter interface tests. <!-- sdd-owner: implementation -->

#### 1.1.2 — RED: Write failing tests for PrometeoAdapter

- **Files**: `apps/api/src/features/banking-providers/__tests__/unit/prometeo-adapter.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: login with encrypted credentials → returns session key, getAccounts → parses Prometeo response, getMovements → handles pagination, getBalances → returns current + available, handles HTTP errors (4xx, 5xx), handles timeout, decrypts credentials on-demand
  - Mock HTTP client
  - Tests FAIL
- **Dependencies**: 1.1.1
- **Estimated lines**: ~180
- [ ] RED: Write failing PrometeoAdapter tests. <!-- sdd-owner: implementation -->

#### 1.1.3 — GREEN: Implement BankProviderAdapter interface

- **Files**: `packages/domain/src/providers/bank-provider-adapter.interface.ts` (NEW)
- **Acceptance criteria**:
  - Interface with: `login(credentials: ProviderCredentials): Promise<ProviderSession>`, `getAccounts(session: ProviderSession): Promise<NormalizedAccount[]>`, `getMovements(session: ProviderSession, params: MovementParams): Promise<NormalizedMovement[]>`, `getBalances(session: ProviderSession): Promise<AccountBalances>`, `logout(session: ProviderSession): Promise<void>`
  - Normalized types: `NormalizedAccount` (id, number, type, currency, name), `NormalizedMovement` (externalId, date, valueDate, amount, currency, type, description, reference), `AccountBalances` (current, available)
  - Re-exported from `packages/domain/src/providers/index.ts`
  - 1.1.1 tests PASS
- **Dependencies**: 1.1.1
- **Estimated lines**: ~100
- [ ] GREEN: Implement BankProviderAdapter interface. <!-- sdd-owner: implementation -->

#### 1.1.4 — GREEN: Implement ProviderCredentials value object

- **Files**: `packages/domain/src/providers/provider-credentials.value-object.ts` (NEW)
- **Acceptance criteria**:
  - Value object with: providerCode, apiKey (encrypted at rest), apiSecret (encrypted at rest), encryption metadata
  - `encrypt(rawKey, rawSecret, encryptionKey): ProviderCredentials` — uses AES-256-GCM
  - `decrypt(encryptionKey): { apiKey, apiSecret }` — returns decrypted values
  - `toJSON()` — NEVER exposes raw credentials (redacted in logs/responses)
  - Credentials never appear in toString() or console output
- **Dependencies**: 1.1.3
- **Estimated lines**: ~80
- [ ] GREEN: Implement ProviderCredentials. <!-- sdd-owner: implementation -->

#### 1.1.5 — GREEN: Implement PrometeoAdapter (refactor from prometeo.service.ts)

- **Files**: `apps/api/src/features/banking-providers/infrastructure/prometeo.adapter.ts` (NEW — extracted from prometeo.service.ts)
- **Acceptance criteria**:
  - Implements `BankProviderAdapter`
  - Uses credential decryption on-demand (AD-05)
  - HTTP client with configurable base URL (sandbox/production)
  - Session key management (in-memory, 5min TTL per AD-06)
  - Maps Prometeo-specific response shapes to normalized types
  - Error handling: maps Prometeo error codes to `ProviderError`
  - 1.1.2 tests PASS
  - Original `prometeo.service.ts` is deprecated (kept for backward compat, marked `@deprecated`)
- **Dependencies**: 1.1.2, 1.1.3, 1.1.4
- **Estimated lines**: ~220
- [ ] GREEN: Implement PrometeoAdapter. <!-- sdd-owner: implementation -->

#### 1.1.6 — GREEN: Implement MockBankAdapter

- **Files**: `apps/api/src/features/banking-providers/infrastructure/mock-bank.adapter.ts` (NEW)
- **Acceptance criteria**:
  - Implements `BankProviderAdapter`
  - Deterministic synthetic data: login always succeeds, getAccounts returns predefined accounts, getMovements returns synthetic transactions with configurable count and date range, getBalances returns consistent balances
  - Seeds: `MockBankAdapter.seed(seed)` for reproducible test data
  - No external HTTP calls
  - Passes the shared contract test suite from 0.3.3
- **Dependencies**: 1.1.3
- **Estimated lines**: ~140
- [ ] GREEN: Implement MockBankAdapter. <!-- sdd-owner: implementation -->

#### 1.1.7 — GREEN: Create encryption service for credentials

- **Files**: `apps/api/src/features/banking-providers/infrastructure/credential-encryption.service.ts` (NEW)
- **Acceptance criteria**:
  - `encrypt(plaintext: string): { ciphertext: string, iv: string, tag: string }` using AES-256-GCM
  - `decrypt(ciphertext, iv, tag): string`
  - Key derived from `process.env.ENCRYPTION_KEY` (512-bit hex)
  - Fails fast if ENCRYPTION_KEY is not set in production
  - Unit tested with known vectors
- **Dependencies**: 1.1.4
- **Estimated lines**: ~80
- [ ] GREEN: Implement credential encryption service. <!-- sdd-owner: implementation -->

#### 1.1.8 — GREEN: Register contract tests for both adapters

- **Files**: `apps/api/src/features/banking-providers/__tests__/contract/prometeo-adapter.contract.test.ts` (NEW), `apps/api/src/features/banking-providers/__tests__/contract/mock-adapter.contract.test.ts` (NEW)
- **Acceptance criteria**:
  - Both test files import and run `testBankProviderAdapter` from 0.3.3
  - PrometeoAdapter tests use mocked HTTP layer
  - MockBankAdapter tests use real instance (no HTTP needed)
  - All contract tests pass
- **Dependencies**: 0.3.3, 1.1.5, 1.1.6
- **Estimated lines**: ~70
- [ ] GREEN: Register contract tests for both adapters. <!-- sdd-owner: implementation -->

---

### PR 1.2: Application Services + API Routes + Scheduler

**Goal**: Wire adapters into application services, expose provider API endpoints, schedule syncs.

**Estimated lines**: ~1,050

#### 1.2.1 — RED: Write failing tests for BankProviderService

- **Files**: `apps/api/src/features/banking-providers/__tests__/unit/bank-provider-service.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: connect → resolves adapter, encrypts creds, stores provider record, returns connection status; sync → fetches movements since lastSyncAt, skips duplicates, updates balances, triggers auto-reconcile; disconnect → revokes session, updates status; connect failure → sets status ERROR with syncError; sync idempotency → same external_id twice only imported once
  - Mock BankProviderAdapter and repositories
  - Tests FAIL
- **Dependencies**: PR 1.1
- **Estimated lines**: ~250
- [ ] RED: Write failing BankProviderService tests. <!-- sdd-owner: implementation -->

#### 1.2.2 — GREEN: Implement BankProviderService

- **Files**: `apps/api/src/features/banking-providers/application/services/bank-provider.service.ts` (NEW)
- **Acceptance criteria**:
  - `connect(accountId, providerCode, rawCredentials)` → resolves adapter, encrypts creds via credential-encryption.service, stores/updates bank_providers record, calls adapter.login, updates connectionStatus=CONNECTED, returns session metadata
  - `sync(providerId)` → decrypts creds, calls adapter.login + getMovements(since: lastSyncAt), idempotency gate via external_id unique constraint, maps to BankTransaction(source: API_FEED), updates account.lastSyncAt + balances, returns sync summary (imported/duplicates/errors)
  - `disconnect(providerId)` → calls adapter.logout, updates connectionStatus=DISCONNECTED, clears session
  - `getAccounts(providerId)` → returns provider's account list via adapter
  - `resolveAdapter(providerCode)` → returns PrometeoAdapter | MockBankAdapter based on code
  - Feature flag awareness: respects `liveFeed`, `syncFrequency`, `syncWindowDays` from bank_providers.feature_flags (AD-07)
  - All 1.2.1 tests PASS
- **Dependencies**: 1.2.1
- **Estimated lines**: ~250
- [ ] GREEN: Implement BankProviderService. <!-- sdd-owner: implementation -->

#### 1.2.3 — GREEN: Implement provider commands (connect, sync, disconnect)

- **Files**: `apps/api/src/features/banking-providers/application/commands/connect-provider.command.ts` (NEW), `sync-provider.command.ts` (NEW), `disconnect-provider.command.ts` (NEW)
- **Acceptance criteria**:
  - Each command validates input (Zod schema), delegates to BankProviderService, returns typed result
  - ConnectProviderCommand: validates credentials shape, providerCode enum
  - SyncProviderCommand: validates providerId exists and is CONNECTED
  - DisconnectProviderCommand: validates providerId, idempotent (disconnecting already-disconnected is a no-op)
- **Dependencies**: 1.2.2
- **Estimated lines**: ~120
- [ ] GREEN: Implement provider commands. <!-- sdd-owner: implementation -->

#### 1.2.4 — GREEN: Implement sync scheduler

- **Files**: `apps/api/src/features/banking-providers/application/scheduler/bank-sync.scheduler.ts` (NEW)
- **Acceptance criteria**:
  - Uses `node-cron` (or BullMQ if already in stack): daily sync at configurable hour (default 02:00 UTC)
  - Discovers all bank_providers with `feature_flags.liveFeed === true` and `connectionStatus === CONNECTED`
  - Respects per-account `feature_flags.syncFrequency`: daily/hourly/manual
  - Respects `feature_flags.syncWindowDays` for movement date range
  - Handles partial failures: one provider failure doesn't block others
  - Logs sync summary per provider
  - Activated via env var `BANK_SYNC_SCHEDULER_ENABLED=true` (disabled by default per rollout plan)
- **Dependencies**: 1.2.2
- **Estimated lines**: ~90
- [ ] GREEN: Implement sync scheduler. <!-- sdd-owner: implementation -->

#### 1.2.5 — GREEN: Update banking-providers API routes

- **Files**: `apps/api/src/features/banking-providers/api/routes.ts` (UPDATE)
- **Acceptance criteria**:
  - `POST /api/banking/providers` → register provider connection (delegates to ConnectProviderCommand)
  - `POST /api/banking/providers/{id}/connect` → establish connection
  - `POST /api/banking/providers/{id}/disconnect` → disconnect
  - `GET /api/banking/providers` → list provider connections for tenant
  - `GET /api/banking/providers/{id}/accounts` → get provider's bank accounts
  - `GET /api/banking/providers/{id}/movements` → get provider's movements
  - Deprecated old endpoints: `POST /api/banking-providers/connect` (redirect to new path), `GET /api/banking-providers/accounts`, `GET /api/banking-providers/movements`
  - Credential values NEVER appear in API responses (redacted)
  - All endpoints tenant-scoped
- **Dependencies**: 1.2.3
- **Estimated lines**: ~150
- [ ] GREEN: Update banking-providers API routes. <!-- sdd-owner: implementation -->

#### 1.2.6 — GREEN: Update /api/banking/accounts/{id}/sync to trigger provider sync

- **Files**: `apps/api/src/features/banking/api/banking.handlers.ts` (UPDATE), `apps/api/src/features/banking/api/banking.routes.ts` (UPDATE)
- **Acceptance criteria**:
  - `POST /api/banking/accounts/{id}/sync` now: checks if account has providerId, if yes → delegates to BankProviderService.sync(providerId), if no → returns 400 "No provider connected"
  - Response includes sync summary (synced, duplicates, errors, lastSyncAt)
  - On successful sync with new transactions → triggers auto-reconcile chain (Phase 2, still shadow)
- **Dependencies**: 1.2.2
- **Estimated lines**: ~60
- [ ] GREEN: Update account sync endpoint. <!-- sdd-owner: implementation -->

#### 1.2.7 — GREEN: Add BankProvider persistence repository implementation

- **Files**: `apps/api/src/features/banking-providers/infrastructure/bank-provider.repository.ts` (NEW)
- **Acceptance criteria**:
  - Implements CRUD against `bank_providers` table via Drizzle
  - findByAccountAndCode, findByTenant, updateConnectionStatus, updateLastSyncAt, updateSyncError
  - Tenant-scoped queries
- **Dependencies**: PR 0.1 (schema)
- **Estimated lines**: ~100
- [ ] GREEN: Implement BankProvider repository. <!-- sdd-owner: implementation -->

#### 1.2.8 — TRIANGULATE: Integration test — full sync flow

- **Files**: `apps/api/src/features/banking-providers/__tests__/integration/sync-flow.integration.test.ts` (NEW)
- **Acceptance criteria**:
  - Full flow: register provider → connect → get accounts → get movements → persist → sync summary → auto-reconcile trigger
  - Idempotency: same external_id twice → second import skipped
  - Provider failure: network error → connectionStatus=ERROR, syncError set
  - MockBankAdapter for deterministic test data
  - Uses test database (not production)
- **Dependencies**: 1.2.5, 1.2.6
- **Estimated lines**: ~280
- [ ] TRIANGULATE: Integration test — full sync flow. <!-- sdd-owner: implementation -->

---

## Phase 2 — Shadow Reconciliation → Primary Promotion

### PR 2.1: Batch-Aware Reconciliation Engine

**Goal**: Integrate ReconciliationBatch into auto-reconcile flow. No mode change yet — still shadow.

**Estimated lines**: ~950

#### 2.1.1 — RED: Write failing tests for ReconciliationBatch (banking context)

- **Files**: `apps/api/src/features/banking/__tests__/unit/reconciliation-batch.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: batch creation with period scoping, batch lifecycle (OPEN → IN_PROGRESS → auto-match → PARTIALLY_MATCHED → close → CLOSED_WITH_DISCREPANCY), perfect match closure (CLOSED), discrepancy calculation, batch immutability after closure, rejection of overlapping batches for same account
  - Tests FAIL
- **Dependencies**: Phase 0 (ReconciliationBatch domain entity)
- **Estimated lines**: ~200
- [ ] RED: Write failing ReconciliationBatch tests (banking context). <!-- sdd-owner: implementation -->

#### 2.1.2 — GREEN: Implement ReconciliationBatch aggregate (banking feature)

- **Files**: `apps/api/src/features/banking/domain/entities/reconciliation-batch.ts` (NEW)
- **Acceptance criteria**:
  - Wraps domain ReconciliationBatch entity with banking-specific logic
  - Date period scoping: batch only includes transactions within periodStart–periodEnd
  - Lifecycle state machine: OPEN → IN_PROGRESS → PARTIALLY_MATCHED → (CLOSED | CLOSED_WITH_DISCREPANCY)
  - `startProcessing()` transitions OPEN → IN_PROGRESS
  - `addMatchResult(match)` updates matchedCount/unmatchedCount
  - `close(closingBalance, totalCredits, totalDebits)` calculates discrepancy, transitions to CLOSED or CLOSED_WITH_DISCREPANCY, sets closedAt
  - Closed batches reject: addMatch, addUnmatched, close (idempotent)
  - 2.1.1 tests PASS
- **Dependencies**: 2.1.1
- **Estimated lines**: ~180
- [ ] GREEN: Implement ReconciliationBatch (banking feature). <!-- sdd-owner: implementation -->

#### 2.1.3 — GREEN: Refactor ReconciliationService to be batch-aware

- **Files**: `apps/api/src/features/banking/application/services/reconciliation.service.ts` (REFACTOR)
- **Acceptance criteria**:
  - `autoReconcile()` now: creates a ReconciliationBatch (mode: AUTO), fetches unreconciled transactions within batch period, runs matching engine, records matches in batch, transitions batch to PARTIALLY_MATCHED, auto-closes batch if all matched
  - Existing single-transaction reconciliation still works (backward compat)
  - Existing tests continue to pass
  - Batch-aware methods: `autoReconcileBatch(accountId, periodStart, periodEnd)`, `getBatchMatches(batchId)`, `closeBatch(batchId)`
- **Dependencies**: 2.1.2
- **Estimated lines**: ~250
- [ ] GREEN: Refactor ReconciliationService to be batch-aware. <!-- sdd-owner: implementation -->

#### 2.1.4 — GREEN: Add batch API endpoints

- **Files**: `apps/api/src/features/banking/api/banking.routes.ts` (UPDATE), `apps/api/src/features/banking/api/banking.handlers.ts` (UPDATE)
- **Acceptance criteria**:
  - `POST /api/banking/reconciliation/batches` → create batch (body: bankAccountId, periodStart, periodEnd, mode)
  - `GET /api/banking/reconciliation/batches/{id}` → get batch details with matches
  - `POST /api/banking/reconciliation/batches/{id}/close` → close batch
  - `POST /api/banking/reconciliation/batches/{id}/matches` → create manual match
  - `POST /api/banking/reconciliation/batches/{id}/suggest` → get auto-match suggestions
  - `POST /api/banking/reconciliation/rules` → create rule
  - `GET /api/banking/reconciliation/rules` → list rules
  - `PATCH /api/banking/reconciliation/rules/{id}` → update rule
  - All endpoints tenant-scoped
  - All endpoints enforce batch immutability (reject writes to closed batches)
- **Dependencies**: 2.1.2, 2.1.3
- **Estimated lines**: ~200
- [ ] GREEN: Add batch API endpoints. <!-- sdd-owner: implementation -->

#### 2.1.5 — GREEN: Add reconciliation batch repository implementation

- **Files**: `apps/api/src/features/banking/infrastructure/reconciliation-batch.repository.ts` (NEW)
- **Acceptance criteria**:
  - Implements ReconciliationBatchRepository from domain
  - CRUD against bank_reconciliations table (extended in Phase 0)
  - Batch-scoped queries: findByBankAccount, findByStatus, findOpenByAccount
  - Matches stored in transaction_reconciliation_matches table
  - Supports batch_reference generation: `BATCH-{YYYY-MM}-{bankCode}-{seq}`
- **Dependencies**: Phase 0 (schema), 2.1.2
- **Estimated lines**: ~150
- [ ] GREEN: Implement reconciliation batch repository. <!-- sdd-owner: implementation -->

#### 2.1.6 — TRIANGULATE: Integration test — batch lifecycle

- **Files**: `apps/api/src/features/banking/__tests__/integration/reconciliation-batch-lifecycle.test.ts` (NEW)
- **Acceptance criteria**:
  - Create batch → add manual matches → suggest auto-matches → confirm → close → verify immutability
  - Discrepancy calculation: openingBalance=10000, closingBalance=12500, credits=3000, debits=500 → discrepancy=0
  - Non-zero discrepancy flagged in batch summary
  - Attempt to modify closed batch returns 409 Conflict
  - Uses test database
- **Dependencies**: 2.1.4
- **Estimated lines**: ~250
- [ ] TRIANGULATE: Integration test — batch lifecycle. <!-- sdd-owner: implementation -->

---

### PR 2.2: Cutover Engine + Dual Mode

**Goal**: Implement progressive cutover SHADOW → DUAL → PRIMARY with quantitative gates and circuit breaker.

**Estimated lines**: ~950

#### 2.2.1 — RED: Write failing tests for CutoverEvaluator

- **Files**: `apps/api/src/features/banking/__tests__/unit/cutover-decision.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: evaluateCutover → GO when all gates pass (≥20 successfulRuns, ≤10% failureRate, ≤5% discrepancyRate), NO_GO when shadow disabled or thresholds exceeded, INSUFFICIENT_DATA when runs < 20; zero runs → INSUFFICIENT_DATA; 19 runs all clean → INSUFFICIENT_DATA; 20 runs with 15% failureRate → NO_GO; 20 runs with 8% discrepancyRate → NO_GO; gate configuration overrides
  - Tests FAIL
- **Dependencies**: None (depends on shadow run data shape, not implementation)
- **Estimated lines**: ~200
- [ ] RED: Write failing CutoverEvaluator tests. <!-- sdd-owner: implementation -->

#### 2.2.2 — GREEN: Implement CutoverEvaluator

- **Files**: `apps/api/src/features/banking/application/services/reconciliation-cutover.service.ts` (NEW)
- **Acceptance criteria**:
  - `evaluateCutover(accountId, windowRuns?)` → queries shadow_runs, computes metrics, returns DecisionReport
  - Configurable gates via env vars: `MIN_SUCCESSFUL_RUNS` (default 20), `MAX_FAILURE_RATE` (default 0.10), `MAX_DISCREPANCY_RATE` (default 0.05)
  - DecisionReport: decision (GO | NO_GO | INSUFFICIENT_DATA), metrics (totalRuns, successfulRuns, failureRate, discrepancyRate, averageDiscrepancy), gateResults per gate, recommendation
  - `applyCutover(accountId, targetMode)` → updates reconciliation mode (SHADOW → DUAL → PRIMARY)
  - Circuit breaker: if in DUAL or PRIMARY, monitors discrepancy rate; if >10%, auto-reverts to SHADOW
  - 2.2.1 tests PASS
- **Dependencies**: 2.2.1
- **Estimated lines**: ~220
- [ ] GREEN: Implement CutoverEvaluator. <!-- sdd-owner: implementation -->

#### 2.2.3 — GREEN: Update ReconciliationShadowService for dual mode

- **Files**: `apps/api/src/features/banking/application/services/reconciliation-shadow.service.ts` (UPDATE)
- **Acceptance criteria**:
  - Respects `ARKELYTHEX_RECONCILIATION_MODE` env var: `shadow` → current behavior (local engine writes, Go worker compares), `dual` → both engines write production, comparison still logged, `primary` → Go worker is primary reconciler, local engine decommissioned or fallback
  - Shadow metrics endpoint extended: includes mode info, cutover readiness, batch-level metrics
  - Cutover endpoint: delegates to CutoverEvaluator
  - Existing tests continue to pass
  - Dual mode: both engines' results are persisted, discrepancies logged but non-blocking
- **Dependencies**: 2.2.2, 2.1.3
- **Estimated lines**: ~180
- [ ] GREEN: Update ReconciliationShadowService for dual mode. <!-- sdd-owner: implementation -->

#### 2.2.4 — GREEN: Add cutover API endpoints

- **Files**: `apps/api/src/features/banking/api/banking.routes.ts` (UPDATE), `apps/api/src/features/banking/api/banking.handlers.ts` (UPDATE)
- **Acceptance criteria**:
  - `POST /api/banking/reconciliation/cutover` → evaluate cutover readiness (returns DecisionReport)
  - `POST /api/banking/reconciliation/cutover/apply` → apply cutover decision (admin-only, requires explicit confirmation)
  - `GET /api/banking/reconciliation-shadow/metrics` extended: includes `mode`, `cutoverReadiness`, `batchMetrics`
  - `GET /api/banking/reconciliation-shadow/cutover` extended: includes batch-level metrics, per-strategy breakdown
  - Existing shadow endpoints maintain backward compatibility
- **Dependencies**: 2.2.2, 2.2.3
- **Estimated lines**: ~120
- [ ] GREEN: Add cutover API endpoints. <!-- sdd-owner: implementation -->

#### 2.2.5 — TRIANGULATE: Integration test — shadow to primary cutover

- **Files**: `apps/api/src/features/banking/__tests__/integration/shadow-to-primary-cutover.test.ts` (NEW)
- **Acceptance criteria**:
  - Setup: 20 successful shadow runs with low discrepancy
  - evaluateCutover → GO
  - applyCutover(SHADOW→DUAL) → mode transitions, both engines write
  - 5 dual cycles clean → applyCutover(DUAL→PRIMARY) → Go worker primary, local decommissioned
  - Circuit breaker: inject high discrepancy in PRIMARY → auto-revert to SHADOW
  - Uses test database with seeded shadow run data
- **Dependencies**: 2.2.4
- **Estimated lines**: ~300
- [ ] TRIANGULATE: Integration test — shadow to primary cutover. <!-- sdd-owner: implementation -->

#### 2.2.6 — TRIANGULATE: Integration test — dual mode

- **Files**: `apps/api/src/features/banking/__tests__/integration/dual-mode.test.ts` (NEW)
- **Acceptance criteria**:
  - In dual mode: local engine runs + Go worker runs, both write production data
  - Comparison results logged to reconciliation_shadow_runs
  - Discrepancies are non-blocking (logged, not thrown)
  - Metrics endpoint reflects dual mode status
  - Uses test database
- **Dependencies**: 2.2.4
- **Estimated lines**: ~200
- [ ] TRIANGULATE: Integration test — dual mode. <!-- sdd-owner: implementation -->

---

## Phase 3 — Cashflow Data Source Validation + Fiscal Reports

### PR 3.1: Data Source Validation

**Goal**: Implement DataSourceValidator and confidence model per AD-11/AD-12.

**Estimated lines**: ~850

#### 3.1.1 — RED: Write failing tests for DataSourceValidator

- **Files**: `apps/api/src/features/cashflow/__tests__/unit/data-source-validator.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: validate(accountId) with PROMETEO + CONNECTED + fresh sync → confidence HIGH, source REAL; PROMETEO + CONNECTED + stale (>48h) → confidence MEDIUM, stale flag; MOCK provider → confidence LOW, source SIMULATED, warning; no provider → source USER_PROVIDED; PROMETEO + DISCONNECTED → confidence UNKNOWN; empty bank account → confidence UNKNOWN, no data
  - Tests FAIL
- **Dependencies**: Phase 0 (source column), Phase 1 (providers table)
- **Estimated lines**: ~180
- [ ] RED: Write failing DataSourceValidator tests. <!-- sdd-owner: implementation -->

#### 3.1.2 — GREEN: Implement DataSourceValidator

- **Files**: `apps/api/src/features/cashflow/application/services/cashflow-data-source.service.ts` (NEW)
- **Acceptance criteria**:
  - `validate(accountId): DataSourceValidation` → returns validation result with confidence level and metadata
  - Confidence logic per AD-12: HIGH (real provider + fresh <48h + 90d+ history + AR/AP complete), MEDIUM (real provider but stale 48h-7d or 30-90d history), LOW (MOCK/no provider/<30d history/manual only), UNKNOWN (no data)
  - `validateAll(tenantId): DataSourceValidation[]` → validates all active accounts
  - DataFreshness enum: FRESH (≤48h), STALE (48h-7d), EXPIRED (>7d)
  - DataSource type: REAL, SIMULATED, USER_PROVIDED
  - 3.1.1 tests PASS
- **Dependencies**: 3.1.1
- **Estimated lines**: ~150
- [ ] GREEN: Implement DataSourceValidator. <!-- sdd-owner: implementation -->

#### 3.1.3 — GREEN: Implement DataSourceValidation value object

- **Files**: `apps/api/src/features/cashflow/domain/data-source-validation.ts` (NEW)
- **Acceptance criteria**:
  - Value object with: accountId, dataSource (type, provider, lastSyncAt, freshness), confidence (historicalData, projectedInflows, projectedOutflows, overall), warnings[], generatedAt
  - `toJSON()` produces the shape from AD-12
  - `isProductionReady()` → true only if type=REAL and overall=HIGH
  - `hasWarnings()` → true if warnings non-empty
- **Dependencies**: None
- **Estimated lines**: ~80
- [ ] GREEN: Implement DataSourceValidation value object. <!-- sdd-owner: implementation -->

#### 3.1.4 — GREEN: Update CashflowProjection domain entity with DataSourceMeta

- **Files**: `apps/api/src/features/cashflow/domain/cashflow-projection.ts` (UPDATE)
- **Acceptance criteria**:
  - Add `dataSource` field: DataSourceValidation (nullable for backward compat)
  - Add `confidence` field: { historicalData, projectedInflows, projectedOutflows, overall }
  - `toJSON()` includes dataSource and confidence when available
  - Existing tests continue to pass (projection creation without dataSource still works)
- **Dependencies**: 3.1.3
- **Estimated lines**: ~60
- [ ] GREEN: Update CashflowProjection with DataSourceMeta. <!-- sdd-owner: implementation -->

#### 3.1.5 — GREEN: Update cashflow queries with validation

- **Files**: `apps/api/src/features/cashflow/application/queries/get-cashflow-projection.query.ts` (UPDATE), `get-actual-cashflow.query.ts` (UPDATE), `get-cashflow-forecast.query.ts` (UPDATE), `get-cashflow-variance.query.ts` (UPDATE)
- **Acceptance criteria**:
  - `getCashflowProjection` now: validates data source before generating projection, includes `dataSource` + `confidence` metadata in response (per AD-12 JSON shape)
  - `getActualCashflow` now: includes source provenance per transaction (API_FEED vs MANUAL vs CSV_IMPORT)
  - `getCashflowForecast` now: includes confidence metadata, historical data source info
  - `getCashflowVariance` now: includes source comparison (projected based on what vs actual from what)
  - Mock provider accounts flagged with warning in response headers/metadata
  - Existing tests updated to include new fields
- **Dependencies**: 3.1.2, 3.1.4
- **Estimated lines**: ~220
- [ ] GREEN: Update cashflow queries with validation. <!-- sdd-owner: implementation -->

#### 3.1.6 — TRIANGULATE: Integration test — projection with real vs simulated data

- **Files**: `apps/api/src/features/cashflow/__tests__/integration/projection-real-data.test.ts` (NEW)
- **Acceptance criteria**:
  - Setup: PROMETEO-connected account with 90+ days history + AR/AP → confidence HIGH
  - Setup: MOCK-provider account → confidence LOW, warning in response
  - Setup: no-provider account (manual only) → confidence USER_PROVIDED
  - Verify projection response includes dataSource + confidence metadata
  - Verify actual cashflow includes source provenance
  - Uses test database
- **Dependencies**: 3.1.5
- **Estimated lines**: ~250
- [ ] TRIANGULATE: Integration test — projection with real vs simulated data. <!-- sdd-owner: implementation -->

---

### PR 3.2: Fiscal Reports (ITF, PLE, Detractions)

**Goal**: Implement fiscal compliance reports: ITF calculation, SUNAT PLE export, detraction rates integration.

**Estimated lines**: ~950

#### 3.2.1 — RED: Write failing tests for ITF calculator

- **Files**: `packages/domain/src/__tests__/fiscal/itf-calculator.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: ITF on PEN 5,000 at 0.005% → 0.25; ITF on PEN 0 → 0; non-PEN currency → 0 (no ITF); amount < 1000 → 0 (no ITF on small transactions per SUNAT rule); ITF rate change → uses configured rate; banker's rounding to 2 decimal places
  - Tests FAIL
- **Dependencies**: None
- **Estimated lines**: ~130
- [ ] RED: Write failing ITF calculator tests. <!-- sdd-owner: implementation -->

#### 3.2.2 — GREEN: Implement ITF calculator

- **Files**: `packages/domain/src/fiscal/itf-calculator.ts` (NEW)
- **Acceptance criteria**:
  - `calculateITF(amount: Money, currency: Currency, rateBps?: number): Money`
  - Reads rate from `ITF_RATE_BPS` env var or domain registry (default 5 bps = 0.005%)
  - Only applies to PEN transactions ≥ 1000 (SUNAT rule)
  - Uses banker's rounding to 2 decimal places
  - Uses Money value object (never raw floats per fiscal-compliance skill)
  - 3.2.1 tests PASS
- **Dependencies**: 3.2.1
- **Estimated lines**: ~60
- [ ] GREEN: Implement ITF calculator. <!-- sdd-owner: implementation -->

#### 3.2.3 — GREEN: Integrate ITF into transaction recording

- **Files**: `apps/api/src/features/banking/application/services/banking.application-service.ts` (UPDATE)
- **Acceptance criteria**:
  - When a DEBIT transaction is created in PEN with amount ≥ 1000: auto-calculate ITF, append to transaction metadata
  - ITF amount stored in `bank_transactions.itf_amount` column (added in Phase 0 migration)
  - Does not affect CREDIT transactions or non-PEN transactions
  - Existing tests updated
- **Dependencies**: 3.2.2
- **Estimated lines**: ~50
- [ ] GREEN: Integrate ITF into transaction recording. <!-- sdd-owner: implementation -->

#### 3.2.4 — GREEN: Implement ITF report endpoint

- **Files**: `apps/api/src/features/banking/api/banking.routes.ts` (UPDATE), `apps/api/src/features/banking/api/banking.handlers.ts` (UPDATE)
- **Acceptance criteria**:
  - `GET /api/banking/reports/itf?year=2026&month=07` → aggregates all ITF amounts for PEN transactions in period
  - Response per spec: { period, itfRate, totalITF, transactions: [{ transactionId, date, amount, itfAmount }] }
  - Tenant-scoped
  - CSV export via `Accept: text/csv` header
- **Dependencies**: 3.2.3
- **Estimated lines**: ~80
- [ ] GREEN: Implement ITF report endpoint. <!-- sdd-owner: implementation -->

#### 3.2.5 — GREEN: Implement detraction rates table + calculator

- **Files**: `packages/persistence/src/schema/detraction-rates.schema.ts` (NEW), `packages/domain/src/fiscal/detraction-calculator.ts` (NEW)
- **Acceptance criteria**:
  - `detractionRates` table: id, service_type, rate_percent, effective_from, effective_to, sunat_code
  - `DetractionCalculator.calculate(amount: Money, serviceType: string, date?: Date): { detractionAmount: Money, netAmount: Money, applicableRate: number }`
  - Reads rate from DB for given service type and effective date
  - Uses Money value object (never raw floats)
  - Rates are DB-configurable with effective dates (not hardcoded per AD in design)
  - Migration: `packages/persistence/drizzle/000Z_detraction_rates.sql` (NEW)
- **Dependencies**: None
- **Estimated lines**: ~130
- [ ] GREEN: Implement detraction rates + calculator. <!-- sdd-owner: implementation -->

#### 3.2.6 — GREEN: Implement PLE report exporter

- **Files**: `apps/api/src/features/banking/application/services/ple-report.service.ts` (NEW), `packages/infrastructure/src/sunat/ple-formats/banking-ple.format.ts` (NEW)
- **Acceptance criteria**:
  - `GET /api/banking/reports/ple?period=2026-07` → exports all bank transactions in SUNAT PLE format
  - PLE format follows official SUNAT banking schema (fixed-width or CSV per spec)
  - Response with `Content-Disposition: attachment; filename="PLE_BANCOS_202607.csv"`
  - All transactions scoped to tenant
  - Handles empty periods gracefully (empty CSV with headers)
- **Dependencies**: Phase 0 (transactions with source field)
- **Estimated lines**: ~180
- [ ] GREEN: Implement PLE report exporter. <!-- sdd-owner: implementation -->

#### 3.2.7 — GREEN: Implement reconciliation report endpoint

- **Files**: `apps/api/src/features/banking/api/banking.routes.ts` (UPDATE), `apps/api/src/features/banking/api/banking.handlers.ts` (UPDATE), `apps/api/src/features/banking/application/services/reconciliation-report.service.ts` (NEW)
- **Acceptance criteria**:
  - `GET /api/banking/reports/reconciliation?period=2026-07` → generates monthly reconciliation report
  - Response per spec: { period, bankAccountId, openingBalance, closingBalance, matchedCount, unmatchedCount, discrepancyAmount, outstandingItems, generatedAt }
  - Queries across all batches for the period (aggregates)
  - CSV/PDF export (CSV via Accept header, PDF deferred)
- **Dependencies**: Phase 2 (batch-aware reconciliation)
- **Estimated lines**: ~120
- [ ] GREEN: Implement reconciliation report endpoint. <!-- sdd-owner: implementation -->

#### 3.2.8 — TRIANGULATE: Write fiscal report integration tests

- **Files**: `apps/api/src/features/banking/__tests__/integration/fiscal-reports.test.ts` (NEW)
- **Acceptance criteria**:
  - ITF report: seed PEN transactions ≥1000 and <1000, verify correct aggregation
  - PLE report: seed transactions, verify CSV structure matches SUNAT schema
  - Reconciliation report: seed closed batches, verify report aggregation
  - CSV export content-type and structure verified
  - Uses test database
- **Dependencies**: 3.2.4, 3.2.6, 3.2.7
- **Estimated lines**: ~250
- [ ] TRIANGULATE: Write fiscal report integration tests. <!-- sdd-owner: implementation -->

#### 3.2.9 — Detraction unit tests

- **Files**: `packages/domain/src/__tests__/fiscal/detraction-calculator.test.ts` (NEW)
- **Acceptance criteria**:
  - Tests: 12% on PEN 10,000 → detraction 1,200, net 8,800; effective date filtering (rate change mid-period); unknown service type → throws; amount 0 → detraction 0; non-PEN currency → throws; multiple rates for same service, picks correct by effective date
- **Dependencies**: 3.2.5
- **Estimated lines**: ~150
- [ ] GREEN: Write detraction calculator unit tests. <!-- sdd-owner: implementation -->

---

## Cross-Cutting Verification

### Final Verification Gate

- [ ] Run full test suite: `bun run test` — all packages, all phases. <!-- sdd-owner: implementation -->
- [ ] Run type checking: `bun run typecheck` — zero errors. <!-- sdd-owner: implementation -->
- [ ] Run linting: `bun run lint:all` — zero errors. <!-- sdd-owner: implementation -->
- [ ] Verify all deprecated endpoints have `@deprecated` JSDoc and migration path documented. <!-- sdd-owner: implementation -->
- [ ] Verify encryption: `ENCRYPTION_KEY` is required in production, provider credentials never appear in API responses or logs. <!-- sdd-owner: implementation -->
- [ ] Verify tenant isolation: cross-tenant queries rejected for all new endpoints. <!-- sdd-owner: implementation -->
- [ ] Save final apply-progress to engram topic_key `sdd/drenyra-treasury-core/apply-progress`. <!-- sdd-owner: implementation -->

---

## Bounded Review Gates <!-- sdd-owner: parent -->

- [ ] Post-apply: start bounded implementation review via `review/start(target)`. <!-- sdd-owner: parent -->
- [ ] Pre-commit: stage all reviewed paths without content/mode changes, then validate with `gentle-ai review validate --gate pre-commit --cwd <repo> --lineage <lineage>`. <!-- sdd-owner: parent -->
- [ ] Pre-push: validate existing content-bound receipt with `gentle-ai review validate --gate pre-push --cwd <repo> --lineage <lineage>`. <!-- sdd-owner: parent -->

---

## Task Summary

| PR        | Phase                        | Tasks        | Est. Lines | Key Deliverables                                                                    |
| --------- | ---------------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------- |
| 0.1       | Formalize — Domain + Schema  | 11           | ~1,050     | ReconciliationBatch, ReconciliationRule entities; schema extensions; migration      |
| 0.2       | Formalize — Tests + Docs     | 7            | ~1,150     | Domain test coverage ≥95%, service tests ≥90%, matching strategy docs               |
| 0.3       | Formalize — Contracts        | 5            | ~800       | OpenAPI spec, provider contract tests, Zod standardization                          |
| 1.1       | Prometeo — Abstraction       | 8            | ~950       | BankProviderAdapter interface, PrometeoAdapter, MockBankAdapter, encryption         |
| 1.2       | Prometeo — Services + Routes | 8            | ~1,050     | BankProviderService, commands, scheduler, API routes, sync flow integration         |
| 2.1       | Recon — Batch Engine         | 6            | ~950       | Batch-aware reconciliation, batch API endpoints, batch lifecycle tests              |
| 2.2       | Recon — Cutover + Dual       | 6            | ~950       | CutoverEvaluator, dual mode, circuit breaker, cutover API endpoints                 |
| 3.1       | Cashflow — Validation        | 6            | ~850       | DataSourceValidator, confidence model, query enrichment, validation tests           |
| 3.2       | Fiscal — Reports             | 9            | ~950       | ITF calculator + report, PLE exporter, detraction calculator, reconciliation report |
| **Total** |                              | **66 tasks** | **~8,700** |                                                                                     |

---

## Risk Notes

1. **Go Worker dependency**: Phase 2 assumes the Go reconciliation worker is deployed and reachable. If not deployed, shadow→dual→primary testing will need it available. Confirm worker endpoint before Phase 2.
2. **Redis availability**: Sync scheduler's session key storage uses in-memory by default. If Redis is in the stack, migrate session storage to Redis for resilience.
3. **ENCRYPTION_KEY**: Phase 1 credential encryption requires `ENCRYPTION_KEY` env var. Ensure it's set in all environments before deploying Phase 1.
4. **Prometeo sandbox credentials**: Phase 1 integration tests need valid Prometeo sandbox credentials. MockBankAdapter provides deterministic fallback if sandbox is unavailable.
5. **Strict TDD is active**: All code changes must follow RED → GREEN → TRIANGULATE → REFACTOR cycle per `openspec/config.yaml`. Test runner: `vitest`.
6. **Money value object**: Per fiscal-compliance skill, never use raw floats for monetary calculations. All amounts must use the project `Money` value object.
