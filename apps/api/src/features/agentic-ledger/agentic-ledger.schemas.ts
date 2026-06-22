import { t } from "elysia";

/**
 * Bank ingestion connectors supported by the Agentic Ledger v1.
 *
 * - `normalized`: client sends normalized transactions (recommended for v1).
 * - `csv`: raw CSV text is accepted (format is constrained; mapper may be added later).
 *
 * @example
 * ```ts
 * const connector = "normalized";
 * ```
 */
export const BankIngestConnectorSchema = t.Union([t.Literal("normalized"), t.Literal("csv")]);

/**
 * Supported bank CSV formats (Perú) for ingestion.
 *
 * @example
 * ```ts
 * const format = "BCP";
 * ```
 */
export const BankCsvFormatSchema = t.Union([
  t.Literal("BCP"),
  t.Literal("BBVA"),
  t.Literal("INTERBANK"),
  t.Literal("SCOTIABANK"),
  t.Literal("GENERIC"),
]);

/**
 * A normalized transaction row ready to be imported into Banking storage.
 *
 * @example
 * ```ts
 * const row = {
 *   date: "2026-01-31",
 *   description: "PAGO PROVEEDOR ACME",
 *   amount: 118.0,
 *   type: "DEBIT",
 *   reference: "OP-123"
 * };
 * ```
 */
export const NormalizedBankTransactionSchema = t.Object({
  date: t.String({ description: "ISO date (YYYY-MM-DD)" }),
  description: t.String({ minLength: 1 }),
  amount: t.Number({ description: "Decimal amount in account currency (PEN/USD)" }),
  type: t.Union([t.Literal("DEBIT"), t.Literal("CREDIT")]),
  reference: t.Optional(t.String()),
});

/**
 * Request body for `POST /api/agentic-ledger/ingest/bank`.
 *
 * @example
 * ```ts
 * const body = {
 *   companyId: "uuid",
 *   accountId: "uuid",
 *   connector: "normalized",
 *   transactions: [{ date: "2026-01-31", description: "DEPÓSITO", amount: 10, type: "CREDIT" }]
 * };
 * ```
 */
export const IngestBankSchema = t.Object({
  companyId: t.String({ format: "uuid", description: "Company UUID (maps to multi-RUC entity)" }),
  accountId: t.String({ format: "uuid", description: "Bank account UUID in `bank_accounts`" }),
  connector: BankIngestConnectorSchema,
  format: t.Optional(
    t.Union([
      BankCsvFormatSchema,
      t.String({ description: "Custom format key (future)", minLength: 1 }),
    ])
  ),
  transactions: t.Optional(t.Array(NormalizedBankTransactionSchema)),
  csvText: t.Optional(t.String({ description: "Raw CSV text (bank export)" })),
});
