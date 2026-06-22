import { Money } from "@arkelythex/domain";
import type { Currency } from "@arkelythex/domain/value-objects/Money";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import type { TransactionType } from "../../domain/types";
import { bankingRepository } from "../../infrastructure/banking.repository";

export interface RecordTransactionCommand {
	companyId: string;
	accountId: string;
	transactionDate: Date;
	description: string;
	reference?: string;
	type: TransactionType;
	amount: number;
	category?: string;
	tags?: string[];
	importedFrom?: "MANUAL" | "CSV" | "BANK_API" | "MT940";
}

export interface RecordTransactionResult {
	transactionId: string;
	newBalance: string;
}

const logger = SecureLogger.namespace("recordTransaction");

export async function recordTransaction(
	cmd: RecordTransactionCommand,
): Promise<RecordTransactionResult> {
	const account = await bankingRepository.findAccountById(cmd.accountId);

	if (!account) {
		throw new Error(`Account not found: ${cmd.accountId}`);
	}

	if (account.companyId !== cmd.companyId) {
		throw new Error("Account does not belong to this company");
	}

	const currency = toCurrency(account.currency);
	const currentBalance = Money.fromAmount(
		Number(account.currentBalance),
		currency,
	);
	const delta = Money.fromAmount(cmd.amount, currency);

	if (cmd.type === "DEBIT" && delta.greaterThan(currentBalance)) {
		throw new Error("Insufficient balance for this debit transaction");
	}

	const newBalance =
		cmd.type === "CREDIT"
			? currentBalance.add(delta)
			: currentBalance.subtract(delta);

	const newBalanceStr = newBalance.getAmount().toFixed(2);

	const transaction = await bankingRepository.createTransaction({
		companyId: cmd.companyId,
		accountId: cmd.accountId,
		transactionDate: formatDateLocal(cmd.transactionDate),
		description: cmd.description,
		reference: cmd.reference ?? null,
		type: cmd.type,
		amount: cmd.amount.toString(),
		balance: newBalanceStr,
		category: cmd.category ?? null,
		tags: cmd.tags ? JSON.stringify(cmd.tags) : null,
		isReconciled: false,
		reconciledAt: null,
		reconciledBy: null,
		invoiceId: null,
		billId: null,
		importedFrom: cmd.importedFrom ?? "MANUAL",
	});

	await bankingRepository.updateAccount(cmd.accountId, {
		currentBalance: newBalanceStr,
	});

	logger.info("Transaction recorded", {
		transactionId: transaction.id,
		type: cmd.type,
		amount: cmd.amount,
	});

	return { transactionId: transaction.id, newBalance: newBalanceStr };
}

function formatDateLocal(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function toCurrency(value: string | null | undefined): Currency {
	return value === "USD" ? "USD" : "PEN";
}
