import { beforeEach, describe, expect, it, vi } from "vitest";
import { CdrProcessorService } from "../../application/services/cdr-processor.service";
import type { CdrWebhookPayload } from "../../domain/cpe.types";

const cpeRepositoryMock = vi.hoisted(() => ({
	findTransactionWithTags: vi.fn(),
}));

vi.mock("../../infrastructure/cpe.repository", () => ({
	CpeRepository: {
		findTransactionWithTags: cpeRepositoryMock.findTransactionWithTags,
	},
}));

describe("CdrProcessorService", () => {
	describe("mapCdrStatus", () => {
		it("maps ACEPTADO to ACCEPTED", () => {
			expect(CdrProcessorService.mapCdrStatus("ACEPTADO")).toBe("ACCEPTED");
		});

		it("maps RECHAZADO to REJECTED", () => {
			expect(CdrProcessorService.mapCdrStatus("RECHAZADO")).toBe("REJECTED");
		});

		it("maps OBSERVADO to OBSERVED", () => {
			expect(CdrProcessorService.mapCdrStatus("OBSERVADO")).toBe("OBSERVED");
		});

		it("defaults to OBSERVED for unknown status", () => {
			expect(
				CdrProcessorService.mapCdrStatus(
					null as unknown as CdrWebhookPayload["cdrStatus"],
				),
			).toBe("OBSERVED");
		});
	});

	describe("processResponse", () => {
		const appendEvent = vi.fn().mockResolvedValue(undefined);
		const updateStatus = vi.fn().mockResolvedValue(undefined);

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("returns ACCEPTED when OSE result is success with ACEPTADO status", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-001",
				{
					success: true,
					cdrStatus: "ACEPTADO",
					cdrContent: "<cdr>accepted</cdr>",
					sunatCode: "0",
					sunatDescription: "Comprobante aceptado",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.success).toBe(true);
			expect(result.status).toBe("ACCEPTED");
			expect(result.sunatCode).toBe("0");
			expect(result.sunatMessage).toBe("Comprobante aceptado");
			expect(result.runbook).toBeUndefined();
		});

		it("returns REJECTED when OSE result is success with RECHAZADO status", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-002",
				{
					success: true,
					cdrStatus: "RECHAZADO",
					sunatCode: "4016",
					sunatDescription: "RUC no existe",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.success).toBe(true);
			expect(result.status).toBe("REJECTED");
		});

		it("returns OBSERVED when OSE result is success with OBSERVADO status", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-003",
				{
					success: true,
					cdrStatus: "OBSERVADO",
					cdrMessage: "Monto inconsistente",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.success).toBe(true);
			expect(result.status).toBe("OBSERVED");
		});

		it("returns ANNULLED with runbook when OSE result is failure", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-004",
				{
					success: false,
					error: "Timeout connecting to OSE",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.success).toBe(false);
			expect(result.status).toBe("ANNULLED");
			expect(result.runbook).toBeDefined();
			expect(result.runbook?.id).toContain("RB-CPE");
		});

		it("appends lifecycle event for successful response", async () => {
			await CdrProcessorService.processResponse(
				"tx-005",
				{
					success: true,
					cdrStatus: "ACEPTADO",
					sunatCode: "0",
					cdrMessage: "OK",
				},
				appendEvent,
				updateStatus,
			);

			expect(appendEvent).toHaveBeenCalledWith(
				"tx-005",
				expect.objectContaining({
					stage: "OSE_RESPONSE",
					status: "ACCEPTED",
					source: "SUNAT",
				}),
			);
		});

		it("appends lifecycle event with runbook for error response", async () => {
			await CdrProcessorService.processResponse(
				"tx-006",
				{
					success: false,
					error: "Connection refused",
				},
				appendEvent,
				updateStatus,
			);

			expect(appendEvent).toHaveBeenCalledWith(
				"tx-006",
				expect.objectContaining({
					stage: "OSE_RESPONSE",
					status: "ERROR",
					source: "SUNAT",
				}),
			);
		});

		it("updates transaction status after processing", async () => {
			await CdrProcessorService.processResponse(
				"tx-007",
				{
					success: true,
					cdrStatus: "ACEPTADO",
					cdrContent: "<cdr>data</cdr>",
					sunatCode: "0",
					sunatDescription: "OK",
				},
				appendEvent,
				updateStatus,
			);

			expect(updateStatus).toHaveBeenCalledWith(
				"tx-007",
				"ACCEPTED",
				expect.objectContaining({
					cdrContent: "<cdr>data</cdr>",
					sunatCode: "0",
					sunatMessage: "OK",
				}),
			);
		});

		it("defaults sunatMessage to cdrMessage when sunatDescription is absent", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-008",
				{
					success: true,
					cdrStatus: "OBSERVADO",
					cdrMessage: "Fallback message",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.sunatMessage).toBe("Fallback message");
		});

		it("defaults to SUBMITTED when cdrStatus is unrecognized", async () => {
			const result = await CdrProcessorService.processResponse(
				"tx-009",
				{
					success: true,
					cdrStatus: "PENDING" as unknown as
						| "ACEPTADO"
						| "RECHAZADO"
						| "OBSERVADO",
				},
				appendEvent,
				updateStatus,
			);

			expect(result.status).toBe("SUBMITTED");
		});
	});

	describe("isAlreadyProcessed", () => {
		it("returns false when transaction not found", async () => {
			cpeRepositoryMock.findTransactionWithTags.mockResolvedValueOnce(null);

			const result =
				await CdrProcessorService.isAlreadyProcessed("tx-nonexistent");
			expect(result).toBe(false);
			expect(cpeRepositoryMock.findTransactionWithTags).toHaveBeenCalledWith(
				"tx-nonexistent",
			);
		});
	});
});
