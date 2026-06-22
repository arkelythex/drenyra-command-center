import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { parseBankCsv } from "./bank-csv";
import type { BankCsvFormat } from "./bank-csv/types";

/**
 * Normalized banking transaction payload for bulk imports (Agentic Ledger v1).
 *
 * @example
 * ```ts
 * const row: ImportTransactionInput = { date: new Date(), description: "DEPÓSITO", amount: 10, type: "CREDIT" };
 * ```
 */
export interface ImportTransactionInput {
  date: Date;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  reference?: string;
}

/**
 * Minimal port used by Agentic Ledger for bank ingestion.
 *
 * @example
 * ```ts
 * await importer.importTransactions("cmp", "acc", []);
 * ```
 */
export interface BankTransactionImporter {
  importTransactions(companyId: string, accountId: string, transactions: ImportTransactionInput[]): Promise<number>;
}

type IngestBankInput = {
  companyId: string;
  accountId: string;
  connector: "normalized" | "csv";
  format?: BankCsvFormat | string;
  transactions?: Array<{
    date: string;
    description: string;
    amount: number;
    type: "DEBIT" | "CREDIT";
    reference?: string;
  }>;
  csvText?: string;
};

/**
 * Agentic Ledger application service (v1).
 *
 * For Perú v1, we start by ingesting banking transactions into the existing Banking storage,
 * and later build proposals/reconciliation on top of the same system-of-record.
 *
 * @example
 * ```ts
 * const service = new AgenticLedgerService();
 * await service.ingestBank({ companyId, accountId, connector: "normalized", transactions: [] });
 * ```
 */
export class AgenticLedgerService {
  private readonly logger = SecureLogger.namespace("AgenticLedgerService");

  constructor(private readonly transactionService: BankTransactionImporter) {}

  /**
   * Ingest bank transactions for a company/account.
   *
   * v1 strategy (Perú): accept client-normalized rows. CSV parsing is supported in a constrained
   * format only to enable accountant workflows while we add bank-specific mappers.
   *
   * @param input - ingestion request
   * @returns counts of imported rows
   * @throws Error if required fields are missing or connector not supported
   *
   * @example
   * ```ts
   * await service.ingestBank({
   *   companyId: "cmp_uuid",
   *   accountId: "acc_uuid",
   *   connector: "normalized",
   *   transactions: [{ date: "2026-01-31", description: "DEPÓSITO", amount: 10, type: "CREDIT" }]
   * });
   * ```
   */
  async ingestBank(
    input: IngestBankInput
  ): Promise<{ imported: number; duplicates: number; warnings: string[] }> {
    if (!input.companyId) throw new Error("companyId is required");
    if (!input.accountId) throw new Error("accountId is required");

    let txs: ImportTransactionInput[] = [];
    let warnings: string[] = [];

    if (input.connector === "csv") {
      const parsed = parseCsvByFormat(input.csvText ?? "", input.format);
      warnings = parsed.warnings;
      if (warnings.length > 0) {
        this.logger.warn("Bank CSV parse warnings", { format: input.format ?? "GENERIC", warnings });
      }
      txs = parsed.transactions;
    } else {
      txs = normalizeTransactions(input.transactions ?? []);
    }

    if (txs.length === 0) return { imported: 0, duplicates: 0, warnings };

    // v1 dedupe: best-effort; true idempotency keys require a persisted identity model
    const unique = dedupeInMemory(txs);
    const duplicates = txs.length - unique.length;

    const imported = await this.transactionService.importTransactions(input.companyId, input.accountId, unique);
    if (imported < unique.length) {
      this.logger.warn("Partial bank ingest (some rows failed)", {
        imported,
        attempted: unique.length,
      });
    }

    return { imported, duplicates, warnings };
  }
}

function parseCsvByFormat(
  csvText: string,
  format: BankCsvFormat | string | undefined
): { transactions: ImportTransactionInput[]; warnings: string[] } {
  const normalized = normalizeBankCsvFormat(format);
  const res = parseBankCsv(csvText, normalized);
  return { transactions: res.transactions, warnings: res.warnings };
}

function normalizeBankCsvFormat(format: BankCsvFormat | string | undefined): BankCsvFormat {
  if (format === "BCP" || format === "BBVA" || format === "INTERBANK" || format === "SCOTIABANK" || format === "GENERIC") {
    return format;
  }
  return "GENERIC";
}

function normalizeTransactions(
  rows: IngestBankInput["transactions"]
): ImportTransactionInput[] {
  return (rows ?? []).map((r) => ({
    date: new Date(r.date),
    description: r.description,
    amount: r.amount,
    type: r.type,
    reference: r.reference,
  }));
}

function dedupeInMemory(inputs: ImportTransactionInput[]): ImportTransactionInput[] {
  const seen = new Set<string>();
  const out: ImportTransactionInput[] = [];

  for (const tx of inputs) {
    const key = [
      tx.type,
      tx.amount,
      tx.date.toISOString().slice(0, 10),
      (tx.description ?? "").trim().toLowerCase(),
      (tx.reference ?? "").trim().toLowerCase(),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tx);
  }

  return out;
}

/**
 * v1 note: dedupe/idempotency across uploads requires persisted identity keys; current dedupe is upload-local.
 */
