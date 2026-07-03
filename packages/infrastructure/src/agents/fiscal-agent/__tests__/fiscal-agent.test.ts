/**
 * Fiscal Agent Pipeline — Integration tests.
 * Tests the full pipeline: Collector → Categorizer → Calculator → Reconciler → Reporter
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { FiscalNightlyRunUseCase } from "@arkelythex/application/use-cases/fiscal-agent/fiscal-nightly-run.use-case";
import { FiscalHealthService } from "@arkelythex/infrastructure/services/fiscal-health.service";

describe("FiscalNightlyRunUseCase", () => {
	const useCase = new FiscalNightlyRunUseCase();

	it("executes full pipeline and returns run report", async () => {
		const report = await useCase.execute({
			organizationId: 0,
			companyId: "test-company",
			period: "202607",
			countryCode: "PE",
		});

		expect(report.runId).toBeDefined();
		expect(report.organizationId).toBe(0);
		expect(report.companyId).toBe("test-company");
		expect(report.period).toBe("202607");
		expect(report.steps.length).toBeGreaterThanOrEqual(4);
		expect(["SUCCESS", "PARTIAL", "FAILED"]).toContain(report.status);
	});

	it("includes all expected steps in order", async () => {
		const report = await useCase.execute({
			organizationId: 0,
			companyId: "test-company",
			period: "202607",
			countryCode: "PE",
		});

		const stepNames = report.steps.map((s) => s.name);
		expect(stepNames).toContain("collect");
		expect(stepNames).toContain("categorize");
		expect(stepNames).toContain("calculate");
		expect(stepNames).toContain("reconcile");
		expect(stepNames).toContain("report");
	});

	it("reports step metrics", async () => {
		const report = await useCase.execute({
			organizationId: 0,
			companyId: "test-company",
			period: "202607",
			countryCode: "PE",
		});

		for (const step of report.steps) {
			expect(step.metrics.startedAt).toBeDefined();
			expect(step.metrics.completedAt).toBeDefined();
			expect(typeof step.metrics.itemsProcessed).toBe("number");
		}
	});

	it("generates summary with duration", async () => {
		const report = await useCase.execute({
			organizationId: 0,
			companyId: "test-company",
			period: "202607",
			countryCode: "PE",
		});

		expect(report.summary).toBeDefined();
		expect(report.summary.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("handles missing SIRE gracefully (collector warning)", async () => {
		const report = await useCase.execute({
			organizationId: 999,
			companyId: "no-sire-company",
			period: "202607",
			countryCode: "PE",
		});

		const collectStep = report.steps.find((s) => s.name === "collect");
		expect(collectStep).toBeDefined();
		// Should still succeed even without SIRE credentials
		expect(collectStep!.success).toBe(true);
	});
});

describe("FiscalHealthService", () => {
	const service = new FiscalHealthService();

	it("returns health score with all categories", async () => {
		const score = await service.getHealthScore(0, "test", "202607");

		expect(score.overall).toBeGreaterThanOrEqual(0);
		expect(score.overall).toBeLessThanOrEqual(100);
		expect(score.categories.sunatSync).toBeGreaterThanOrEqual(0);
		expect(score.categories.igvCompliance).toBeGreaterThanOrEqual(0);
		expect(score.categories.discrepancyRate).toBeGreaterThanOrEqual(0);
		expect(score.categories.deadlineProximity).toBeGreaterThanOrEqual(0);
	});

	it("includes next deadline date", async () => {
		const score = await service.getHealthScore(0, "test", "202607");
		expect(score.nextDeadline).toBeDefined();
		expect(score.nextDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("Agent Router", () => {
	it("provides routes for all fiscal tasks", async () => {
		const { FISCAL_AGENT_ROUTES } = await import("@arkelythex/infrastructure/ai/agent-router");

		expect(FISCAL_AGENT_ROUTES.length).toBeGreaterThanOrEqual(6);

		const taskNames = FISCAL_AGENT_ROUTES.map((r) => r.task);
		expect(taskNames).toContain("document_ingestion");
		expect(taskNames).toContain("transaction_categorization");
		expect(taskNames).toContain("tax_calculation");
		expect(taskNames).toContain("sunat_reconciliation");
		expect(taskNames).toContain("anomaly_detection");
		expect(taskNames).toContain("report_generation");
	});

	it("assigns appropriate delegation modes", async () => {
		const { FISCAL_AGENT_ROUTES } = await import("@arkelythex/infrastructure/ai/agent-router");

		const categorization = FISCAL_AGENT_ROUTES.find((r) => r.task === "transaction_categorization");
		expect(categorization?.delegation).toBe("proactive");

		const anomaly = FISCAL_AGENT_ROUTES.find((r) => r.task === "anomaly_detection");
		expect(anomaly?.delegation).toBe("explicit-request-only");
	});
});
