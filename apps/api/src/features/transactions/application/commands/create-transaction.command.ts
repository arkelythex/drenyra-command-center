/**
 * Create Transaction — Command
 *
 * Orchestrates:
 *   1. Calculate IGV or detraction (business logic — taxation feature)
 *   2. Generate document number
 *   3. Persist via repository
 */

import { taxRateProviderService } from "../../../taxation/application/services/tax-rate-provider.service";
import type { SpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import { normalizeSpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import type {
	CreateTransactionInput,
	TransactionRow,
} from "../../domain/transaction.entity";
import { transactionRepository } from "../../infrastructure/transaction.repository";

async function calculateTax(
	totalAmount: number,
	hasDetraction: boolean,
	atDate: Date,
	detractionProfile: SpotDetractionProfile,
): Promise<number> {
	if (hasDetraction) {
		const rate = await taxRateProviderService.getSpotDetractionRate(
			atDate,
			detractionProfile,
		);
		return totalAmount * rate;
	}
	const rate = await taxRateProviderService.getVatRate(atDate);
	return totalAmount * rate;
}

function generateDocumentNumber(type: "INCOME" | "EXPENSE"): string {
	const prefix = type === "INCOME" ? "F" : "B";
	return `${prefix}001-${Date.now()}`;
}

export async function createTransaction(
	input: CreateTransactionInput,
): Promise<TransactionRow> {
	const issueDate = new Date();
	const detractionProfile = normalizeSpotDetractionProfile(
		input.detractionProfile,
	);
	const igvAmount = await calculateTax(
		parseFloat(input.totalAmount),
		input.hasDetraction,
		issueDate,
		detractionProfile,
	);

	return transactionRepository.insertOne({
		companyId: input.companyId,
		type: input.type,
		partnerId: input.partnerId,
		totalAmount: input.totalAmount,
		igvAmount: igvAmount.toFixed(2),
		number: generateDocumentNumber(input.type),
		documentType: "FACTURA",
		issueDate,
		currency: input.currency,
		isDetraction: input.hasDetraction,
		tags: input.hasDetraction ? { detractionProfile } : null,
	});
}
