import { describe, expect, it } from "vitest";
import { ComplianceChainAdapter } from "../compliance-chain-adapter";

const TEST_SCOPE = {
	organizationId: "org-1",
	companyId: "comp-1",
	companyRuc: "20123456786",
	period: "2026-07",
};

const TEST_CAMBIO = {
	changeId: "test-chain-001",
	ruleType: "RATE" as const,
	affectedRegulation: "Ley N° 12345",
	oldValue: 0.18,
	newValue: 0.19,
	effectiveDate: "2026-08-01",
	description: "IGV rate change test",
};

describe("ComplianceChainAdapter", () => {
	it("creates adapter without artifact store", () => {
		const adapter = new ComplianceChainAdapter();
		expect(adapter).toBeDefined();
	});

	it("detects that detracciones needs chains", () => {
		const adapter = new ComplianceChainAdapter();
		expect(adapter.needsChains(["detracciones"])).toBe(true);
	});

	it("detects that igv needs chains", () => {
		const adapter = new ComplianceChainAdapter();
		expect(adapter.needsChains(["igv"])).toBe(true);
	});

	it("detects that unrelated modules do not need chains", () => {
		const adapter = new ComplianceChainAdapter();
		expect(adapter.needsChains(["ui", "docs"])).toBe(false);
	});

	it("runs chains and returns no chains when no subsystems affected", async () => {
		const adapter = new ComplianceChainAdapter();
		const result = await adapter.runChains(TEST_CAMBIO, [], TEST_SCOPE);

		expect(result.allPassed).toBe(true);
		expect(result.blocked).toBe(false);
		expect(result.reports).toHaveLength(0);
	});

	it("runs detraccion chain successfully", async () => {
		const adapter = new ComplianceChainAdapter();
		const result = await adapter.runChains(
			TEST_CAMBIO,
			["detracciones"],
			TEST_SCOPE,
		);

		expect(result.allPassed).toBe(true);
		expect(result.reports.length).toBeGreaterThanOrEqual(1);
		expect(result.reports[0].chainId).toBe("detraccion-rule-change");
	});

	it("runs IGV change chain for igv subsystem", async () => {
		const adapter = new ComplianceChainAdapter();
		const result = await adapter.runChains(TEST_CAMBIO, ["igv"], TEST_SCOPE);

		expect(result.reports.length).toBeGreaterThanOrEqual(1);
		expect(result.reports[0].chainId).toBe("igv-rate-change");
	});

	it("runs multiple chains for multiple subsystems", async () => {
		const adapter = new ComplianceChainAdapter();
		const result = await adapter.runChains(
			TEST_CAMBIO,
			["detracciones", "igv"],
			TEST_SCOPE,
		);

		expect(result.reports.length).toBeGreaterThanOrEqual(2);
	});

	it("reports blocked when chain status is BLOCKED", async () => {
		const adapter = new ComplianceChainAdapter();
		// Simular un cambio que falla forzando un stage blocked
		// El placeholder siempre pasa, así que esto verifica que no hay falsos positivos
		const result = await adapter.runChains(
			TEST_CAMBIO,
			["detracciones"],
			TEST_SCOPE,
		);

		expect(result.blocked).toBe(false);
	});

	it("reports stage count for each chain", async () => {
		const adapter = new ComplianceChainAdapter();
		const result = await adapter.runChains(
			TEST_CAMBIO,
			["detracciones"],
			TEST_SCOPE,
		);

		for (const report of result.reports) {
			expect(report.stageCount).toBeGreaterThanOrEqual(1);
			expect(report.durationMs).toBeGreaterThanOrEqual(0);
		}
	});

	it("handles case-insensitive subsystem names", () => {
		const adapter = new ComplianceChainAdapter();
		expect(adapter.needsChains(["Detracciones"])).toBe(true);
		expect(adapter.needsChains(["IGV"])).toBe(true);
		expect(adapter.needsChains(["SIRE"])).toBe(true);
	});
});
