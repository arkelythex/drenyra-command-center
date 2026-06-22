import { describe, expect, it } from "vitest";
import {
	DocumentSeriesValidator,
	MoneyIgvConsistencyValidator,
	RetentionDetractionValidator,
	RucDeterministicValidator,
	SireReproducibilityValidator,
	Ubl21Validator,
} from "./index";
import { createFiscalTruthDeterministicOrchestrator } from "./orchestrator.factory";

describe("Fiscal-truth deterministic validators", () => {
	it("validates RUC with stable reason codes", async () => {
		const validator = new RucDeterministicValidator();

		const valid = await validator.validate({ ruc: "20100070970" });
		expect(valid.isValid).toBe(true);
		expect(valid.code).toBe("RUC_VALID");

		const invalid = await validator.validate({ ruc: "20100070971" });
		expect(invalid.isValid).toBe(false);
		expect(invalid.code).toBe("RUC_INVALID");
	});

	it("validates Money/IGV deterministic consistency", async () => {
		const validator = new MoneyIgvConsistencyValidator();

		const valid = await validator.validate({
			subtotalAmount: 100,
			igvAmount: 18,
			totalAmount: 118,
			currency: "PEN",
		});
		expect(valid.isValid).toBe(true);
		expect(valid.code).toBe("MONEY_IGV_OK");

		const invalid = await validator.validate({
			subtotalAmount: 100,
			igvAmount: 17,
			totalAmount: 117,
			currency: "PEN",
		});
		expect(invalid.isValid).toBe(false);
		expect(invalid.code).toBe("MONEY_IGV_MISMATCH");
	});

	it("validates SUNAT document series by document type", async () => {
		const validator = new DocumentSeriesValidator();

		expect(
			(await validator.validate({ documentType: "01", series: "F001" }))
				.isValid,
		).toBe(true);
		expect(
			(await validator.validate({ documentType: "03", series: "F001" }))
				.isValid,
		).toBe(false);
	});

	it("validates UBL 2.1 deterministic required fields", async () => {
		const validator = new Ubl21Validator();

		expect(
			(
				await validator.validate({
					ublInvoice: {
						ublVersion: "2.1",
						invoiceId: "F001-1",
						issueDate: "2026-05-04",
						supplierRuc: "20100070970",
						totalAmount: 118,
					},
				})
			).isValid,
		).toBe(true);

		expect(
			(
				await validator.validate({
					ublInvoice: {
						ublVersion: "2.0",
						supplierRuc: "20100070971",
					},
				})
			).isValid,
		).toBe(false);
	});

	it("validates SIRE reproducibility with digest parity", async () => {
		const validator = new SireReproducibilityValidator();

		expect(
			(
				await validator.validate({
					sire: { expectedDigest: "abc", actualDigest: "abc" },
				})
			).code,
		).toBe("SIRE_REPRO_OK");

		expect(
			(
				await validator.validate({
					sire: { expectedDigest: "abc", actualDigest: "xyz" },
				})
			).code,
		).toBe("SIRE_REPRO_MISMATCH");
	});

	it("validates retención and detracción deterministic rates", async () => {
		const validator = new RetentionDetractionValidator();

		expect(
			(
				await validator.validate({
					retentionDetraction: {
						baseAmount: 1000,
						retentionAmount: 30,
						detractionAmount: 100,
					},
				})
			).isValid,
		).toBe(true);

		expect(
			(
				await validator.validate({
					retentionDetraction: {
						baseAmount: 1000,
						retentionAmount: 31,
						detractionAmount: 99,
					},
				})
			).isValid,
		).toBe(false);
	});

	it("registers all validators behind application orchestrator", async () => {
		const orchestrator = createFiscalTruthDeterministicOrchestrator();
		const result = await orchestrator.execute({
			validatorPayload: {
				ruc: "20100070970",
				subtotalAmount: 100,
				igvAmount: 18,
				totalAmount: 118,
				documentType: "01",
				series: "F001",
				ublInvoice: {
					ublVersion: "2.1",
					invoiceId: "F001-1",
					issueDate: "2026-05-04",
					supplierRuc: "20100070970",
					totalAmount: 118,
				},
				sire: { expectedDigest: "ok", actualDigest: "ok" },
				retentionDetraction: {
					baseAmount: 1000,
					retentionAmount: 30,
					detractionAmount: 100,
				},
			},
		});

		expect(result.results).toHaveLength(6);
		expect(result.policyOutcome).toBe("promotable");
	});
});
