import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { parseBankCsv } from "../bank-csv";
import type { BankCsvFormat } from "../bank-csv/types";
import type {
	BankTransactionImporter,
	ImportTransactionInput,
} from "../agentic-ledger.service";
import {
	type WasmBankSkillConfig,
	WasmBankSkillSandboxService,
} from "./wasm-bank-skill-sandbox.service";

/**
 * IngestBankWithWasmInput interface.
 *
 * @example
 * ```ts
 * const value: IngestBankWithWasmInput = {} as IngestBankWithWasmInput;
 * console.log(value);
 * ```
 */
export interface IngestBankWithWasmInput {
	companyId: string;
	accountId: string;
	csvText: string;
	format?: BankCsvFormat | string;
	wasmSkill: WasmBankSkillConfig;
}

/**
 * IngestBankWithWasmOutput interface.
 *
 * @example
 * ```ts
 * const value: IngestBankWithWasmOutput = {} as IngestBankWithWasmOutput;
 * console.log(value);
 * ```
 */
export interface IngestBankWithWasmOutput {
	imported: number;
	duplicates: number;
	warnings: string[];
	skillExecution: {
		processedRows: number;
		skippedRows: number;
		durationMs: number;
		timeoutMs: number;
	};
}

function normalizeBankCsvFormat(format: BankCsvFormat | string | undefined): BankCsvFormat {
	if (
		format === "BCP" ||
		format === "BBVA" ||
		format === "INTERBANK" ||
		format === "SCOTIABANK" ||
		format === "GENERIC"
	) {
		return format;
	}
	return "GENERIC";
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
 * AgenticLedgerWasmSkillService class.
 *
 * @example
 * ```ts
 * const value = new AgenticLedgerWasmSkillService();
 * console.log(value);
 * ```
 */
export class AgenticLedgerWasmSkillService {
	private readonly logger = SecureLogger.namespace("AgenticLedgerWasmSkillService");
	private readonly sandbox = new WasmBankSkillSandboxService();

	constructor(private readonly transactionService: BankTransactionImporter) {}

	async ingestWithWasm(input: IngestBankWithWasmInput): Promise<IngestBankWithWasmOutput> {
		if (!input.companyId) throw new Error("companyId is required");
		if (!input.accountId) throw new Error("accountId is required");
		if (!input.csvText?.trim()) throw new Error("csvText is required");

		const parsed = parseBankCsv(input.csvText, normalizeBankCsvFormat(input.format));
		const transformed = await this.sandbox.transformTransactions(
			parsed.transactions,
			input.wasmSkill,
		);

		if (transformed.transactions.length === 0) {
			return {
				imported: 0,
				duplicates: 0,
				warnings: parsed.warnings,
				skillExecution: transformed.execution,
			};
		}

		const unique = dedupeInMemory(transformed.transactions);
		const duplicates = transformed.transactions.length - unique.length;
		const imported = await this.transactionService.importTransactions(
			input.companyId,
			input.accountId,
			unique,
		);

		if (imported < unique.length) {
			this.logger.warn("Partial WASM bank ingest", {
				imported,
				attempted: unique.length,
			});
		}

		return {
			imported,
			duplicates,
			warnings: parsed.warnings,
			skillExecution: transformed.execution,
		};
	}
}
