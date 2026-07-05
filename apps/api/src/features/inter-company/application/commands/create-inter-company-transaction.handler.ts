/**
 * Create Inter-Company Transaction — Command Handler
 *
 * Orchestrates the full creation flow:
 *   1. Validate companies belong to same Economic Group (repository)
 *   2. Calculate IGV + SPOT detraction (business logic — taxation feature)
 *   3. Persist atomically: EXPENSE tx + INCOME tx + inter-company link (repository)
 */

import { SecureLogger } from "@drenyra/shared/secure-logger";
import { taxRateProviderService } from "../../../taxation/application/services/tax-rate-provider.service";
import type { SpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import { normalizeSpotDetractionProfile } from "../../../taxation/domain/spot-detraction-profile";
import type {
	CreateInterCompanyTransactionInput,
	CreateInterCompanyTransactionResult,
	TaxCalculations,
} from "../../domain/inter-company-transaction.entity";
import type { IInterCompanyTransactionRepository } from "../../domain/inter-company-transaction.repository";

const logger = SecureLogger.namespace("CreateInterCompanyTransactionHandler");

/**
 * CreateInterCompanyTransactionHandler class.
 *
 * @example
 * ```ts
 * const value = new CreateInterCompanyTransactionHandler();
 * console.log(value);
 * ```
 */
export class CreateInterCompanyTransactionHandler {
	constructor(
		private readonly repository: IInterCompanyTransactionRepository,
	) {}

	async execute(
		input: CreateInterCompanyTransactionInput,
	): Promise<CreateInterCompanyTransactionResult> {
		logger.info("Creating inter-company transaction", { amount: input.amount });

		await this.repository.validateSameGroup(
			input.fromCompanyId,
			input.toCompanyId,
			input.economicGroupId,
		);

		const detractionProfile = normalizeSpotDetractionProfile(
			input.detractionProfile,
		);
		const calculations = await this.calculateTaxes(
			input.amount,
			input.taxType,
			detractionProfile,
			new Date(),
		);

		const result = await this.repository.createAtomic({
			economicGroupId: input.economicGroupId,
			fromCompanyId: input.fromCompanyId,
			toCompanyId: input.toCompanyId,
			concept: input.concept,
			amount: input.amount,
			taxType: input.taxType,
			calculations,
			detractionProfile,
		});

		logger.info("Inter-company transaction completed", {
			id: result.interCompany.id,
		});
		return result;
	}

	private async calculateTaxes(
		amount: number,
		taxType: string,
		detractionProfile: SpotDetractionProfile,
		atDate: Date,
	): Promise<TaxCalculations> {
		if (taxType !== "GRAVADO") {
			return {
				subtotal: amount,
				igv: 0,
				total: amount,
				hasDetraction: false,
				detraction: null,
				detractionRate: null,
				detractionProfile: null,
				detractionRuleCode: null,
			};
		}

		const vatRate = await taxRateProviderService.getVatRate(atDate);
		const igv = amount * vatRate;

		const config = await taxRateProviderService.getSpotDetractionConfig(
			atDate,
			detractionProfile,
		);
		const operationCents = Math.round(amount * 100);
		const hasDetraction =
			config.thresholdCents <= 0 || operationCents > config.thresholdCents;

		return {
			subtotal: amount,
			igv,
			total: amount + igv,
			hasDetraction,
			detraction: hasDetraction ? (amount + igv) * config.rate : null,
			detractionRate: hasDetraction
				? Number((config.rate * 100).toFixed(4))
				: null,
			detractionProfile: config.profile,
			detractionRuleCode: config.ruleCode,
		};
	}
}
