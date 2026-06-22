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
