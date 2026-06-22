import type { ProcessInvoiceAiDTO } from "../../dtos/invoice/process-invoice-ai.dto";
import type { IOcrService } from "../../ports/IOcrService";
import type { IValidationService } from "../../ports/IValidationService";
import { AIExtractionError, ValidationError } from "@arkelythex/shared/errors";

/**
 * ProcessInvoiceAiUseCase class.
 *
 * @example
 * ```ts
 * const value = new ProcessInvoiceAiUseCase();
 * console.log(value);
 * ```
 */
export class ProcessInvoiceAiUseCase {
	constructor(
		private ocrService: IOcrService,
		private validationService: IValidationService,
	) {}

	async execute(dto: ProcessInvoiceAiDTO) {
		const ocrResult = await this.ocrService.extract(dto);

		if (!ocrResult.success || !ocrResult.data) {
			throw new AIExtractionError(ocrResult.error || "OCR extraction failed");
		}

		const validationResult = await this.validationService.validateAdvisory(
			ocrResult.data,
		);

		const deterministicValidation =
			await this.validationService.validateDeterministic(ocrResult.data);

		if (!validationResult.success) {
			throw new ValidationError("AI validation failed");
		}

		const pendingCorrections = validationResult.corrections;

		const totalCost = (ocrResult.cost || 0) + (validationResult.cost || 0);

		return {
			success: true,
			data: { ...ocrResult.data },
			appliedCorrections: [],
			pendingCorrections,
			advisoryEvidence: {
				suggestedCorrections: validationResult.corrections,
				isValidSuggestion: validationResult.isValid,
			},
			deterministicValidation,
			stats: {
				totalCost,
				ocrCost: ocrResult.cost,
				validationCost: validationResult.cost,
			},
		};
	}
}
