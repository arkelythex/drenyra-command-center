/**
 * Import Bank Transactions Use Case
 *
 * Imports bank transactions from various sources:
 * - CSV files (from bank exports)
 * - OFX/QIF files
 * - Direct entry
 *
 * Features:
 * - Duplicate detection
 * - Auto-categorization (pending)
 * - Batch processing
 */

import {
	BankTransaction,
	type BankTransactionType,
	type Currency,
} from "@drenyra/domain/entities/BankTransaction";
import type { BankAccountRepository } from "@drenyra/domain/repositories/bank-account.repository";
import type { BankTransactionRepository } from "@drenyra/domain/repositories/bank-transaction.repository";
import { Money } from "@drenyra/domain/value-objects/Money";

// ============================================
// TYPES
// ============================================

/**
 * ImportTransactionRow interface.
 *
 * @example
 * ```ts
 * const value: ImportTransactionRow = {} as ImportTransactionRow;
 * console.log(value);
 * ```
 */
export interface ImportTransactionRow {
	date: string | Date;
	description: string;
	amount: number;
	type?: "CREDIT" | "DEBIT";
	reference?: string;
	balance?: number;
}

/**
 * ImportBankTransactionsInput interface.
 *
 * @example
 * ```ts
 * const value: ImportBankTransactionsInput = {} as ImportBankTransactionsInput;
 * console.log(value);
 * ```
 */
export interface ImportBankTransactionsInput {
	organizationId: number;
	bankAccountId: number;
	transactions: ImportTransactionRow[];
	importBatchName?: string;
	skipDuplicates?: boolean;
}

/**
 * ImportResult interface.
 *
 * @example
 * ```ts
 * const value: ImportResult = {} as ImportResult;
 * console.log(value);
 * ```
 */
export interface ImportResult {
	success: boolean;
	importedCount: number;
	skippedDuplicates: number;
	errors: ImportError[];
	batchId?: string;
}

/**
 * ImportError interface.
 *
 * @example
 * ```ts
 * const value: ImportError = {} as ImportError;
 * console.log(value);
 * ```
 */
export interface ImportError {
	row: number;
	message: string;
	data?: ImportTransactionRow;
}

// ============================================
// USE CASE
// ============================================

/**
 * ImportBankTransactionsUseCase class.
 *
 * @example
 * ```ts
 * const value = new ImportBankTransactionsUseCase();
 * console.log(value);
 * ```
 */
export class ImportBankTransactionsUseCase {
	constructor(
		private readonly transactionRepository: BankTransactionRepository,
		private readonly bankAccountRepository: BankAccountRepository,
	) {}

	async execute(input: ImportBankTransactionsInput): Promise<ImportResult> {
		const errors: ImportError[] = [];
		const validTransactions: BankTransaction[] = [];
		let skippedDuplicates = 0;

		try {
			// Validate bank account ownership
			const bankAccount = await this.bankAccountRepository.findById(
				input.bankAccountId,
				input.organizationId,
			);

			if (!bankAccount) {
				return {
					success: false,
					importedCount: 0,
					skippedDuplicates: 0,
					errors: [
						{
							row: 0,
							message: "Cuenta bancaria no encontrada o no autorizada",
						},
					],
				};
			}

			const currency = bankAccount.currency as Currency;
			const batchId = input.importBatchName || this.generateBatchId();

			// Get existing transactions for duplicate detection
			const existingTransactions = input.skipDuplicates
				? await this.transactionRepository.findByBankAccount(
						input.bankAccountId,
						{},
						{ page: 1, limit: 1000 },
					)
				: { data: [] };

			// Create a set of existing transaction signatures for quick lookup
			const existingSignatures = new Set(
				existingTransactions.data.map((t) => this.getTransactionSignature(t)),
			);

			// Process each row
			for (let i = 0; i < input.transactions.length; i++) {
				const row = input.transactions[i];
				if (!row) continue;

				try {
					// Parse and validate the row
					const parsed = this.parseRow(row, i + 1, currency);

					if (!parsed.success) {
						errors.push({ row: i + 1, message: parsed.error!, data: row });
						continue;
					}

					// Check for duplicates
					const signature = this.getRowSignature(row);
					if (input.skipDuplicates && existingSignatures.has(signature)) {
						skippedDuplicates++;
						continue;
					}

					// Create domain entity
					const transaction = BankTransaction.createNew({
						bankAccountId: input.bankAccountId,
						transactionDate: parsed.date!,
						description: parsed.description!,
						type: parsed.type!,
						amount: Money.fromAmount(Math.abs(parsed.amount!), currency),
						reference: parsed.reference,
						balanceAfter:
							parsed.balance !== undefined
								? Money.fromAmount(parsed.balance, currency)
								: undefined,
						importBatch: batchId,
					});

					validTransactions.push(transaction);
				} catch (error) {
					errors.push({
						row: i + 1,
						message:
							error instanceof Error ? error.message : "Error desconocido",
						data: row,
					});
				}
			}

			// Batch save valid transactions
			let importedCount = 0;
			if (validTransactions.length > 0) {
				const saved =
					await this.transactionRepository.saveMany(validTransactions);
				importedCount = saved.length;
			}

			return {
				success: errors.length === 0,
				importedCount,
				skippedDuplicates,
				errors,
				batchId,
			};
		} catch (error) {
			return {
				success: false,
				importedCount: 0,
				skippedDuplicates: 0,
				errors: [
					{
						row: 0,
						message:
							error instanceof Error
								? error.message
								: "Error durante la importación",
					},
				],
			};
		}
	}

	/**
	 * Parse a row from import data
	 */
	private parseRow(
		row: ImportTransactionRow,
		_rowNumber: number,
		_currency: Currency,
	): {
		success: boolean;
		date?: Date;
		description?: string;
		amount?: number;
		type?: BankTransactionType;
		reference?: string;
		balance?: number;
		error?: string;
	} {
		// Parse date
		let date: Date;
		if (row.date instanceof Date) {
			date = row.date;
		} else if (typeof row.date === "string") {
			date = this.parseDate(row.date);
			if (isNaN(date.getTime())) {
				return { success: false, error: `Fecha inválida: ${row.date}` };
			}
		} else {
			return { success: false, error: "Fecha requerida" };
		}

		// Validate description
		if (!row.description || row.description.trim() === "") {
			return { success: false, error: "Descripción requerida" };
		}

		// Validate amount
		if (
			typeof row.amount !== "number" ||
			isNaN(row.amount) ||
			row.amount === 0
		) {
			return { success: false, error: "Monto inválido o cero" };
		}

		// Determine transaction type
		let type: BankTransactionType;
		if (row.type) {
			type = row.type === "CREDIT" ? "DEPOSIT" : "WITHDRAWAL";
		} else {
			// Infer from amount sign
			type = row.amount > 0 ? "DEPOSIT" : "WITHDRAWAL";
		}

		return {
			success: true,
			date,
			description: row.description.trim(),
			amount: Math.abs(row.amount),
			type,
			reference: row.reference?.trim(),
			balance: row.balance,
		};
	}

	/**
	 * Parse date from various formats
	 */
	private parseDate(dateStr: string): Date {
		// Try common formats
		// DD/MM/YYYY (Peru standard)
		let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (match && match[1] && match[2] && match[3]) {
			return new Date(
				parseInt(match[3]),
				parseInt(match[2]) - 1,
				parseInt(match[1]),
			);
		}

		// YYYY-MM-DD (ISO)
		match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
		if (match && match[1] && match[2] && match[3]) {
			return new Date(
				parseInt(match[1]),
				parseInt(match[2]) - 1,
				parseInt(match[3]),
			);
		}

		// DD-MM-YYYY
		match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
		if (match && match[1] && match[2] && match[3]) {
			return new Date(
				parseInt(match[3]),
				parseInt(match[2]) - 1,
				parseInt(match[1]),
			);
		}

		// Try native Date parsing as fallback
		return new Date(dateStr);
	}

	/**
	 * Generate a unique signature for a transaction (for duplicate detection)
	 */
	private getTransactionSignature(transaction: BankTransaction): string {
		const dateStr = transaction.transactionDate.toISOString().split("T")[0];
		return `${dateStr}|${transaction.amount.getAmount()}|${transaction.description.substring(0, 50)}`;
	}

	/**
	 * Generate a signature for an import row
	 */
	private getRowSignature(row: ImportTransactionRow): string {
		const date = row.date instanceof Date ? row.date : this.parseDate(row.date);
		const dateStr = date.toISOString().split("T")[0];
		const amount = Math.abs(row.amount);
		return `${dateStr}|${amount}|${row.description.substring(0, 50)}`;
	}

	/**
	 * Generate a batch ID
	 */
	private generateBatchId(): string {
		const now = new Date();
		const timestamp = now
			.toISOString()
			.replace(/[-:T.Z]/g, "")
			.substring(0, 14);
		const random = Math.random().toString(36).substring(2, 8);
		return `IMP-${timestamp}-${random}`;
	}
}

// ============================================
// CSV PARSER HELPER
// ============================================

/**
 * Parse CSV content into import rows
 * @param csvContent - Input for csvContent.
 * @param columnMapping - Input for columnMapping.
 * @param options - Input for options.
 * @returns Result of parseCsvToImportRows.
 * @example
 * ```ts
 * const result = parseCsvToImportRows("", {}, {});
 * console.log(result);
 * ```
 */

export function parseCsvToImportRows(
	csvContent: string,
	columnMapping: {
		dateColumn: number;
		descriptionColumn: number;
		amountColumn: number;
		referenceColumn?: number;
		balanceColumn?: number;
	},
	options: {
		delimiter?: string;
		skipHeader?: boolean;
		dateFormat?: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
	} = {},
): ImportTransactionRow[] {
	const delimiter = options.delimiter || ",";
	const lines = csvContent.split("\n").filter((line) => line.trim());

	const startIndex = options.skipHeader ? 1 : 0;
	const rows: ImportTransactionRow[] = [];

	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		const columns = parseCSVLine(line, delimiter);

		const dateStr = columns[columnMapping.dateColumn];
		const description = columns[columnMapping.descriptionColumn];
		const amountStr = columns[columnMapping.amountColumn];

		if (!dateStr || !description || !amountStr) continue;

		// Parse amount (handle different formats)
		const amount = parseFloat(
			amountStr.replace(/['"]/g, "").replace(/,/g, "").trim(),
		);

		if (isNaN(amount)) continue;

		const row: ImportTransactionRow = {
			date: dateStr.trim().replace(/['"]/g, ""),
			description: description.trim().replace(/['"]/g, ""),
			amount,
		};

		if (columnMapping.referenceColumn !== undefined) {
			row.reference = columns[columnMapping.referenceColumn]
				?.trim()
				.replace(/['"]/g, "");
		}

		if (columnMapping.balanceColumn !== undefined) {
			const balanceStr = columns[columnMapping.balanceColumn];
			if (balanceStr) {
				row.balance = parseFloat(
					balanceStr.replace(/['"]/g, "").replace(/,/g, ""),
				);
			}
		}

		rows.push(row);
	}

	return rows;
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === delimiter && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
}
