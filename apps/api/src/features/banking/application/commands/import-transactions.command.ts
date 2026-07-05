import { SecureLogger } from "@drenyra/shared/secure-logger";
import type { TransactionType } from "../../domain/types";
import { recordTransaction } from "./record-transaction.command";

export interface ImportRow {
	date: Date;
	description: string;
	amount: number;
	type: TransactionType;
	reference?: string;
}

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

const logger = SecureLogger.namespace("importTransactions");

export async function importTransactions(
	cmd: ImportTransactionsCommand,
): Promise<ImportResult> {
	const errors: ImportResult["errors"] = [];
	let imported = 0;

	for (let i = 0; i < cmd.transactions.length; i++) {
		const row = cmd.transactions[i];

		if (!row) continue;

		try {
			await recordTransaction({
				companyId: cmd.companyId,
				accountId: cmd.accountId,
				transactionDate: row.date,
				description: row.description,
				reference: row.reference,
				type: row.type,
				amount: row.amount,
				importedFrom: cmd.source,
			});
			imported += 1;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			logger.error("Failed to import row", { row: i + 1, error: message });
			errors.push({ row: i + 1, description: row.description, error: message });
		}
	}

	logger.info("Import completed", { imported, errors: errors.length });

	return { imported, skipped: 0, errors };
}
