# ERPNext Production Validation Guide — Drenyra Ecosystem Phase 5

> **Última actualización**: 2026-06-24

This guide tells you how to verify that the ERPNext connector is production-ready before you let it post real journal entries to your ledger. Fiscal correctness depends on every link in the chain — from PCGE mapping to circuit breaker behavior — being validated against a live ERPNext instance.

---

## Quick path

1. Set up an ERPNext v15+ instance and generate API credentials
2. Configure environment variables and create required PCGE accounts
3. Run the unit tests to verify mapper correctness
4. Run integration tests against your ERPNext instance
5. Confirm journal entries, party sync, and trial balance queries
6. Verify circuit breaker and error handling
7. Validate PCGE mapping completeness with the validation script

---

## 1. Prerequisites

You need three things before you can validate the connector:

- **ERPNext v15+** — self-hosted (Docker recommended) or Frappe Cloud. If you're starting fresh, the quickest path is the official Docker Compose:

  ```bash
  curl https://frappe.github.io/docker-erpnext/installer.sh | bash
  cd frappe_docker
  docker compose -f pwd.yml up -d
  ```

- **API key + secret** — generated from ERPNext for a user with at least "Accounts Manager" role. Without sufficient privileges, journal entry creation will fail silently.

  In ERPNext: `Users → User → API Access → Generate Key → Generate Secret` → copy both before closing the dialog (the secret is shown once).

- **PCGE account mapping configured** — the Peruvian Chart of Accounts must exist in ERPNext's Chart of Accounts. See section 4 for the mapping table.

---

## 2. Configuration

### Environment Variables

The connector reads its config from environment variables. Set these before starting the application:

```bash
# Required
export DRENYRA_ERPNEXT_URL="https://erp.yourcompany.com"
export DRENYRA_ERPNEXT_API_KEY="your-api-key"
export DRENYRA_ERPNEXT_API_SECRET="your-api-secret"

# Optional (sensible defaults provided)
export DRENYRA_ERPNEXT_TIMEOUT_MS="10000"   # Request timeout in ms (default: 10s)
```

**Why this matters:** The config is validated at `connect()` time via Zod (`ErpnextConfigSchema` in `packages/ecosystem/src/config.ts:10`). If any required variable is missing or malformed, `connect()` throws a `ConnectorError` with a clear message about what's wrong. A typo in the URL means silent failures later — validate this first.

### PCGE Account Setup in ERPNext

The connector maps Peruvian PCGE codes to ERPNext account names. These accounts MUST exist in ERPNext before posting journal entries. Create them in `Chart of Accounts` under your company:

1. Go to `Accounting → Chart of Accounts`
2. Add new accounts matching the PCGE mapping table below
3. Ensure the account types (Asset, Liability, Income, Expense) are correct — ERPNext validates posting rules against these types

---

## 3. Verification Checklist

Go through each item in order. If any fails, stop and fix it before proceeding.

### Connection & Health

- [ ] **Connector connects successfully** — `registry.connect()` does not throw
- [ ] **Health check returns connected** — `connector.isHealthy()` returns `{ connected: true, status: "healthy" }`
- [ ] **Metrics report circuit breaker CLOSED** — `connector.getMetrics().circuitBreakerState === "closed"`

### Core Operations

- [ ] **Journal entry creation posts correctly** — creating a `Journal Entry` via `frappe.client.insert` returns a `{ name }` with the ERPNext document name
- [ ] **Party (Customer/Supplier) sync works with RUC** — creating a Customer with `tax_id` = RUC, then retrieving it via `frappe.client.get` returns the record with the correct tax ID
- [ ] **Trial balance query returns data** — querying `GL Entry` records returns rows with debit/credit amounts

### Resilience

- [ ] **Circuit breaker handles ERPNext downtime** — after 5 consecutive failures, subsequent operations throw `CircuitBreakerOpenError` instead of waiting for a timeout
- [ ] **Auth failure returns clear error** — wrong API key/secret returns `ConnectorAuthError` (NOT a generic 500)
- [ ] **Timeout aborts hung requests** — if ERPNext does not respond within `timeoutMs`, the request is aborted via `AbortController`

### Mapper Correctness (fiscal logic)

- [ ] **Sales invoice → journal entry produces correct triple-entry** — debit to customer receivable (PCGE 12), credit to sales revenue (PCGE 70), credit to IGV payable (PCGE 46). Total debits = total credits.
- [ ] **Purchase invoice → journal entry produces correct triple-entry** — debit to purchases (PCGE 60), debit to IGV credit (PCGE 46 sub-account), credit to supplier payable (PCGE 42). Total debits = total credits.
- [ ] **Custom PCGE mapping overrides work** — passing a custom `pcgeMapping` changes account names in the output

---

## 4. PCGE Account Mapping Table

These are the Peruvian PCGE (Plan Contable General Empresarial) codes that the connector maps to ERPNext accounts. Every code in this table should have a corresponding account in your ERPNext Chart of Accounts.

| PCGE Code | PCGE Name | ERPNext Account Name | Type |
|-----------|-----------|---------------------|------|
| 10 | Efectivo y Equivalentes | Cash and Cash Equivalents | Asset |
| 11 | Inversiones Financieras | Current Financial Investments | Asset |
| 12 | Cuentas por Cobrar Comerciales — Terceros | Trade Accounts Receivable — Third Parties | Asset |
| 14 | Cuentas por Cobrar Comerciales — Relacionadas | Trade Accounts Receivable — Related Parties | Asset |
| 16 | Otras Cuentas por Cobrar | Other Accounts Receivable | Asset |
| 20 | Inventarios | Inventories | Asset |
| 21 | Producción en Proceso | Work in Progress | Asset |
| 33 | Inmuebles, Maquinaria y Equipo | Property, Plant and Equipment | Asset |
| 40 | Cuentas por Pagar Comerciales — Terceros | Trade Accounts Payable — Third Parties | Liability |
| 41 | Cuentas por Pagar Comerciales — Relacionadas | Trade Accounts Payable — Related Parties | Liability |
| 42 | Otras Cuentas por Pagar | Other Accounts Payable | Liability |
| 46 | Pasivos por Tributos | Tax Liabilities | Liability |
| 50 | Capital Social | Capital Stock | Equity |
| 59 | Resultados Acumulados | Retained Earnings | Equity |
| 60 | Compras | Purchases | Expense |
| 61 | Variación de Existencias | Variation of Inventories | Expense |
| 62 | Servicios Prestados por Terceros | Third-Party Services | Expense |
| 63 | Tributos | Taxes | Expense |
| 64 | Gastos de Personal | Personnel Expenses | Expense |
| 70 | Ventas | Sales | Income |
| 71 | Otros Ingresos Operacionales | Other Operating Income | Income |
| 75 | Otros Ingresos | Other Income | Income |
| 76 | Ingresos Financieros | Financial Income | Income |
| 77 | Gastos Financieros | Financial Expenses | Expense |
| 79 | Cargos Excepcionales | Extraordinary Items | Expense |

**Why the account type matters:** ERPNext enforces debit/credit posting rules based on account type. For example, you cannot credit an Asset account unless the configuration allows it. If a journal entry fails with "Cannot credit an Asset account," the account type in the mapping is wrong.

The source of truth for this mapping lives in `packages/ecosystem/src/adapters/erpnext/erpnext.types.ts:34`. When you customize it, update both the TypeScript constant and this doc.

---

## 5. Testing the Integration

### Unit Tests (no ERPNext needed)

Run the unit tests for the mapper and base connector — these test fiscal logic without external dependencies:

```bash
cd packages/ecosystem && bun vitest run --config ../../vitest.config.ts tests/erpnext.*.test.ts tests/base.connector.test.ts
```

What these test:
- Sales and purchase invoice → journal entry mapping (debit/credit correctness)
- Custom PCGE mapping overrides
- Invoice reference in remarks (`billNo`, `userRemark`)
- Circuit breaker: opens after 5 failures, throws `CircuitBreakerOpenError`
- Health check: connected/disconnected state
- Metrics tracking

Expected output: all tests pass.

### Integration Tests (requires live ERPNext)

To test against a real ERPNext instance, create a small validation script:

```typescript
// test-connector.ts — run with `bun run test-connector.ts`
import { ErpnextConnector } from "./src/adapters/erpnext/erpnext.connector";

async function main() {
  const connector = new ErpnextConnector();
  
  await connector.connect();
  console.log("✅ Connected:", await connector.isHealthy());
  
  // Create a party
  const party = await connector.execute({
    type: "party.create",
    data: {
      partyType: "Customer",
      partyName: "Validador SAC",
      taxId: "20123456789",
      company: "Your Company",
    },
  });
  console.log("✅ Party created:", party.name);
  
  // Create a journal entry
  const entry = await connector.execute({
    type: "journal_entry.create",
    data: {
      postingDate: "2026-06-24",
      company: "Your Company",
      accounts: [
        {
          account: "Trade Accounts Receivable - Third Parties",
          partyType: "Customer",
          party: "Validador SAC",
          debitInAccountCurrency: 1180,
          creditInAccountCurrency: 0,
        },
        {
          account: "Sales",
          debitInAccountCurrency: 0,
          creditInAccountCurrency: 1000,
        },
        {
          account: "Tax Liabilities",
          debitInAccountCurrency: 0,
          creditInAccountCurrency: 180,
        },
      ],
      userRemark: "Validation entry — safe to delete after testing",
    },
  });
  console.log("✅ Journal Entry created:", entry.name);
  
  // Query trial balance
  const tb = await connector.execute({
    type: "trial_balance.get",
    filters: { company: "Your Company" },
  });
  console.log("✅ Trial balance rows:", tb.length);
  
  await connector.disconnect();
}

main().catch(console.error);
```

Run with:

```bash
# Set env vars first
export DRENYRA_ERPNEXT_URL=...
export DRENYRA_ERPNEXT_API_KEY=...
export DRENYRA_ERPNEXT_API_SECRET=...

bun run test-connector.ts
```

### Verifying in the ERPNext UI

After the integration test creates a journal entry, verify it in the ERPNext UI:

1. **Journal Entry list**: `Accounting → Journal Entry` — look for the entry with remark "Validation entry"
2. **Open the entry**: confirm the accounts, debit/credit amounts, and party reference are correct
3. **General Ledger report**: `Accounting → General Ledger` — filter by the account and date to confirm the posting appears
4. **Delete the test entry**: after validation, delete it to keep your ledger clean

---

## 6. Troubleshooting

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| `connect()` throws "Invalid URL" | `DRENYRA_ERPNEXT_URL` missing protocol or malformed | Verify URL includes `https://` |
| `ConnectorAuthError: HTTP 401` | API key/secret is wrong or expired | Generate new credentials in ERPNext, verify user has Accounts Manager role |
| `ConnectorAuthError: HTTP 403` | API user lacks permission to create journal entries | Check user role in ERPNext — needs "Journal Entry" and "Account" permissions |
| `ConnectorError: HTTP 404` | The API endpoint path is wrong (check our `request()` method) | Verify ERPNext version — v15+ uses `/api/method/frappe.client.*` |
| "Cannot debit/credit account" | The account type in PCGE mapping does not match ERPNext | Verify the account exists in Chart of Accounts and has the correct type (Asset/Liability/Income/Expense/etc.) |
| "Account X not found" | The PCGE-mapped account name does not exist in ERPNext | Create the account in Chart of Accounts, or update the mapping in `erpnext.types.ts` |
| Circuit breaker stays OPEN | ERPNext has been down and is back but half-open probe failed | Wait for `recoveryTimeoutMs` (30s) — the next `guardedExecute` call will try half-open state |
| Duplicate journal entries | Missing idempotency for retried operations | The connector does not yet implement idempotency keys — ensure your caller deduplicates or add a `frappe.client.insert` check for duplicate `billNo` |
| `fetch` hangs until timeout | Network issue or ERPNext is overloaded | Check network connectivity, increase `DRENYRA_ERPNEXT_TIMEOUT_MS`, verify ERPNext worker count |
| Party exists error (duplicate name) | Trying to create a Customer/Supplier that already exists | Use `party.get` first, or implement upsert logic in your caller |

### Error Handling Architecture

The connector uses three layers of error resilience, from inner to outer:

1. **`guardedExecute`** (circuit breaker) — wraps every `execute()` call. After 5 consecutive failures, the circuit opens and subsequent calls throw `CircuitBreakerOpenError` immediately instead of hitting the network. Recovers after 30s silently on the next call (half-open → closed on success).

2. **`AbortController`** — every HTTP request is aborted after `timeoutMs` (default 10s). This prevents hung requests from blocking the event loop.

3. **HTTP status checks** — the `request()` method distinguishes auth errors (401/403 → `ConnectorAuthError`) from other HTTP errors (`ConnectorError`). Auth errors do NOT open the circuit breaker (they won't self-recover).

This is implemented in `packages/ecosystem/src/base.connector.ts:87` and `packages/ecosystem/src/adapters/erpnext/erpnext.connector.ts:105`.

---

## 7. PCGE Mapping Validation Script

This script checks which required PCGE accounts are missing from your ERPNext instance. It is a conceptual / runnable-only-with-ERPNext sample — adapt it to your environment.

```typescript
// validate-pcge-mapping.ts
// bun run validate-pcge-mapping.ts
// Prerequisite: DRENYRA_ERPNEXT_URL, API_KEY, API_SECRET must be set

import { ErpnextConnector } from "./src/adapters/erpnext/erpnext.connector";
import { PCGE_TO_ERPNext_SAMPLE } from "./src/adapters/erpnext/erpnext.types";

interface AccountResult {
  pcgeCode: string;
  pcgeName: string;
  erpnextAccount: string;
  exists: boolean;
}

async function validatePcgeMapping(): Promise<void> {
  const connector = new ErpnextConnector();
  await connector.connect();

  const company = "Your Company"; // Change to your ERPNext company name
  const results: AccountResult[] = [];

  // PCGE codes with their Spanish names for the report
  const pcgeNames: Record<string, string> = {
    "10": "Efectivo y Equivalentes",
    "11": "Inversiones Financieras",
    "12": "Ctas por Cobrar Comerciales — Terceros",
    "14": "Ctas por Cobrar Comerciales — Relacionadas",
    "16": "Otras Cuentas por Cobrar",
    "20": "Inventarios",
    "21": "Producción en Proceso",
    "33": "Inmuebles, Maquinaria y Equipo",
    "40": "Ctas por Pagar Comerciales — Terceros",
    "41": "Ctas por Pagar Comerciales — Relacionadas",
    "42": "Otras Cuentas por Pagar",
    "46": "Pasivos por Tributos",
    "50": "Capital Social",
    "59": "Resultados Acumulados",
    "60": "Compras",
    "61": "Variación de Existencias",
    "62": "Servicios de Terceros",
    "63": "Tributos",
    "64": "Gastos de Personal",
    "70": "Ventas",
    "71": "Otros Ingresos Operacionales",
    "75": "Otros Ingresos",
    "76": "Ingresos Financieros",
    "77": "Gastos Financieros",
    "79": "Cargos Excepcionales",
  };

  for (const [code, accountName] of Object.entries(PCGE_TO_ERPNext_SAMPLE)) {
    try {
      // Check if the account exists in ERPNext's Chart of Accounts
      await connector.execute({
        type: "party.get" as any, // Simplified: use a frappe.client.get for Account doctype
        name: accountName,
      });
      results.push({
        pcgeCode: code,
        pcgeName: pcgeNames[code] ?? "—",
        erpnextAccount: accountName,
        exists: true,
      });
    } catch {
      results.push({
        pcgeCode: code,
        pcgeName: pcgeNames[code] ?? "—",
        erpnextAccount: accountName,
        exists: false,
      });
    }
  }

  await connector.disconnect();

  // Report
  const missing = results.filter((r) => !r.exists);
  const present = results.filter((r) => r.exists);

  console.log(`\nPCGE Mapping Validation Report`);
  console.log(`=============================`);
  console.log(`Total accounts: ${results.length}`);
  console.log(`Found: ${present.length}`);
  console.log(`Missing: ${missing.length}\n`);

  if (missing.length > 0) {
    console.log(`❌ MISSING ACCOUNTS — create these in Chart of Accounts:`);
    console.log(`─`.repeat(70));
    console.log(`  ${"PCGE".padEnd(6)} ${"Name".padEnd(40)} ${"ERPNext Account"}`);
    console.log(`─`.repeat(70));
    for (const m of missing) {
      console.log(
        `  ${m.pcgeCode.padEnd(6)} ${m.pcgeName.padEnd(40)} ${m.erpnextAccount}`,
      );
    }
    console.log();
  }

  if (present.length > 0) {
    console.log(`✅ Existing accounts (${present.length}):`);
    for (const p of present) {
      console.log(`  ✓ PCGE ${p.pcgeCode} → ${p.erpnextAccount}`);
    }
  }

  // Exit with error if any account is missing
  if (missing.length > 0) {
    console.log(`\n⚠️  Fix the missing accounts before going to production.`);
    process.exit(1);
  }

  console.log(`\n✅ All PCGE accounts verified. The connector is ready.`);
}

validatePcgeMapping().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
```

**How to use:**

1. Replace `"Your Company"` with your actual ERPNext company name
2. Set the three `DRENYRA_ERPNEXT_*` environment variables
3. Run `bun run validate-pcge-mapping.ts`
4. The script will iterate every entry in `PCGE_TO_ERPNext_SAMPLE` and report which ones exist and which are missing
5. Create any missing accounts in ERPNext's Chart of Accounts before going live

---

## Related

- [Connector source: `packages/ecosystem/src/adapters/erpnext/erpnext.connector.ts`](../src/adapters/erpnext/erpnext.connector.ts)
- [Mapper source: `packages/ecosystem/src/adapters/erpnext/erpnext.mapper.ts`](../src/adapters/erpnext/erpnext.mapper.ts)
- [Types and PCGE mapping: `packages/ecosystem/src/adapters/erpnext/erpnext.types.ts`](../src/adapters/erpnext/erpnext.types.ts)
- [Config schema: `packages/ecosystem/src/config.ts`](../src/config.ts)
- [Base connector (circuit breaker): `packages/ecosystem/src/base.connector.ts`](../src/base.connector.ts)
- [Integration strategy: `docs/01-architecture/ecosystem-integration-strategy-2026.md`](../../../docs/01-architecture/ecosystem-integration-strategy-2026.md)
