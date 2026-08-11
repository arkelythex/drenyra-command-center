import type { Currency } from "@drenyra/domain/value-objects/Money";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import { BankTransaction } from "../../../banking/domain/entities/bank-transaction.entity";
import { bankingRepository } from "../../infrastructure/banking.repository";

export interface ReconcileTransactionCommand {
	transactionId: string;
	userId: string;
	documentId?: string;
	documentType?: "INVOICE" | "BILL";
}

const logger = SecureLogger.namespace("reconcileTransaction");

export async function reconcileTransaction(
	cmd: ReconcileTransactionCommand,
): Promise<void> {
	const record = await bankingRepository.findTransactionById(cmd.transactionId);

	if (!record) {
		throw new Error(`Transaction not found: ${cmd.transactionId}`);
	}

	const currency: Currency = "PEN";

	const tx = BankTransaction.create(
		{
			id: record.id,
			companyId: record.companyId,
			accountId: record.accountId,
			transactionDate: new Date(record.transactionDate),
			description: record.description,
			...(record.reference != null ? { reference: record.reference } : {}),
			type: record.type as "DEBIT" | "CREDIT",
			amount: record.amount,
			...(record.balance != null ? { balance: record.balance } : {}),
			isReconciled: record.isReconciled ?? false,
			...(record.reconciledAt != null ? { reconciledAt: record.reconciledAt } : {}),
			...(record.reconciledBy != null ? { reconciledBy: record.reconciledBy } : {}),
			...(record.invoiceId != null ? { invoiceId: record.invoiceId } : {}),
			...(record.billId != null ? { billId: record.billId } : {}),
			importedFrom: (record.importedFrom ?? "MANUAL") as
				| "MANUAL"
				| "CSV"
				| "BANK_API"
				| "MT940",
			createdAt: record.createdAt ?? new Date(),
		},
		currency,
	);

	tx.reconcile(cmd.userId);

	await bankingRepository.reconcileTransaction(
		cmd.transactionId,
		cmd.userId,
		cmd.documentId,
		cmd.documentType,
	);

	logger.info("Transaction reconciled", {
		transactionId: cmd.transactionId,
		documentType: cmd.documentType,
		documentId: cmd.documentId,
	});
}
