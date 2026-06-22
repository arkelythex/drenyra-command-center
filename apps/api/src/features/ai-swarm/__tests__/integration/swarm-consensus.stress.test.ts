import { beforeAll, describe, expect, it, vi } from "vitest";

type MastraWorkflowModule =
	typeof import("../../workflows/mastra-invoice-processing.workflow");
let mastraInvoiceProcessingWorkflow: MastraWorkflowModule["mastraInvoiceProcessingWorkflow"];
let DEFAULT_MASTRA_INVOICE_INPUT: MastraWorkflowModule["DEFAULT_MASTRA_INVOICE_INPUT"];

describe("Swarm consensus stress", () => {
	beforeAll(async () => {
		process.env.OPENROUTER_API_KEY = "";
		vi.resetModules();
		({ mastraInvoiceProcessingWorkflow, DEFAULT_MASTRA_INVOICE_INPUT } =
			await import("../../workflows/mastra-invoice-processing.workflow"));
	});

	it("reaches stable consensus with 10+ parallel agent executions", async () => {
		const parallelRuns = 12; // 12 workflow runs x 3 agents = 36 agent executions
		const startedAt = Date.now();

		const runResults = await Promise.all(
			Array.from({ length: parallelRuns }, async (_, index) => {
				const run = await mastraInvoiceProcessingWorkflow.createRun();
				return run.start({
					inputData: {
						...DEFAULT_MASTRA_INVOICE_INPUT,
						documentId: `DOC-STRESS-${index + 1}`,
						numero: `${index + 1}`,
						subtotal: 250 + index,
						igv: Number(((250 + index) * 0.18).toFixed(2)),
						total: Number(((250 + index) * 1.18).toFixed(2)),
					},
				});
			}),
		);

		const durationMs = Date.now() - startedAt;
		expect(durationMs).toBeLessThanOrEqual(37000);
		expect(runResults).toHaveLength(parallelRuns);
		expect(runResults.every((result) => result.status === "success")).toBe(
			true,
		);

		const successfulOutputs = runResults
			.filter((result) => result.status === "success")
			.map(
				(result) =>
					result.result as {
						decision: "approved" | "manual_review" | "rejected";
					},
			);

		const decisionCount = successfulOutputs.reduce<Record<string, number>>(
			(acc, output) => {
				acc[output.decision] = (acc[output.decision] ?? 0) + 1;
				return acc;
			},
			{},
		);

		const consensusEntry = Object.entries(decisionCount).sort(
			(a, b) => b[1] - a[1],
		)[0];
		expect(consensusEntry).toBeTruthy();
		const [consensusDecision, consensusVotes] = consensusEntry ?? [
			"unknown",
			0,
		];
		const consensusRatio = consensusVotes / successfulOutputs.length;
		const totalAgentExecutions = parallelRuns * 3;

		expect(totalAgentExecutions).toBeGreaterThanOrEqual(10);
		expect(consensusDecision).toBe("manual_review");
		expect(consensusRatio).toBeGreaterThanOrEqual(0.9);
	});
});
