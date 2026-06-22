# `@/lib` — Utility Libraries Reference

**Last updated**: 2026-06-10

> Auto-generated from source. Keep in sync when changing APIs in `lib/`.

---

## Quick Reference

| Library | Primary Export | Solves |
|---------|---------------|--------|
| `api-factory.ts` | `safeApiCall`, `queryApi`, `mutateApi`, `createCrudApi` | Type-safe Eden Treaty calls with tenant context injection, error normalization |
| `crud-api.ts` | `createCrudHooks` | TanStack Query hooks for list/get/create/update/delete with auto-invalidation |
| `treaty-route-client.ts` | `getTreatyRouteClient` | Runtime resolution of Eden Treaty route clients + error message extraction |
| `export-service.ts` | `exportData`, `downloadExport` | Multi-format (CSV/TSV/JSON/PDF/XLSX/Encrypted) data export with plugin system |
| `process-machine.ts` | `createProcessMachine` | XState process/analyze/resolve/error machines with typed context |
| `import-utils.ts` | `parseCSV`, `parseFile`, `parseDateLoose`, `parseAmountLoose` | CSV/delimited-file parsing, bank-format detection, field normalization |

---

### `lib/api-factory.ts`

**Purpose**: Wraps Eden Treaty API calls with consistent tenant-scoped error handling, normalizes results to a discriminated union, and provides a CRUD factory for resource endpoints.

**Entry points**:

```ts
safeApiCall<T>(call: () => Promise<T>): Promise<ApiResult<T>>
queryApi<T>(call: (ctx) => Promise<unknown>, fallbackMessage: string): Promise<T>
queryApiPassthrough<T>(call, fallbackMessage): Promise<T>
mutateApi<T>(call, fallbackMessage): Promise<T>
createCrudApi(path: string, options?): { list, getById, create, update, delete }
```

**Key types**: `ApiResult<T>`, `CrudMessages`, `TenantContext`

**`safeApiCall`** — Wrap any async call into `{ ok: true, data: T } | { ok: false, error: string, code?: string }`. Use when you want match-on-result instead of try/catch.

**`queryApi`** — Eden Treaty GET with `TenantContext` auto-injected into query params, then `unwrap` + `extractOkData` on the response. Throws on error with your fallback message.

**`queryApiPassthrough`** — Same as `queryApi` but uses `extractOkDataOrPassthrough` for routes that return unwrapped bodies (no `ok()` envelope).

**`mutateApi`** — POST/PUT/PATCH/DELETE with tenant context injected into the body, then `unwrap` + `extractOkData`.

**`createCrudApi`** — Creates a typed CRUD client for any Eden Treaty resource path (supports dotted nesting, e.g. `"banking.accounts"`). Optionally wraps responses through `extractOkData`.

**Usage example**:

```ts
import { safeApiCall, queryApi, mutateApi, createCrudApi } from "@/lib/api-factory"

// Safe call with discriminated union
const result = await safeApiCall(() =>
  unwrap(api.api.customers.get({ query: { companyId } }))
)
if (!result.ok) return toast.error(result.error)

// Query with tenant context
const accounts = await queryApi(
  (ctx) => api.api.banking.accounts.get({ query: ctx }),
  "No se pudieron cargar las cuentas",
)

// CRUD factory
const customers = createCrudApi("customers", {
  extract: true,
  messages: { list: "No se pudieron cargar los clientes" },
})
const list = await customers.list({ companyId })
const one = await customers.getById("id")
```

---

### `lib/crud-api.ts`

**Purpose**: Generates TanStack Query hooks (useList, useGet, useCreate, useUpdate, useDelete) for a resource, scoped to the active company and with automatic query invalidation on mutations.

**Entry point**: `createCrudHooks<T, Create, Update>(config: CrudConfig<T, Create, Update>)`

**Key types**: `CrudConfig<T, Create, Update>`, `UseListOptions`

**Returns**: `{ keys, useList, useGet, useCreate, useUpdate, useDelete }`

**`crudKeys(resource: string)`** — Query key factory returning `all`, `list(companyId)`, `detail(id)` keys.

**Usage example**:

```ts
// Define at module level
import { createCrudHooks } from "@/lib/crud-api"

const productsApi = createCrudHooks({
  key: "products",
  list: (companyId) => productService.list({ companyId }),
  getById: (id) => productService.getById(id),
  create: (companyId, data) => productService.create({ ...data, companyId }),
  update: (id, data) => productService.update(id, data),
  delete: (id) => productService.delete(id),
})

// In component
const { data, isLoading } = productsApi.useList()
const mutation = productsApi.useCreate()
```

---

### `lib/treaty-route-client.ts`

**Purpose**: Resolves Eden Treaty route clients at runtime by key, with a client registry for reuse and a helper to extract user-facing error messages from Treaty error shapes.

**Entry points**:

```ts
getTreatyRouteClient<TClient>(routeKey: string): TClient
registerClient<T>(name: string, client: T): T
getClient<T>(name: string): T | undefined
listClients(): string[]
getTreatyErrorMessage(error: TreatyErrorShape | null | undefined, fallback: string): string
```

**Key types**: `TreatyErrorShape`, `TreatyResponse<TData>`

**`getTreatyRouteClient`** — Looks up `treatyRoot[routeKey]` or `treatyRoot.api[routeKey]` and auto-registers the found client. Throws if not found.

**`getTreatyErrorMessage`** — Extracts a string message from `TreatyErrorShape.value` (handles strings, Errors, and `{ message, error }` objects), falling back to your default.

**Usage example**:

```ts
import { getTreatyRouteClient, getTreatyErrorMessage } from "@/lib/treaty-route-client"

const bankingClient = getTreatyRouteClient("banking")

const res = await bankingClient.accounts.get()
if (res.error) {
  throw new Error(getTreatyErrorMessage(res.error, "Error al cargar cuentas"))
}
```

---

### `lib/export-service.ts`

**Purpose**: Generates downloadable files (CSV, TSV, JSON, PDF, XLSX, encrypted) from tabular data with an extensible plugin system.

**Entry points**:

```ts
exportData(options: ExportDataOptions): Promise<Blob>
downloadExport(blob: Blob, filename: string): void
registerPlugin(plugin: ExportPlugin): void
```

**Key types**: `ExportFormat`, `ExportColumn`, `ExportDataOptions`, `ExportPlugin`

**Constants**: `EXPORT_FORMATS` (`CSV`, `TSV`, `JSON`, `PDF`, `XLSX`, `ENCRYPTED`)

**Built-in formats**: CSV (BOM-prefixed), TSV (BOM-prefixed), JSON (pretty-printed). PDF, XLSX, and Encrypted formats require a registered plugin or a configured `apiUrl` for server-side render.

**`registerPlugin`** — Register custom export plugins (e.g., for PDF via a dedicated renderer). Plugins take priority over built-in formats.

**`downloadExport`** — Creates a temporary `<a>` element, triggers download, and cleans up. Safe to call server-side (no-op if `window`/`document` unavailable).

**Usage example**:

```ts
import { exportData, downloadExport, EXPORT_FORMATS } from "@/lib/export-service"

const blob = await exportData({
  format: EXPORT_FORMATS.CSV,
  data: rows,
  columns: [{ key: "name", label: "Nombre" }, { key: "total", label: "Total" }],
  filename: "reporte.csv",
})
downloadExport(blob, "reporte.csv")
```

---

### `lib/process-machine.ts`

**Purpose**: Creates XState (v5) state machines for multi-step processing workflows (process → analyze → resolve / error).

**Entry point**:

```ts
createProcessMachine<TContext>(config: ProcessMachineConfig<TContext>)
```

**Key types**: `ProcessStatus`, `ProcessBaseContext`, `ProcessMachineConfig<TContext>`

**States**: `idle` → `processing` → (`analyzing` →) `resolved` | `error`

**Events**: `PROCESS`, `RESOLVE`, `FAIL`, `RETRY`, `RESET`

**Three modes** (auto-detected from config):

| Mode | Spec | Behavior |
|------|------|----------|
| **process-and-analyze** | `onProcess` + `onAnalyze` | Two-phase: process, then analyze, then resolved |
| **process-only** | `onProcess` only | Single phase: process then resolved |
| **event-driven** | Neither | Manual `RESOLVE` / `FAIL` events trigger transitions |

**Context is preserved** across phases — each actor receives the current context and can return partial context updates via `assign`.

**`onError`** for both phases assigns `context.error` with the error message and transitions to `error`. From error, `RETRY` retries processing, `RESET` goes back to idle (pristine context via `structuredClone`).

**Usage example**:

```ts
import { createProcessMachine } from "@/lib/process-machine"
import { useInterpret, useSelector } from "@xstate/react"

const machine = createProcessMachine({
  id: "import-transactions",
  context: { error: null, rows: [], validated: 0 },
  onProcess: async (ctx) => {
    const validated = await validateRows(ctx.rows)
    return { ...ctx, validated: validated.length }
  },
  onAnalyze: async (ctx) => {
    const anomalies = await detectAnomalies(ctx.rows)
    return { ...ctx, anomalies }
  },
})

// In component:
const actor = useInterpret(machine)
const status = useSelector(actor, (s) => s.value)
const error = useSelector(actor, (s) => s.context.error)
// actor.send({ type: "PROCESS" })
// actor.send({ type: "RESET" })
```

---

### `lib/import-utils.ts`

**Purpose**: Parses CSV/TSV files from bank exports, detects bank-specific formats, normalizes dates/amounts/transaction types, and returns typed results with error reporting.

**Entry points**:

```ts
parseCSV<T>(content: string, options?: CSVParserOptions<T>): ParseResult<T>
parseFile<T>(file: File, options?: FileParserOptions): Promise<ParseResult<T>>
detectDelimiter(firstLine: string): Delimiter
parseCsvLine(line: string, delimiter: Delimiter): string[]
parseDateLoose(value: string): Date | null
parseAmountLoose(value: string): number | null
normalizeTxType(value: string): "CREDIT" | "DEBIT" | null
findColumnIndex(headers: string[], names: string[]): number
detectHeaderRow(headers: string[]): boolean
```

**Key types**: `ParseResult<T>`, `ParseError`, `CSVParserOptions<T>`, `FileParserOptions`, `Delimiter`, `ImportFormat`, `ImportTransactionRow`, `BankCsvFormat`

**Constants**: `BANK_FORMATS` — known bank specs (BCP, BBVA, Interbank, Scotiabank) with expected columns, delimiters, and date formats.

**`parseCSV`** — Core CSV parser (handles quoted fields, escaped quotes). Auto-detects delimiter (`\t` > `;` > `,`). Auto-detects header row by matching known header words. Accepts a `mapRow` callback for typed row mapping.

**`parseFile`** — Wraps `parseCSV` for `File` objects. Supports `.csv` and `.tsv` extensions, falls back to unsupported format error for others.

**`parseDateLoose`** — Tries ISO parse first, then `DD/MM/YYYY` / `DD-MM-YYYY`.

**`parseAmountLoose`** — Handles European-style comma-as-decimal, thousand separators, currency symbols.

**`normalizeTxType`** — Maps Spanish/English labels to `CREDIT` / `DEBIT`.

**Usage example**:

```ts
import { parseCSV, parseDateLoose, parseAmountLoose, normalizeTxType } from "@/lib/import-utils"

const content = await file.text()
const result = parseCSV<ImportTransactionRow>(content, {
  mapRow: (cols, headers) => ({
    date: parseDateLoose(cols[0]),
    amount: parseAmountLoose(cols[2]),
    type: normalizeTxType(cols[3]),
  }),
})

if (result.errors.length > 0) {
  console.warn("Parse errors:", result.errors)
}
// result.data: ImportTransactionRow[]
// result.metadata: { rowCount, detectedDelimiter, parseTimeMs }
```

---

## When to use which

| You need… | Use… |
|-----------|------|
| Call an API with tenant scoping and error normalization | `queryApi` / `mutateApi` |
| Wrap a call without throwing exceptions | `safeApiCall` |
| Get typed CRUD hooks with TanStack Query | `createCrudHooks` (`crud-api.ts`) |
| Resolve an Eden Treaty client by key at runtime | `getTreatyRouteClient` |
| Parse a bank CSV/TSV file from upload | `parseFile` / `parseCSV` (`import-utils.ts`) |
| Normalize a date/amount/transaction-type string | `parseDateLoose` / `parseAmountLoose` / `normalizeTxType` |
| Export tabular data to a downloadable file | `exportData` + `downloadExport` |
| Model a multi-step process (import → validate → resolve) | `createProcessMachine` |
| Build a full CRUD client for a resource with Eden Treaty | `createCrudApi` (`api-factory.ts`) |
