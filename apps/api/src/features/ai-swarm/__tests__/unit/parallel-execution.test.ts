/**
 * Parallel Execution Tests
 *
 * Verifies that the complete workflow runs independent agents in parallel
 * (SUNAT + PCGE + Evidence) after OCR extraction has completed.
 *
 * @module ai-swarm/__tests__/unit
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
	EvidenceAgent,
	type EvidenceMetadata,
} from "../../agents/evidence.agent";
import { OCRAgent } from "../../agents/ocr.agent";
import { PCGEAgent } from "../../agents/pcge.agent";
import { SUNATAgent } from "../../agents/sunat.agent";
import type {
	AgentResult,
	InvoiceData,
	PCGEClassification,
	ValidationResult,
} from "../../config/types";
import { CompleteInvoiceProcessingWorkflow } from "../../workflows/complete-invoice-processing.workflow";

describe("Parallel Agent Execution", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	it("should run SUNAT + PCGE + Evidence in parallel after OCR", async () => {
		const invoiceData: InvoiceData = {
			id: "INV-PARALLEL-001",
			ruc: "20100070970",
			serie: "F001",
			numero: "00000001",
			fecha: "2026-02-04",
			moneda: "PEN",
			subtotal: 1000,
			igv: 180,
			total: 1180,
			items: [
				{
					descripcion: "Laptop HP",
					cantidad: 2,
					precioUnitario: 500,
					subtotal: 1000,
				},
			],
		};

		const ocrDelayMs = 30;
		const parallelDelayMs = 140;

		const ocrSpy = vi
			.spyOn(OCRAgent.prototype, "extractInvoice")
			.mockImplementation(async () => {
				await sleep(ocrDelayMs);
				const result: AgentResult<InvoiceData> = {
					success: true,
					data: invoiceData,
					metadata: {
						agentType: "ocr",
						modelUsed: "mock",
						tokensUsed: 0,
						costUsd: 0,
						durationMs: ocrDelayMs,
						timestamp: new Date(),
					},
				};
				return result;
			});

		const sunatSpy = vi
			.spyOn(SUNATAgent.prototype, "validateInvoice")
			.mockImplementation(async () => {
				await sleep(parallelDelayMs);
				const data: ValidationResult = {
					isValid: true,
					errors: [],
					warnings: [],
					confidence: 1,
				};
				const result: AgentResult<ValidationResult> = {
					success: true,
					data,
					metadata: {
						agentType: "sunat",
						modelUsed: "mock",
						tokensUsed: 0,
						costUsd: 0,
						durationMs: parallelDelayMs,
						timestamp: new Date(),
					},
				};
				return result;
			});

		const pcgeSpy = vi
			.spyOn(PCGEAgent.prototype, "classifyInvoice")
			.mockImplementation(async () => {
				await sleep(parallelDelayMs);
				const data: PCGEClassification[] = [];
				const result: AgentResult<PCGEClassification[]> = {
					success: true,
					data,
					metadata: {
						agentType: "pcge",
						modelUsed: "mock",
						tokensUsed: 0,
						costUsd: 0,
						durationMs: parallelDelayMs,
						timestamp: new Date(),
					},
				};
				return result;
			});

		const evidenceSpy = vi
			.spyOn(EvidenceAgent.prototype, "storeEvidence")
			.mockImplementation(async () => {
				await sleep(parallelDelayMs);
				const evidence: EvidenceMetadata = {
					id: "EVID-001",
					invoiceId: "DOC-001",
					documentType: "invoice",
					originalFilename: "invoice.pdf",
					mimeType: "application/pdf",
					sizeBytes: 1,
					storedAt: new Date(),
					storageUrl: "storage://evidence/EVID-001",
				};

				const result: AgentResult<EvidenceMetadata> = {
					success: true,
					data: evidence,
					metadata: {
						agentType: "evidence",
						modelUsed: "none",
						tokensUsed: 0,
						costUsd: 0,
						durationMs: parallelDelayMs,
						timestamp: new Date(),
					},
				};
				return result;
			});

		const startTime = Date.now();

		const workflow = new CompleteInvoiceProcessingWorkflow();
		const result = await workflow.execute({
			documents: [
				{
					id: "DOC-001",
					imageUrl: "data:image/png;base64,AA==",
					filename: "invoice.pdf",
					mimeType: "application/pdf",
					file: Buffer.from([1]),
				},
			],
			priority: "high",
		});

		const totalDuration = Date.now() - startTime;

		expect(ocrSpy).toHaveBeenCalledTimes(1);
		expect(sunatSpy).toHaveBeenCalledTimes(1);
		expect(pcgeSpy).toHaveBeenCalledTimes(1);
		expect(evidenceSpy).toHaveBeenCalledTimes(1);

		expect(result.totalProcessed).toBe(1);

		// If SUNAT + PCGE + Evidence ran sequentially, we'd see ~ocrDelay + 3*parallelDelay.
		// In parallel, we expect ~ocrDelay + parallelDelay (+ overhead).
		const sequentialEstimateMs = ocrDelayMs + parallelDelayMs * 3;
		const expectedUpperBoundMs = ocrDelayMs + parallelDelayMs + 200;

		expect(totalDuration).toBeLessThan(sequentialEstimateMs);
		expect(totalDuration).toBeLessThanOrEqual(expectedUpperBoundMs);
	});
});
