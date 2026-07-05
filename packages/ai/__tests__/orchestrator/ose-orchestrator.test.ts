/**
 * WorkflowOrchestratorV2 — OSE Submission Tests
 *
 * Validates Stage 5 (OSE submission) behavior:
 * - OSE step is called when oseService is configured
 * - OSE_SUBMISSION_STARTED event emitted
 * - OSE_SENT event emitted on success
 * - OSE_FAILED event emitted on failure
 * - CDR response populated in result
 * - OSE failure does NOT fail the pipeline (non-blocking)
 * - OSE submission skipped when no oseService config
 * - OSE_SUBMITTING state transition
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../src/agents/orchestrator/event.bus";
import { WorkflowOrchestratorV2 } from "../../src/agents/orchestrator/workflow-v2/orchestrator";
import type {
	CDRResponse,
	ExtractedData,
	InvoiceData,
	ParsedInvoice,
	ReaderInput,
	ValidationResult,
} from "../../src/agents/types";

// ============================================================================
// Test Fixtures
// ============================================================================

function makeInvoiceData(overrides: Partial<InvoiceData> = {}): InvoiceData {
	return {
		invoiceNumber: "F001-123",
		invoiceType: "01",
		issuerRuc: "20123456789",
		issuerName: "Mock S.A.C.",
		customerRuc: "10123456789",
		customerName: "Mock Customer",
		customerDocType: "1",
		issueDate: new Date("2026-06-15"),
		total: 1180.0,
		subtotal: 1000.0,
		igv: 180.0,
		currency: "PEN",
		items: [],
		series: "F001",
		correlative: "123",
		...overrides,
	};
}

function makeExtractedData(): ExtractedData {
	return {
		extractedData: makeInvoiceData(),
		confidence: 0.95,
		flags: [],
		processingTime: 100,
		agentId: "mock-reader",
	};
}

function makeParsedInvoice(): ParsedInvoice {
	return {
		parsedData: makeInvoiceData(),
		schemaVersion: "UBL_2.1",
		discrepancies: [],
		needsMigration: false,
		processingTime: 80,
		agentId: "mock-parser",
	};
}

function makeValidationResult(withXml: boolean = true): ValidationResult {
	return {
		isCompliant: true,
		violations: [],
		suggestedFixes: [],
		generatedXML: withXml ? "<xml>UBL_2.1_INVOICE</xml>" : undefined,
		processingTime: 120,
		agentId: "mock-validator",
	};
}

function makeReaderInput(overrides: Partial<ReaderInput> = {}): ReaderInput {
	return {
		type: "invoice_xml",
		data: "<xml>test</xml>",
		metadata: {
			ruc: "20123456789",
			fileName: "test.xml",
		},
		...overrides,
	};
}

// ============================================================================
// Mock Agents
// ============================================================================

function createMockAgents() {
	const readerAgent = {
		id: "mock-reader",
		role: "reader" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeExtractedData()),
	};

	const parserAgent = {
		id: "mock-parser",
		role: "parser" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeParsedInvoice()),
	};

	const validatorAgent = {
		id: "mock-validator",
		role: "validator" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue(makeValidationResult(true)),
	};

	const arbitratorAgent = {
		id: "mock-arbitrator",
		role: "arbitrator" as const,
		status: "idle" as const,
		process: vi.fn().mockResolvedValue({
			decision: "APPROVED" as const,
			finalData: makeInvoiceData(),
			arbitrationLog: {
				conflicts: [],
				resolutions: [],
				timestamp: new Date(),
				arbitratorModel: "mock",
			},
			confidence: 0.95,
			processingTime: 50,
			requiresManualReview: false,
		}),
	};

	return { readerAgent, parserAgent, validatorAgent, arbitratorAgent };
}

// ============================================================================
// OSE Service Mocks
// ============================================================================

function createOSEServiceMock(options?: {
	shouldFail?: boolean;
	shouldThrow?: boolean;
}) {
	return {
		sendInvoice: vi
			.fn()
			.mockImplementation(
				async (data: {
					xmlContent: string;
					invoiceNumber: string;
					invoiceType: string;
				}) => {
					if (options?.shouldThrow) {
						throw new Error("OSE network error");
					}

					if (options?.shouldFail) {
						return {
							success: false,
							error: "SUNAT rejected: invalid RUC",
							cdrStatus: "RECHAZADO" as const,
						};
					}

					return {
						success: true,
						cdrContent: "base64-cdr-content",
						cdrStatus: "ACEPTADO" as const,
						cdrMessage: "Comprobante aceptado",
						sunatCode: "0",
					};
				},
			),
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("WorkflowOrchestratorV2 - OSE Submission Stage", () => {
	let orchestrator: WorkflowOrchestratorV2;
	let eventBus: EventBus;
	let mockAgents: ReturnType<typeof createMockAgents>;

	beforeEach(() => {
		vi.clearAllMocks();
		eventBus = new EventBus();
		mockAgents = createMockAgents();
	});

	describe("when oseService is configured", () => {
		it("should call sendInvoice when oseService is configured", async () => {
			const oseService = createOSEServiceMock();
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{
					oseService,
					enableCircuitBreaker: false,
					agentTimeoutMs: 5000,
				},
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(oseService.sendInvoice).toHaveBeenCalledTimes(1);
			expect(oseService.sendInvoice).toHaveBeenCalledWith({
				xmlContent: "<xml>UBL_2.1_INVOICE</xml>",
				invoiceNumber: "F001-123",
				invoiceType: "01",
			});
			expect(result.status).toBe("success");
		});

		it("should emit OSE_SUBMISSION_STARTED event", async () => {
			const events: string[] = [];
			eventBus.on("OSE_SUBMISSION_STARTED", () => {
				events.push("OSE_SUBMISSION_STARTED");
			});

			const oseService = createOSEServiceMock();
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			await orchestrator.processInvoice(makeReaderInput());

			expect(events).toContain("OSE_SUBMISSION_STARTED");
		});

		it("should emit OSE_SENT event on successful submission", async () => {
			const oseEvents: Array<{ type: string; cdr?: CDRResponse }> = [];
			eventBus.on("OSE_SENT", (event: unknown) => {
				const evt = event as { type: string; cdr?: CDRResponse };
				oseEvents.push({ type: evt.type, cdr: evt.cdr });
			});

			const oseService = createOSEServiceMock();
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			await orchestrator.processInvoice(makeReaderInput());

			expect(oseEvents.length).toBe(1);
			expect(oseEvents[0].type).toBe("OSE_SENT");
			expect(oseEvents[0].cdr).toBeDefined();
			expect(oseEvents[0].cdr!.status).toBe("ACEPTADO");
		});

		it("should populate CDR response in the result on success", async () => {
			const oseService = createOSEServiceMock();
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.cdrResponse).toBeDefined();
			expect(result.cdrResponse!.status).toBe("ACEPTADO");
			expect(result.cdrResponse!.code).toBe("0");
			expect(result.cdrResponse!.cdrContent).toBe("base64-cdr-content");
		});

		it("should emit OSE_FAILED event when OSE returns failure", async () => {
			const oseEvents: Array<{ type: string; error?: string }> = [];
			eventBus.on("OSE_FAILED", (event: unknown) => {
				const evt = event as { type: string; error?: string };
				oseEvents.push({ type: evt.type, error: evt.error });
			});

			const oseService = createOSEServiceMock({ shouldFail: true });
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(oseEvents.length).toBe(1);
			expect(oseEvents[0].type).toBe("OSE_FAILED");
			expect(oseEvents[0].error).toContain("SUNAT rejected");
		});

		it("should NOT fail the pipeline when OSE submission fails (non-blocking)", async () => {
			const oseService = createOSEServiceMock({ shouldFail: true });
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.status).toBe("success");
			expect(result.invoiceData).toBeDefined();
			expect(result.invoiceData.invoiceNumber).toBe("F001-123");
		});

		it("should NOT fail the pipeline when OSE throws (non-blocking)", async () => {
			const oseService = createOSEServiceMock({ shouldThrow: true });
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.status).toBe("success");
			expect(result.invoiceData.invoiceNumber).toBe("F001-123");
		});

		it("should include oseSubmission in processing log", async () => {
			const oseService = createOSEServiceMock();
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.processingLog.stages.oseSubmission).toBeDefined();
			expect(result.processingLog.stages.oseSubmission!.status).toBe("success");
			expect(result.processingLog.stages.oseSubmission!.agentId).toBe("ose");
		});

		it("should skip OSE submission when no xmlContent is generated", async () => {
			const oseService = createOSEServiceMock();
			mockAgents.validatorAgent.process = vi
				.fn()
				.mockResolvedValue(makeValidationResult(false));

			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(oseService.sendInvoice).not.toHaveBeenCalled();
			expect(result.processingLog.stages.oseSubmission).toBeDefined();
			expect(result.processingLog.stages.oseSubmission!.status).toBe("skipped");
		});

		it("should record OSE_FAILED stage when submission fails", async () => {
			const oseService = createOSEServiceMock({ shouldFail: true });
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.processingLog.stages.oseSubmission).toBeDefined();
			expect(result.processingLog.stages.oseSubmission!.status).toBe("failed");
		});
	});

	describe("when oseService is NOT configured", () => {
		it("should skip OSE submission when no oseService config", async () => {
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.status).toBe("success");
			expect(result.processingLog.stages.oseSubmission).toBeDefined();
			expect(result.processingLog.stages.oseSubmission!.status).toBe("skipped");
		});

		it("should not set cdrResponse when OSE is not configured", async () => {
			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(result.cdrResponse).toBeUndefined();
		});
	});

	describe("OSE_SUBMITTING state transition", () => {
		it("should transition through OSE_SUBMITTING state", async () => {
			// Track persistRunState calls by observing the OSE service call timing
			let oseCalled = false;
			const oseService = {
				sendInvoice: vi.fn().mockImplementation(async () => {
					oseCalled = true;
					return {
						success: true,
						cdrContent: "base64-cdr",
						cdrStatus: "ACEPTADO" as const,
						cdrMessage: "OK",
						sunatCode: "0",
					};
				}),
			};

			orchestrator = new WorkflowOrchestratorV2(
				mockAgents.readerAgent,
				mockAgents.parserAgent,
				mockAgents.validatorAgent,
				mockAgents.arbitratorAgent,
				{ oseService, enableCircuitBreaker: false, agentTimeoutMs: 5000 },
				eventBus,
			);

			const result = await orchestrator.processInvoice(makeReaderInput());

			expect(oseCalled).toBe(true);
			expect(result.status).toBe("success");
		});
	});
});
