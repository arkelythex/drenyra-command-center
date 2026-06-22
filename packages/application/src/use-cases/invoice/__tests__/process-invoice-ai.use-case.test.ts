import { describe, expect, it, vi } from "vitest";
import type { IOcrService, OcrResult } from "../../../ports/IOcrService";
import type {
	AdvisoryValidationResult,
	DeterministicValidationResult,
	IValidationService,
} from "../../../ports/IValidationService";
import { ProcessInvoiceAiUseCase } from "../process-invoice-ai.use-case";

describe("ProcessInvoiceAiUseCase", () => {
	it("keeps OCR data authoritative and returns AI corrections as advisory evidence", async () => {
		const ocrResult: OcrResult = {
			success: true,
			data: {
				series: "F001",
				number: 1,
				totalAmount: 118,
				clientRUC: "20100070970",
			},
			cost: 1,
		};

		const ocrService: IOcrService = {
			extract: vi.fn().mockResolvedValue(ocrResult),
		};

		const advisory: AdvisoryValidationResult = {
			success: true,
			isValid: true,
			corrections: [
				{
					field: "totalAmount",
					originalValue: 118,
					correctedValue: 119,
					confidence: "high",
					reason: "AI suggestion",
				},
			],
			cost: 2,
		};

		const deterministic: DeterministicValidationResult = {
			success: true,
			validatorVersion: "1.0.0",
			reasonCode: "VALIDATION_OK",
			message: "deterministic checks passed",
		};

		const validationService: IValidationService = {
			validateAdvisory: vi.fn().mockResolvedValue(advisory),
			validateDeterministic: vi.fn().mockResolvedValue(deterministic),
		};

		const useCase = new ProcessInvoiceAiUseCase(ocrService, validationService);
		const result = await useCase.execute({
			imageUrl: "https://example.test/i.png",
		});

		expect(result.success).toBe(true);
		expect(result.data.totalAmount).toBe(118);
		expect(result.appliedCorrections).toHaveLength(0);
		expect(result.advisoryEvidence.suggestedCorrections).toHaveLength(1);
		expect(result.deterministicValidation.reasonCode).toBe("VALIDATION_OK");
	});
});
