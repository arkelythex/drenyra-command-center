import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompleteInvoiceProcessingWorkflow } from "../../workflows/complete-invoice-processing.workflow";
import { MultiRucProcessingWorkflow } from "../../workflows/multi-ruc-processing.workflow";

describe("MultiRucProcessingWorkflow", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("processes companies in parallel and aggregates execution summary", async () => {
		vi.spyOn(
			CompleteInvoiceProcessingWorkflow.prototype,
			"execute",
		).mockResolvedValue({
			totalProcessed: 2,
			totalSuccess: 2,
			totalFailed: 0,
			results: [],
			execution: {
				parallelized: true,
				batchSize: 2,
				totalCostUsd: 0.04,
				totalDurationMs: 25,
				agentsUsed: ["ocr", "sunat", "pcge", "evidence"],
			},
		});

		const workflow = new MultiRucProcessingWorkflow();
		const output = await workflow.execute({
			companies: [
				{
					ruc: "20100070970",
					companyName: "A",
					documents: [
						{
							id: "A1",
							imageUrl: "img://a1",
							filename: "a1.pdf",
							mimeType: "application/pdf",
						},
						{
							id: "A2",
							imageUrl: "img://a2",
							filename: "a2.pdf",
							mimeType: "application/pdf",
						},
					],
				},
				{
					ruc: "20553510661",
					companyName: "B",
					documents: [
						{
							id: "B1",
							imageUrl: "img://b1",
							filename: "b1.pdf",
							mimeType: "application/pdf",
						},
						{
							id: "B2",
							imageUrl: "img://b2",
							filename: "b2.pdf",
							mimeType: "application/pdf",
						},
					],
				},
			],
			priority: "high",
		});

		expect(output.totalCompanies).toBe(2);
		expect(output.totalDocuments).toBe(4);
		expect(output.successfulCompanies).toBe(2);
		expect(output.failedCompanies).toBe(0);
		expect(output.execution.parallelized).toBe(true);
		expect(output.execution.totalCostUsd).toBeCloseTo(0.08, 6);
	});

	it("builds report with summary and per-company stats", () => {
		const workflow = new MultiRucProcessingWorkflow();
		const report = workflow.generateReport({
			totalCompanies: 2,
			totalDocuments: 4,
			successfulCompanies: 2,
			failedCompanies: 0,
			results: [
				{
					ruc: "20100070970",
					companyName: "A",
					processing: {
						totalProcessed: 2,
						totalSuccess: 2,
						totalFailed: 0,
						results: [],
						execution: {
							parallelized: true,
							batchSize: 2,
							totalCostUsd: 0.04,
							totalDurationMs: 20,
							agentsUsed: ["ocr", "sunat", "pcge", "evidence"],
						},
					},
				},
				{
					ruc: "20553510661",
					companyName: "B",
					processing: {
						totalProcessed: 2,
						totalSuccess: 1,
						totalFailed: 1,
						results: [],
						execution: {
							parallelized: true,
							batchSize: 2,
							totalCostUsd: 0.03,
							totalDurationMs: 22,
							agentsUsed: ["ocr", "sunat", "pcge", "evidence"],
						},
					},
				},
			],
			execution: {
				parallelized: true,
				totalCostUsd: 0.07,
				totalDurationMs: 42,
				averageCostPerCompany: 0.035,
				averageTimePerCompany: 21,
			},
		});

		expect(report.summary).toContain("Empresas procesadas: 2");
		expect(report.statistics.totalInvoicesProcessed).toBe(4);
		expect(report.statistics.averageCostPerInvoice).toBeCloseTo(0.0175, 6);
		expect(report.byCompany).toHaveLength(2);
		expect(report.byCompany[1].successRate).toBeCloseTo(0.5, 6);
	});
});
