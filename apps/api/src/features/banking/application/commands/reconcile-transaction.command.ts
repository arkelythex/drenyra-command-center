import type { Currency } from "@arkelythex/domain/value-objects/Money";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
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
			reference: record.reference ?? undefined,
			type: record.type as "DEBIT" | "CREDIT",
			amount: record.amount,
			balance: record.balance ?? undefined,
			isReconciled: record.isReconciled ?? false,
			reconciledAt: record.reconciledAt ?? undefined,
			reconciledBy: record.reconciledBy ?? undefined,
			invoiceId: record.invoiceId ?? undefined,
			billId: record.billId ?? undefined,
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
