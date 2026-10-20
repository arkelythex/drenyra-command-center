import { SecureLogger } from "@drenyra/shared/secure-logger";
import { bankingRepository } from "../../infrastructure/banking.repository";
import type { StatementRow } from "../statement-import";

/** One statement row: positive whole cents, direction in `type`. */
export type ImportRow = StatementRow;

export interface ImportTransactionsCommand {
	companyId: string;
	accountId: string;
	source: "CSV" | "BANK_API" | "MT940";
	transactions: ImportRow[];
}

export interface ImportResult {
	imported: number;
	skipped: number;
	errors: Array<{ row: number; description: string; error: string }>;
}

export class BankAccountNotFoundError extends Error {
	constructor(accountId: string) {
		super(`Bank account not found: ${accountId}`);
		this.name = "BankAccountNotFoundError";
	}
}

const logger = SecureLogger.namespace("importTransactions");

/**
 * Import a bank statement in one database transaction: every new row or none.
 * Rows already stored are skipped (see planStatementImport).
 */
export async function importTransactions(
	cmd: ImportTransactionsCommand,
): Promise<ImportResult> {
	const result = await bankingRepository.importStatement(
		cmd.companyId,
		cmd.accountId,
		cmd.transactions,
		cmd.source,
	);
	if (!result) throw new BankAccountNotFoundError(cmd.accountId);

	logger.info("Import completed", result);
	return { ...result, errors: [] };
}
