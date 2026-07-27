# Drenyra Treasury & Banking Core — Specification

## Purpose

This specification formalizes the existing Treasury & Banking module of Drenyra: bank account management, transaction feeds, reconciliation (manual and automatic), bank provider integrations, and cashflow projection. The module is partially implemented (API 62+ files, WEB 44+ files, domain entities, application use cases) and this spec codifies WHAT the system MUST do — not how it is implemented.

---

## Domain Model

### Core Entities

```
┌──────────────────────┐       ┌──────────────────────────┐
│     BankAccount      │──1:N──│    BankTransaction       │
│  - id                │       │  - id                    │
│  - tenantId          │       │  - tenantId              │
│  - bankName          │       │  - bankAccountId         │
│  - accountNumber     │       │  - externalId            │
│  - accountType       │       │  - transactionDate       │
│  - currency          │       │  - valueDate             │
│  - currentBalance    │       │  - amount                │
│  - availableBalance  │       │  - currency              │
│  - providerId        │       │  - transactionType       │
│  - isActive          │       │  - description           │
│  - lastSyncAt        │       │  - reference             │
│  - createdAt         │       │  - source (MANUAL|CSV|API)│
│  - updatedAt         │       │  - isReconciled          │
└──────────────────────┘       │  - reconciliationBatchId │
                               │  - createdAt             │
                               └──────────────────────────┘
                                        │
                                        │ N:M (via match)
                                        ▼
┌──────────────────────┐       ┌──────────────────────────┐
│ ReconciliationBatch  │──1:N──│   ReconciliationMatch    │
│  - id                │       │  - id                    │
│  - tenantId          │       │  - batchId               │
│  - bankAccountId     │       │  - bankTransactionId     │
│  - periodStart       │       │  - internalTransactionId │
│  - periodEnd         │       │  - matchConfidence       │
│  - status            │       │  - matchType (EXACT|FUZZY)│
│  - openingBalance    │       │  - status                │
│  - closingBalance    │       │  - resolvedBy            │
│  - matchedCount      │       │  - resolvedAt            │
│  - unmatchedCount    │       │  - createdAt             │
│  - discrepancyAmount │       └──────────────────────────┘
│  - mode (MANUAL|AUTO)│
│  - createdAt         │       ┌──────────────────────────┐
│  - closedAt          │       │  ReconciliationRule      │
└──────────────────────┘       │  - id                    │
                               │  - tenantId              │
                               │  - name                  │
                               │  - ruleType              │
                               │  - conditions (JSON)     │
                               │  - priority              │
                               │  - isActive              │
                               │  - createdAt             │
                               └──────────────────────────┘

┌──────────────────────┐       ┌──────────────────────────┐
│   BankProvider       │       │  CashflowProjection      │
│  - id                │       │  - id                    │
│  - tenantId          │       │  - tenantId              │
│  - bankAccountId     │       │  - bankAccountId         │
│  - providerCode      │       │  - projectionDate        │
│  - apiCredentials    │       │  - horizonDays           │
│  - connectionStatus  │       │  - projectedBalance      │
│  - lastSyncAt        │       │  - confidenceLevel       │
│  - syncError         │       │  - sourceData (JSON)     │
│  - featureFlags(JSON)│       │  - createdAt             │
│  - createdAt         │       └──────────────────────────┘
└──────────────────────┘
```

### Enums

| Enum                   | Values                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `AccountType`          | `CHECKING`, `SAVINGS`, `DETRACTION`, `MONEY_MARKET`                                        |
| `TransactionType`      | `CREDIT`, `DEBIT`                                                                          |
| `TransactionSource`    | `MANUAL`, `CSV_IMPORT`, `API_FEED`                                                         |
| `ReconciliationStatus` | `OPEN`, `IN_PROGRESS`, `PARTIALLY_MATCHED`, `MATCHED`, `CLOSED_WITH_DISCREPANCY`, `CLOSED` |
| `ReconciliationMode`   | `MANUAL`, `AUTO`                                                                           |
| `MatchType`            | `EXACT`, `FUZZY`                                                                           |
| `MatchStatus`          | `PROPOSED`, `CONFIRMED`, `REJECTED`                                                        |
| `ProviderCode`         | `PROMETEO`, `MOCK`                                                                         |
| `ConnectionStatus`     | `DISCONNECTED`, `CONNECTING`, `CONNECTED`, `ERROR`                                         |

---

## Requirements

### Requirement: Bank Account CRUD

The system MUST allow authenticated tenants to create, read, update, and deactivate bank accounts. Bank accounts represent real bank accounts connected to the treasury module.

#### Scenario: Create a bank account

- GIVEN an authenticated tenant user
- WHEN they submit a valid bank account creation request with `bankName`, `accountNumber`, `accountType`, `currency`, and optional `providerId`
- THEN the system creates the bank account with `isActive: true`, an auto-generated `id`, and returns the created resource with `201 Created`
- AND the initial `currentBalance` and `availableBalance` default to `0.00`

#### Scenario: List tenant bank accounts

- GIVEN an authenticated tenant user with 3 bank accounts (2 active, 1 deactivated)
- WHEN they request `GET /api/banking/accounts`
- THEN the system returns all bank accounts belonging to the tenant, including deactivated ones
- AND the response includes pagination metadata

#### Scenario: Filter bank accounts by active status

- GIVEN an authenticated tenant user
- WHEN they request `GET /api/banking/accounts?isActive=true`
- THEN the system returns only active bank accounts

#### Scenario: Get a single bank account

- GIVEN an authenticated tenant user with an existing bank account `id: "ba-001"`
- WHEN they request `GET /api/banking/accounts/ba-001`
- THEN the system returns the full bank account resource with `200 OK`

#### Scenario: Get a non-existent bank account

- GIVEN an authenticated tenant user
- WHEN they request `GET /api/banking/accounts/non-existent`
- THEN the system returns `404 Not Found` with an error message indicating the account does not exist

#### Scenario: Tenant isolation

- GIVEN tenant A has bank account `id: "ba-001"` and tenant B is authenticated
- WHEN tenant B requests `GET /api/banking/accounts/ba-001`
- THEN the system returns `404 Not Found` (accounts are tenant-scoped)

#### Scenario: Update bank account metadata

- GIVEN an authenticated tenant user with bank account `id: "ba-001"`
- WHEN they submit a PATCH request updating `bankName` and `accountType`
- THEN the system updates the specified fields and returns `200 OK` with the updated resource
- AND fields not included in the PATCH body remain unchanged

#### Scenario: Deactivate a bank account

- GIVEN an authenticated tenant user with an active bank account `id: "ba-001"`
- WHEN they submit `PATCH /api/banking/accounts/ba-001` with `isActive: false`
- THEN the system sets `isActive` to `false` and returns `200 OK`
- AND the deactivated account is excluded from `?isActive=true` queries

#### Scenario: Reactivate a bank account

- GIVEN an authenticated tenant user with a deactivated bank account `id: "ba-001"`
- WHEN they submit `PATCH /api/banking/accounts/ba-001` with `isActive: true`
- THEN the system sets `isActive` to `true` and returns `200 OK`

#### Scenario: Validation — duplicate account number within tenant

- GIVEN an authenticated tenant user with an existing bank account with `accountNumber: "123-456-789"`
- WHEN they attempt to create another bank account with the same `accountNumber`
- THEN the system returns `409 Conflict` indicating a duplicate account number within the tenant scope

---

### Requirement: Bank Transaction Feed & Import

The system MUST support ingestion of bank transactions through manual entry, CSV file import, and automated API feeds from bank providers.

#### Scenario: Manual transaction creation

- GIVEN an authenticated tenant user and an active bank account `id: "ba-001"`
- WHEN they submit a valid transaction with `transactionDate`, `amount`, `currency`, `transactionType`, `description`, and `source: "MANUAL"`
- THEN the system creates the transaction with `isReconciled: false` and returns `201 Created`

#### Scenario: CSV transaction import

- GIVEN an authenticated tenant user with an active bank account `id: "ba-001"`
- WHEN they upload a valid CSV file containing 50 bank transactions via `POST /api/banking/accounts/ba-001/transactions/import`
- THEN the system parses all 50 rows, creates 50 `BankTransaction` records with `source: "CSV_IMPORT"`, and returns `200 OK` with a summary (`imported: 50`, `errors: 0`)

#### Scenario: CSV import with partial errors

- GIVEN a CSV file with 50 rows where 3 rows have invalid amounts
- WHEN the user uploads and imports the CSV
- THEN the system imports 47 valid rows and returns `200 OK` with summary (`imported: 47`, `errors: 3`, `errorDetails: [...]`)
- AND the error details include row numbers and specific validation messages

#### Scenario: CSV column mapping

- GIVEN an authenticated tenant user uploading a CSV whose columns differ from the expected format
- WHEN they specify a column mapping in the import request body
- THEN the system applies the mapping and imports transactions using the mapped columns

#### Scenario: Automated transaction feed from provider

- GIVEN an active bank account `id: "ba-001"` with a connected provider `providerCode: "PROMETEO"` and `connectionStatus: "CONNECTED"`
- WHEN the provider feed sync runs (scheduled or manual trigger `POST /api/banking/accounts/ba-001/sync`)
- THEN the system fetches new transactions from the provider API since `lastSyncAt`
- AND creates `BankTransaction` records with `source: "API_FEED"` and the provider's `externalId`
- AND updates `lastSyncAt` on the bank account

#### Scenario: Idempotent transaction ingestion

- GIVEN a sync run that fetches 10 transactions from the provider, including one with `externalId: "ext-007"` that already exists in the system
- WHEN the system processes the feed
- THEN it skips the duplicate `externalId` and creates only the 9 new transactions
- AND the response summary reports `imported: 9`, `duplicates: 1`

#### Scenario: List transactions with filters

- GIVEN an authenticated tenant user with bank account `id: "ba-001"`
- WHEN they request `GET /api/banking/accounts/ba-001/transactions?startDate=2026-01-01&endDate=2026-01-31&isReconciled=false&transactionType=CREDIT`
- THEN the system returns paginated transactions matching all filters

#### Scenario: Transaction validation — amount precision

- GIVEN a transaction with `amount: 100.999` (more than 2 decimal places)
- WHEN the system validates the transaction
- THEN it rejects the transaction with a validation error indicating only 2 decimal places are allowed for the configured currency

---

### Requirement: Bank Reconciliation & Matching

The system MUST provide manual and assisted reconciliation of bank transactions against internal ledger entries. A reconciliation batch groups matching operations for a bank account within a date period.

#### Scenario: Create a manual reconciliation batch

- GIVEN an authenticated tenant user with bank account `id: "ba-001"` that has 200 unreconciled transactions
- WHEN they create a reconciliation batch with `periodStart: "2026-01-01"`, `periodEnd: "2026-01-31"`, and `mode: "MANUAL"`
- THEN the system creates a `ReconciliationBatch` with `status: "OPEN"` and returns `201 Created`
- AND the batch scope is restricted to transactions within the specified period for that bank account

#### Scenario: Manual transaction matching

- GIVEN an open reconciliation batch `id: "rb-001"` in `MANUAL` mode
- WHEN the user submits a match between `bankTransactionId: "bt-010"` and `internalTransactionId: "it-200"` with `matchType: "EXACT"`
- THEN the system creates a `ReconciliationMatch` with `status: "CONFIRMED"` and `matchConfidence: 1.0`
- AND the batch's `matchedCount` increments

#### Scenario: Automated matching suggestions

- GIVEN an open reconciliation batch `id: "rb-001"` in `MANUAL` mode
- WHEN the user requests `POST /api/banking/reconciliation/rb-001/suggest`
- THEN the system returns a list of proposed matches with confidence scores
- AND each proposal includes `bankTransactionId`, `internalTransactionId`, `matchConfidence`, and `matchType`
- AND proposals do not auto-confirm (they remain `PROPOSED` until the user acts)

#### Scenario: Confirm a proposed match

- GIVEN a proposed match with `status: "PROPOSED"` and `matchConfidence: 0.95`
- WHEN the user confirms the match via `PATCH /api/banking/reconciliation/matches/{matchId}`
- THEN the status transitions to `CONFIRMED`
- AND the associated `BankTransaction.isReconciled` is set to `true`

#### Scenario: Reject a proposed match

- GIVEN a proposed match with `status: "PROPOSED"`
- WHEN the user rejects the match
- THEN the status transitions to `REJECTED`
- AND the `BankTransaction.isReconciled` remains `false`

#### Scenario: Close a reconciliation batch

- GIVEN a reconciliation batch `id: "rb-001"` with `status: "PARTIALLY_MATCHED"`, `matchedCount: 180`, `unmatchedCount: 20`, and non-zero `discrepancyAmount`
- WHEN the user closes the batch
- THEN the status transitions to `CLOSED_WITH_DISCREPANCY`
- AND `closedAt` is set to the current timestamp
- AND a discrepancy report is generated summarizing the 20 unmatched transactions

#### Scenario: Perfect reconciliation closure

- GIVEN a reconciliation batch with `matchedCount` equal to total transactions, `unmatchedCount: 0`, and `discrepancyAmount: 0.00`
- WHEN the user closes the batch
- THEN the status transitions to `CLOSED`

#### Scenario: Discrepancy calculation

- GIVEN a reconciliation batch with opening balance `10000.00`, closing balance `12500.00`, and total matched credits of `3000.00` and debits of `500.00`
- WHEN the system calculates the discrepancy
- THEN `discrepancyAmount = closingBalance - openingBalance - (totalCredits - totalDebits) = 0.00` (no discrepancy)
- AND any non-zero discrepancy is flagged in the batch summary

---

### Requirement: Auto-Reconciliation Engine

The system MUST support automatic reconciliation via configurable rules. The auto-reconciliation engine runs against unreconciled bank transactions and attempts to match them to internal ledger entries deterministically.

#### Scenario: Auto-reconciliation rule — exact amount + date match

- GIVEN an active reconciliation rule `"Exact Amount + Same Date"` with conditions: `{ amountTolerance: 0, dateTolerance: 0, matchFields: ["amount", "valueDate"] }`
- AND an unreconciled bank transaction `bt-001` with amount `500.00` on `2026-01-15`
- AND an internal ledger entry with amount `500.00` on `2026-01-15`
- WHEN the auto-reconciliation engine runs
- THEN it creates a confirmed match with `matchType: "EXACT"` and `matchConfidence: 1.0`

#### Scenario: Auto-reconciliation rule — fuzzy amount match

- GIVEN an active rule with `{ amountTolerance: 0.50, dateTolerance: 1, matchFields: ["amount", "valueDate"] }`
- AND an unreconciled bank transaction with amount `500.30` on `2026-01-15`
- AND an internal ledger entry with amount `500.00` on `2026-01-16`
- WHEN the auto-reconciliation engine runs
- THEN it creates a match with `matchType: "FUZZY"` and `matchConfidence` between 0.7 and 0.99

#### Scenario: Auto-reconciliation rule — single match

- GIVEN a rule that matches by `reference` field
- AND an unreconciled bank transaction with `reference: "INV-2026-0042"`
- AND exactly one internal ledger entry with the same reference
- WHEN the engine processes the transaction
- THEN it auto-confirms the match (no user intervention)

#### Scenario: Auto-reconciliation rule — ambiguous match

- GIVEN a rule that produces 3 candidate matches for a bank transaction, all above the minimum confidence threshold
- WHEN the engine evaluates the candidates
- THEN it leaves the transaction unreconciled and flags it as `ambiguous` for manual review
- AND the batch's `unmatchedCount` includes this transaction

#### Scenario: Shadow reconciliation mode

- GIVEN the auto-reconciliation engine is configured in `shadow` mode for tenant A
- AND a production reconciliation batch is open
- WHEN the engine runs
- THEN it processes matches in a parallel shadow batch without affecting the production batch
- AND shadow match results are logged and visible only to authorized users for review
- AND production data is never mutated by the shadow engine

#### Scenario: Shadow-to-production promotion

- GIVEN the shadow engine has completed N consecutive cycles with no critical discrepancies (per configured threshold)
- WHEN an authorized administrator promotes shadow reconciliation to production mode
- THEN the system deactivates the shadow gate
- AND all subsequent auto-reconciliation runs operate directly on production reconciliation batches

#### Scenario: Auto-reconciliation engine scheduling

- GIVEN a bank account `id: "ba-001"` with `connectionStatus: "CONNECTED"`
- WHEN the configured scheduled job for auto-reconciliation triggers (cron/daily)
- THEN the engine fetches the latest unreconciled transactions for the account
- AND runs matching rules in priority order
- AND creates a reconciliation batch with `mode: "AUTO"` if matches are found

#### Scenario: Rule priority ordering

- GIVEN 3 active reconciliation rules with priorities `10`, `20`, and `30`
- WHEN the engine processes a bank transaction
- THEN it evaluates rule priority 10 first, then 20, then 30
- AND the first rule that produces a match above its confidence threshold wins
- AND lower-priority rules are not evaluated for that transaction

---

### Requirement: Bank Provider Integrations

The system MUST support integration with external bank data providers through a provider abstraction layer. Providers supply live transaction feeds and balance information.

#### Scenario: Register a bank provider connection

- GIVEN an authenticated tenant user with bank account `id: "ba-001"`
- WHEN they register a provider connection with `providerCode: "PROMETEO"` and valid API credentials
- THEN the system creates a `BankProvider` record with `connectionStatus: "DISCONNECTED"`
- AND API credentials are stored encrypted

#### Scenario: Establish provider connection

- GIVEN a registered `BankProvider` with `providerCode: "PROMETEO"` and valid credentials
- WHEN the system attempts `POST /api/banking/providers/{providerId}/connect`
- THEN it calls the Prometeo authentication endpoint using stored credentials
- AND on success, updates `connectionStatus` to `CONNECTED` and stores the session token
- AND returns `200 OK`

#### Scenario: Provider connection failure

- GIVEN a `BankProvider` with invalid or expired credentials
- WHEN the system attempts to connect
- THEN it sets `connectionStatus: "ERROR"` and stores `syncError` with the failure reason
- AND returns a structured error response with the provider-specific error code

#### Scenario: Sync transactions from provider

- GIVEN a connected `BankProvider` with `connectionStatus: "CONNECTED"`
- WHEN the sync is triggered (`POST /api/banking/accounts/{accountId}/sync` or scheduled)
- THEN the system retrieves new transactions from the provider since `lastSyncAt`
- AND creates `BankTransaction` records with `source: "API_FEED"`
- AND updates `lastSyncAt` to the current timestamp
- AND returns a sync summary

#### Scenario: Sync balance from provider

- GIVEN a connected `BankProvider`
- WHEN the balance sync runs
- THEN the system retrieves the current and available balance from the provider
- AND updates `currentBalance` and `availableBalance` on the associated `BankAccount`

#### Scenario: Provider disconnect

- GIVEN a connected `BankProvider`
- WHEN the user requests `POST /api/banking/providers/{providerId}/disconnect`
- THEN the system revokes the provider session (if supported by the provider)
- AND sets `connectionStatus: "DISCONNECTED"`
- AND clears the stored session token while preserving credentials for future reconnection

#### Scenario: Provider feature flags

- GIVEN a `BankProvider` with `featureFlags: { shadowReconciliation: true, liveFeed: false }`
- WHEN the auto-reconciliation engine evaluates the provider
- THEN it runs shadow reconciliation for this account (flag: `shadowReconciliation`)
- AND does not activate live transaction feeding (flag: `liveFeed: false`)

#### Scenario: Provider abstraction — multiple providers

- GIVEN the system supports `PROMETEO` and `MOCK` provider codes
- WHEN a provider operation (connect, sync, disconnect) is invoked
- THEN the system dispatches to the correct provider adapter based on `providerCode`
- AND the caller interacts with a unified provider interface without provider-specific logic

#### Scenario: MOCK provider for testing

- GIVEN a `BankProvider` with `providerCode: "MOCK"`
- WHEN a sync is triggered
- THEN the MOCK adapter returns deterministic synthetic transactions and balances
- AND no external HTTP calls are made

---

### Requirement: Cashflow Projection & Forecasting

The system MUST project future bank balances based on historical transaction patterns, pending accounts receivable/payable, and scheduled recurring transactions.

#### Scenario: Generate a cashflow projection

- GIVEN an authenticated tenant user with bank account `id: "ba-001"` that has 90 days of transaction history
- WHEN they request `POST /api/banking/cashflow/project` with `accountId: "ba-001"` and `horizonDays: 30`
- THEN the system generates a daily projection for the next 30 days
- AND each projection day includes `projectedBalance`, `projectedInflow`, `projectedOutflow`, and `confidenceLevel`
- AND returns `200 OK` with the projection array

#### Scenario: Cashflow projection data sources

- GIVEN a cashflow projection request
- WHEN the system builds the projection
- THEN it MUST pull data from:
  - Historical bank transactions (trends, seasonality)
  - Pending accounts receivable (expected inflows)
  - Pending accounts payable (expected outflows)
  - Scheduled recurring transactions
- AND the projection MUST NOT use simulated or hardcoded data for production bank accounts

#### Scenario: Cashflow projection — empty history

- GIVEN a bank account with fewer than 7 days of transaction history
- WHEN the user requests a 30-day cashflow projection
- THEN the system returns a projection with `confidenceLevel: "LOW"` for all days
- AND includes a warning that insufficient historical data limits projection accuracy

#### Scenario: Cashflow projection — multi-currency

- GIVEN a tenant with bank accounts in `USD` and `PEN`
- WHEN they request a consolidated cashflow projection across both currencies
- THEN the system generates per-currency projections and a consolidated view using the configured exchange rate
- AND clearly labels the currency of each projection entry

#### Scenario: Cashflow balance summary

- GIVEN an authenticated tenant user
- WHEN they request `GET /api/banking/cashflow/summary`
- THEN the system returns a summary across all active bank accounts including:
  - Total current balance (per currency)
  - Total projected inflow for the next 7, 15, and 30 days
  - Total projected outflow for the next 7, 15, and 30 days
  - Net projected position per horizon
  - Overall liquidity health indicator

---

### Requirement: Fiscal Compliance — Detracciones SPOT

The system MUST support Peruvian SPOT detraction accounts as a special account type and calculate detraction amounts for applicable transactions.

#### Scenario: Register a detraction bank account

- GIVEN an authenticated tenant user
- WHEN they create a bank account with `accountType: "DETRACTION"` and a valid detraction account number
- THEN the system creates the account and marks it as a special detraction account
- AND flags it for detraction-specific reporting

#### Scenario: Calculate detraction amount

- GIVEN a supplier payment of `PEN 10,000.00` for a service subject to 12% detraction
- WHEN the system processes the payment
- THEN it calculates the detraction amount as `PEN 1,200.00`
- AND creates a linked transaction entry to the detraction bank account

---

### Requirement: Fiscal Compliance — ITF

The system MUST calculate and track ITF (Impuesto a las Transacciones Financieras) for applicable bank transactions.

#### Scenario: ITF calculation on outgoing transaction

- GIVEN an outgoing bank transaction of `PEN 5,000.00`
- AND the current ITF rate is `0.005%`
- WHEN the transaction is recorded
- THEN the system calculates the ITF amount as `PEN 0.25`
- AND appends the ITF to the transaction metadata for reporting

#### Scenario: ITF monthly report

- GIVEN an authenticated tenant user
- WHEN they request `GET /api/banking/reports/itf?year=2026&month=07`
- THEN the system returns a report of all ITF-applicable transactions for July 2026
- AND the report includes per-transaction ITF amounts and a monthly total

---

### Requirement: Fiscal Compliance — SUNAT Reports

The system MUST generate SUNAT-compliant reports for bank transactions, including PLE format exports and bank reconciliation for monthly closings.

#### Scenario: Export transactions in PLE format

- GIVEN an authenticated tenant user
- WHEN they request `GET /api/banking/reports/ple?period=2026-07` with `Accept: text/csv`
- THEN the system exports all bank transactions for July 2026 in the SUNAT PLE format
- AND the CSV structure follows the official SUNAT PLE schema for banking records

#### Scenario: Monthly closing reconciliation report

- GIVEN a completed reconciliation batch for the month of July 2026
- WHEN the user requests `GET /api/banking/reports/reconciliation?period=2026-07`
- THEN the system generates a report including:
  - Opening and closing balances
  - Total matched and unmatched transactions
  - Discrepancy amount and explanation
  - List of outstanding (unmatched) items
- AND the report is exportable as PDF or CSV

---

## API Contracts

### Bank Accounts

#### `POST /api/banking/accounts`

**Request:**

```json
{
  "bankName": "Banco de Crédito del Perú",
  "accountNumber": "193-1234567-0-89",
  "accountType": "CHECKING",
  "currency": "PEN",
  "providerId": null
}
```

**Response (201):**

```json
{
  "id": "ba-abc123",
  "tenantId": "t-xyz",
  "bankName": "Banco de Crédito del Perú",
  "accountNumber": "193-1234567-0-89",
  "accountType": "CHECKING",
  "currency": "PEN",
  "currentBalance": 0.0,
  "availableBalance": 0.0,
  "providerId": null,
  "isActive": true,
  "lastSyncAt": null,
  "createdAt": "2026-07-25T12:00:00Z",
  "updatedAt": "2026-07-25T12:00:00Z"
}
```

#### `GET /api/banking/accounts`

**Query params:** `isActive` (boolean, optional), `page` (int, default 1), `limit` (int, default 20)

**Response (200):**

```json
{
  "data": [/* BankAccount[] */],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

#### `GET /api/banking/accounts/{accountId}`

**Response (200):** `BankAccount` (as in create response)

**Response (404):**

```json
{
  "error": "NOT_FOUND",
  "message": "Bank account not found"
}
```

#### `PATCH /api/banking/accounts/{accountId}`

**Request:**

```json
{
  "bankName": "BCP — Updated",
  "isActive": false
}
```

**Response (200):** `BankAccount` with updated fields

#### `DELETE /api/banking/accounts/{accountId}`

Not supported. Deactivation via PATCH with `isActive: false` is the only removal path.

---

### Bank Transactions

#### `POST /api/banking/accounts/{accountId}/transactions`

**Request:**

```json
{
  "transactionDate": "2026-07-25",
  "valueDate": "2026-07-25",
  "amount": 1500.5,
  "currency": "PEN",
  "transactionType": "CREDIT",
  "description": "Pago cliente — Factura F001-0042",
  "reference": "F001-0042",
  "source": "MANUAL"
}
```

**Response (201):**

```json
{
  "id": "bt-xyz789",
  "tenantId": "t-xyz",
  "bankAccountId": "ba-abc123",
  "externalId": null,
  "transactionDate": "2026-07-25",
  "valueDate": "2026-07-25",
  "amount": 1500.5,
  "currency": "PEN",
  "transactionType": "CREDIT",
  "description": "Pago cliente — Factura F001-0042",
  "reference": "F001-0042",
  "source": "MANUAL",
  "isReconciled": false,
  "reconciliationBatchId": null,
  "createdAt": "2026-07-25T12:05:00Z"
}
```

#### `POST /api/banking/accounts/{accountId}/transactions/import`

**Request:** `multipart/form-data` with CSV file + optional JSON column mapping.

**Response (200):**

```json
{
  "imported": 47,
  "errors": 3,
  "duplicates": 0,
  "errorDetails": [
    {
      "row": 12,
      "field": "amount",
      "message": "Invalid numeric format: 'ABC'"
    },
    {
      "row": 28,
      "field": "date",
      "message": "Invalid date format: '2026/13/01'"
    },
    {
      "row": 41,
      "field": "amount",
      "message": "Amount exceeds 2 decimal places: '100.999'"
    }
  ]
}
```

#### `GET /api/banking/accounts/{accountId}/transactions`

**Query params:** `startDate` (date), `endDate` (date), `isReconciled` (boolean), `transactionType` (CREDIT|DEBIT), `source` (MANUAL|CSV_IMPORT|API_FEED), `page`, `limit`

**Response (200):** paginated `{ data: BankTransaction[], meta: PaginationMeta }`

#### `POST /api/banking/accounts/{accountId}/sync`

**Request:**

```json
{
  "syncType": "FULL",
  "fromDate": "2026-07-01"
}
```

**Response (200):**

```json
{
  "synced": 23,
  "duplicates": 2,
  "errors": 0,
  "lastSyncAt": "2026-07-25T12:10:00Z"
}
```

---

### Reconciliation

#### `POST /api/banking/reconciliation/batches`

**Request:**

```json
{
  "bankAccountId": "ba-abc123",
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31",
  "mode": "MANUAL"
}
```

**Response (201):**

```json
{
  "id": "rb-001",
  "tenantId": "t-xyz",
  "bankAccountId": "ba-abc123",
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31",
  "status": "OPEN",
  "openingBalance": 10000.0,
  "closingBalance": null,
  "matchedCount": 0,
  "unmatchedCount": 0,
  "discrepancyAmount": 0.0,
  "mode": "MANUAL",
  "createdAt": "2026-07-25T12:15:00Z",
  "closedAt": null
}
```

#### `GET /api/banking/reconciliation/batches/{batchId}`

**Response (200):** `ReconciliationBatch`

#### `POST /api/banking/reconciliation/batches/{batchId}/matches`

**Request:**

```json
{
  "bankTransactionId": "bt-010",
  "internalTransactionId": "it-200",
  "matchType": "EXACT"
}
```

**Response (201):**

```json
{
  "id": "rm-001",
  "batchId": "rb-001",
  "bankTransactionId": "bt-010",
  "internalTransactionId": "it-200",
  "matchConfidence": 1.0,
  "matchType": "EXACT",
  "status": "CONFIRMED",
  "resolvedBy": "user-001",
  "resolvedAt": "2026-07-25T12:20:00Z"
}
```

#### `POST /api/banking/reconciliation/batches/{batchId}/suggest`

**Response (200):**

```json
{
  "proposals": [
    {
      "bankTransactionId": "bt-010",
      "internalTransactionId": "it-200",
      "matchConfidence": 0.98,
      "matchType": "EXACT",
      "reason": "Exact amount and same value date"
    },
    {
      "bankTransactionId": "bt-011",
      "internalTransactionId": "it-205",
      "matchConfidence": 0.82,
      "matchType": "FUZZY",
      "reason": "Amount within 0.50 tolerance, date offset 1 day"
    }
  ]
}
```

#### `PATCH /api/banking/reconciliation/matches/{matchId}`

**Request:**

```json
{
  "status": "CONFIRMED"
}
```

**Response (200):** `ReconciliationMatch` with updated status

#### `POST /api/banking/reconciliation/batches/{batchId}/close`

**Response (200):**

```json
{
  "id": "rb-001",
  "status": "CLOSED_WITH_DISCREPANCY",
  "matchedCount": 180,
  "unmatchedCount": 20,
  "discrepancyAmount": 350.75,
  "closedAt": "2026-07-25T13:00:00Z",
  "reportUrl": "/api/banking/reports/reconciliation?period=2026-07"
}
```

---

### Reconciliation Rules

#### `POST /api/banking/reconciliation/rules`

**Request:**

```json
{
  "name": "Exact Amount + Same Date",
  "ruleType": "MATCH",
  "conditions": {
    "amountTolerance": 0,
    "dateTolerance": 0,
    "matchFields": ["amount", "valueDate"]
  },
  "priority": 10,
  "isActive": true
}
```

**Response (201):** `ReconciliationRule`

#### `GET /api/banking/reconciliation/rules`

**Response (200):** `{ data: ReconciliationRule[] }`

#### `PATCH /api/banking/reconciliation/rules/{ruleId}`

Partial update — supports changing `conditions`, `priority`, `isActive`.

---

### Bank Providers

#### `POST /api/banking/providers`

**Request:**

```json
{
  "bankAccountId": "ba-abc123",
  "providerCode": "PROMETEO",
  "apiCredentials": {
    "apiKey": "sk-live-xxxx",
    "apiSecret": "encrypted-secret"
  }
}
```

**Response (201):** `BankProvider` (credentials redacted from response)

#### `POST /api/banking/providers/{providerId}/connect`

**Response (200):**

```json
{
  "providerId": "bp-001",
  "connectionStatus": "CONNECTED",
  "lastSyncAt": null
}
```

**Response (502 — provider error):**

```json
{
  "error": "PROVIDER_ERROR",
  "message": "Authentication failed: Invalid credentials",
  "providerCode": "PROMETEO",
  "providerErrorCode": "AUTH_001"
}
```

#### `POST /api/banking/providers/{providerId}/disconnect`

**Response (200):** `{ providerId, connectionStatus: "DISCONNECTED" }`

#### `GET /api/banking/providers`

**Response (200):** `{ data: BankProvider[] }`

---

### Cashflow

#### `POST /api/banking/cashflow/project`

**Request:**

```json
{
  "accountId": "ba-abc123",
  "horizonDays": 30,
  "includePendingAR": true,
  "includePendingAP": true
}
```

**Response (200):**

```json
{
  "accountId": "ba-abc123",
  "currency": "PEN",
  "generatedAt": "2026-07-25T12:00:00Z",
  "horizonDays": 30,
  "projections": [
    {
      "date": "2026-07-26",
      "projectedBalance": 10250.0,
      "projectedInflow": 1500.0,
      "projectedOutflow": 1250.0,
      "confidenceLevel": "HIGH"
    }
  ]
}
```

#### `GET /api/banking/cashflow/summary`

**Response (200):**

```json
{
  "balances": [
    { "currency": "PEN", "currentBalance": 50000.0 },
    { "currency": "USD", "currentBalance": 12500.0 }
  ],
  "projectedInflow": {
    "7d": 25000.0,
    "15d": 55000.0,
    "30d": 120000.0
  },
  "projectedOutflow": {
    "7d": 18000.0,
    "15d": 42000.0,
    "30d": 95000.0
  },
  "netPosition": {
    "7d": 7000.0,
    "15d": 13000.0,
    "30d": 25000.0
  },
  "liquidityHealth": "HEALTHY"
}
```

---

### Fiscal Reports

#### `GET /api/banking/reports/itf?year=2026&month=07`

**Response (200):**

```json
{
  "period": "2026-07",
  "itfRate": 0.005,
  "totalITF": 45.75,
  "transactions": [
    {
      "transactionId": "bt-001",
      "date": "2026-07-05",
      "amount": 5000.0,
      "itfAmount": 0.25
    }
  ]
}
```

#### `GET /api/banking/reports/ple?period=2026-07`

**Headers:** `Accept: text/csv`

**Response (200):** CSV content following SUNAT PLE banking schema.

#### `GET /api/banking/reports/reconciliation?period=2026-07`

**Response (200):**

```json
{
  "period": "2026-07",
  "bankAccountId": "ba-abc123",
  "openingBalance": 10000.0,
  "closingBalance": 12500.0,
  "matchedCount": 180,
  "unmatchedCount": 20,
  "discrepancyAmount": 350.75,
  "outstandingItems": [/* unmatched BankTransaction[] */],
  "generatedAt": "2026-07-31T23:59:00Z"
}
```

---

## Non-Functional Requirements

### NFR-01: Multi-Tenancy

All resources MUST be scoped to the authenticated tenant. Cross-tenant data access MUST NOT be possible.

### NFR-02: API Credential Encryption

Bank provider API credentials MUST be stored encrypted at rest. Credentials MUST NOT appear in API responses, logs, or error messages.

### NFR-03: Idempotent Transaction Ingestion

Transaction ingestion via API feed MUST be idempotent based on `externalId` per bank account. Duplicate `externalId` values MUST be skipped.

### NFR-04: Reconciliation Batch Closure Immutability

A closed reconciliation batch MUST NOT be modified. Matches within a closed batch MUST NOT be created, updated, or deleted.

### NFR-05: Cashflow Data Integrity

Cashflow projections for production bank accounts MUST use real ledger data (historical transactions, AR, AP). Simulated data is only acceptable for MOCK provider accounts.

### NFR-06: Provider Abstraction

The system MUST use a provider adapter interface so that adding a new bank provider (beyond Prometeo) does NOT require changes to the core banking logic.

---

## Risks & Assumptions

| Risk                                             | Mitigation                                                      |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Prometeo integration untested in production      | Feature flag activation; shadow reconciliation mode first       |
| Shadow reconciliation data loss during promotion | Cutover only after N successful cycles + admin authorization    |
| SPOT detraction calculation errors               | Compliance tests using real SUNAT scenarios                     |
| Cashflow data sourced from simulations           | Validate data origin before promoting projections to production |
| ITF rate changes                                 | Store ITF rate as a configurable parameter, not hardcoded       |
