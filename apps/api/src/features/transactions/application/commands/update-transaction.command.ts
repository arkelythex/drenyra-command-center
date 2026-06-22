/**
 * Update Transaction — Command
 *
 * Handles partial updates with optional IGV recalculation.
 * If totalAmount or hasDetraction changes, tax is recalculated using taxation feature.
 */

import { taxRateProviderService } from "../../../taxation/application/services/tax-rate-provider.service";
import type { SpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import { normalizeSpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import type {
	TransactionRow,
	UpdateTransactionInput,
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

function extractProfileFromTags(tags: unknown): SpotDetractionProfile {
	if (!tags || typeof tags !== "object") return "SERVICES";
	const value = (tags as Record<string, unknown>).detractionProfile;
	return normalizeSpotDetractionProfile(
		typeof value === "string" ? value : undefined,
	);
}

export async function updateTransaction(
	id: string,
	input: UpdateTransactionInput,
	companyId: string,
): Promise<TransactionRow> {
	const updates: Record<string, unknown> = {};
	const existing = await transactionRepository.findById(id, companyId);
	if (!existing) throw new Error("Transaction not found");

	if (input.type !== undefined) updates.type = input.type;
	if (input.partnerId !== undefined) updates.partnerId = input.partnerId;
	if (input.totalAmount !== undefined) updates.totalAmount = input.totalAmount;
	if (input.currency !== undefined) updates.currency = input.currency;
	if (input.hasDetraction !== undefined)
		updates.isDetraction = input.hasDetraction;

	const needsTaxRecalc =
		input.totalAmount !== undefined ||
		input.hasDetraction !== undefined ||
		input.detractionProfile !== undefined;

	if (needsTaxRecalc) {
		if (input.detractionProfile !== undefined) {
			const profile = normalizeSpotDetractionProfile(input.detractionProfile);
			const existingTags =
				existing.tags && typeof existing.tags === "object"
					? (existing.tags as Record<string, unknown>)
					: {};
			updates.tags = { ...existingTags, detractionProfile: profile };
		}

		const effectiveProfile = normalizeSpotDetractionProfile(
			input.detractionProfile ?? extractProfileFromTags(existing.tags),
		);
		const effectiveDetraction =
			input.hasDetraction !== undefined
				? input.hasDetraction
				: (existing.isDetraction ?? false);
		const effectiveAmount = input.totalAmount
			? parseFloat(input.totalAmount)
			: parseFloat(existing.totalAmount);

		const newIgv = await calculateTax(
			effectiveAmount,
			effectiveDetraction,
			existing.issueDate ?? new Date(),
			effectiveProfile,
		);
		updates.igvAmount = newIgv.toFixed(2);
	}

	const updated = await transactionRepository.update(id, updates, companyId);
	if (!updated) throw new Error("Transaction not found");

	return updated;
}
