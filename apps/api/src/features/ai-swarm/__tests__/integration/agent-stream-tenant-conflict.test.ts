import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRunMock = vi.hoisted(() => vi.fn());
const triggerWorkflowConsensusAlertMock = vi.hoisted(() => vi.fn());

vi.mock("../../alerts/workflow-alert-trigger", () => ({
	triggerWorkflowConsensusAlert: triggerWorkflowConsensusAlertMock,
}));

vi.mock("../../workflows/mastra-invoice-processing.workflow", () => ({
	mastraInvoiceProcessingWorkflow: {
		createRun: createRunMock,
	},
	mapWorkflowStepToAgent: () => null,
	DEFAULT_MASTRA_INVOICE_INPUT: {
		documentId: "mock-doc",
		filename: "mock.pdf",
		mimeType: "application/pdf",
		ruc: "20100070970",
		serie: "F001",
		numero: "1",
		fecha: "2026-02-18",
		moneda: "PEN" as const,
		subtotal: 100,
		igv: 18,
		total: 118,
	},
}));

import { agentStreamRoute } from "../../api/agent-stream.route";

describe("AI Swarm agent stream tenant conflict guard", () => {
	beforeEach(() => {
		createRunMock.mockClear();
		triggerWorkflowConsensusAlertMock.mockClear();
	});

	it("rejects conflicting query and header organization context before workflow execution", async () => {
		const app = new Elysia().use(agentStreamRoute);
		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/agent-stream?orgId=73&documentId=DOC-ORG-004&ruc=20100070970&serie=F001&numero=4&fecha=2026-02-18&moneda=PEN&subtotal=100&igv=40&total=140",
				{
					headers: {
						"x-organization-id": "42",
					},
				},
			),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_CONFLICT");
		expect(createRunMock).not.toHaveBeenCalled();
		expect(triggerWorkflowConsensusAlertMock).not.toHaveBeenCalled();
	});
});
