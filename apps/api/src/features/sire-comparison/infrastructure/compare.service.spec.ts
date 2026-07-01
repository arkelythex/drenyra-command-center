import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SireDiffRow } from "../../sire/services/sire-diff.service";

const mocks = vi.hoisted(() => ({
	buildThreeWayDiff: vi.fn(),
	buildSummary: vi.fn(),
	applyResolutions: vi.fn().mockResolvedValue({
		updatedInvoices: 0,
		updatedBills: 0,
		createdInvoices: 0,
		createdBills: 0,
	}),
}));

vi.mock("../../sire/services/sire-diff.service", () => ({
	SireDiffService: { buildThreeWayDiff: mocks.buildThreeWayDiff },
	buildDiffRows: vi.fn(),
	buildSummary: mocks.buildSummary,
}));

vi.mock("../../sire/services/sire-diff-ledger.service", () => ({
	SireDiffLedgerService: { applyResolutions: mocks.applyResolutions },
}));

import { SireComparisonService } from "./compare.service";

const sunatRecord = {
	documentType: "01",
	series: "F001",
	number: "1",
	issueDate: "2024-01-15",
	total: 100,
	currency: "PEN" as const,
};

const localRecord = {
	documentType: "01",
	series: "F001",
	number: "1",
	issueDate: "2024-01-15",
	total: 100,
	currency: "PEN" as const,
};

const mockRows: SireDiffRow[] = [
	{
		id: "row-match",
		status: "MATCH",
		reason: "Consistente entre fuentes",
		difference: 0,
		localRecord,
		sunatRecord,
		resolution: "KEPT_LOCAL",
	},
	{
		id: "row-sunat-only",
		status: "MISSING_LOCAL",
		reason: "Presente en SUNAT, ausente en libros",
		difference: 200,
		sunatRecord: { ...sunatRecord, number: "2", total: 200 },
		resolution: "PENDING",
	},
	{
		id: "row-mismatch",
		status: "MISMATCH",
		reason: "Diferencia de monto",
		difference: 50,
		localRecord: { ...localRecord, number: "3", total: 150 },
		sunatRecord: { ...sunatRecord, number: "3", total: 100 },
		resolution: "PENDING",
	},
];

const defaultArtifact = {
	period: "2024-01",
	currency: "PEN",
	summary: {
		matched: 1,
		mismatched: 1,
		missingOnLedger: 1,
		missingOnSunat: 0,
		critical: 2,
		totalDifference: 250,
	},
	rows: mockRows,
	sunatSource: "upload" as const,
	approvable: false,
	submitBlocked: true,
	submitBlockReason: "Critical discrepancies require review",
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.buildThreeWayDiff.mockResolvedValue(defaultArtifact);
	mocks.buildSummary.mockReturnValue(defaultArtifact.summary);
});

describe("SireComparisonService", () => {
	describe("runComparison", () => {
		it("returns rows and summary with correct structure", async () => {
			const result = await SireComparisonService.runComparison(
				"company-1",
				"2024-01",
			);

			expect(mocks.buildThreeWayDiff).toHaveBeenCalledWith({
				companyId: "company-1",
				period: "2024-01",
			});
			expect(result).toHaveProperty("rows");
			expect(result).toHaveProperty("summary");
			expect(result.rows).toHaveLength(3);
			expect(result.summary.totalRecords).toBe(3);
			expect(result.summary.matchPercent).toBe(33.3);
			expect(result.summary.sunatOnly).toBe(1);
			expect(result.summary.amountMismatch).toBe(1);
		});

		it("returns 100 match percent when no data from both sources", async () => {
			mocks.buildThreeWayDiff.mockResolvedValue({
				...defaultArtifact,
				rows: [],
				summary: {
					matched: 0,
					mismatched: 0,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 0,
					totalDifference: 0,
				},
			});
			mocks.buildSummary.mockReturnValue({
				matched: 0,
				mismatched: 0,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 0,
				totalDifference: 0,
			});

			const result = await SireComparisonService.runComparison(
				"company-1",
				"2024-02",
			);

			expect(result.rows).toHaveLength(0);
			expect(result.summary.totalRecords).toBe(0);
			expect(result.summary.matchPercent).toBe(100);
		});
	});

	describe("getComparison", () => {
		it("returns summary and discrepancies excluding MATCH rows", async () => {
			const result = await SireComparisonService.getComparison(
				"company-1",
				"2024-01",
			);

			expect(result).toHaveProperty("summary");
			expect(result).toHaveProperty("discrepancies");
			expect(result.discrepancies).toHaveLength(2);

			const types = result.discrepancies.map((d) => d.type);
			expect(types).toContain("SUNAT_ONLY");
			expect(types).toContain("AMOUNT_MISMATCH");
		});
	});

	describe("getDiscrepancies", () => {
		it("returns all discrepancies for a period without filters", async () => {
			const discrepancies = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
			);

			expect(discrepancies).toHaveLength(2);
		});

		it("filters discrepancies by type", async () => {
			const sunatOnly = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
				"SUNAT_ONLY",
			);
			expect(sunatOnly).toHaveLength(1);
			expect(sunatOnly[0]!.type).toBe("SUNAT_ONLY");

			const amountMismatch = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
				"AMOUNT_MISMATCH",
			);
			expect(amountMismatch).toHaveLength(1);
			expect(amountMismatch[0]!.type).toBe("AMOUNT_MISMATCH");

			const localOnly = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
				"LOCAL_ONLY",
			);
			expect(localOnly).toHaveLength(0);
		});

		it("filters discrepancies by status", async () => {
			const unresolved = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
				undefined,
				"UNRESOLVED",
			);
			expect(unresolved).toHaveLength(2);
			expect(unresolved.every((d) => d.status === "UNRESOLVED")).toBe(true);

			const accepted = await SireComparisonService.getDiscrepancies(
				"company-1",
				"2024-01",
				undefined,
				"ACCEPTED",
			);
			expect(accepted).toHaveLength(0);
		});
	});

	describe("resolveDiscrepancy", () => {
		it("changes status to ACCEPTED and stores notes", async () => {
			await SireComparisonService.runComparison("company-2", "2024-01");

			const result = await SireComparisonService.resolveDiscrepancy(
				"row-sunat-only",
				"ACCEPT_SUNAT",
				"Accepted SUNAT record",
			);

			expect(result.status).toBe("ACCEPTED");
			expect(result.notes).toBe("Accepted SUNAT record");
			expect(mocks.applyResolutions).toHaveBeenCalledTimes(1);
		});

		it("throws when discrepancy id is not found", async () => {
			await expect(
				SireComparisonService.resolveDiscrepancy(
					"nonexistent-id",
					"FLAG_FOR_REVIEW",
				),
			).rejects.toThrow("not found");
		});

		it("sets FLAGGED status for FLAG_FOR_REVIEW action", async () => {
			await SireComparisonService.runComparison("company-2", "2024-01");

			const result = await SireComparisonService.resolveDiscrepancy(
				"row-sunat-only",
				"FLAG_FOR_REVIEW",
			);

			expect(result.status).toBe("FLAGGED");
		});

		it("sets REVIEWING status for MANUAL_FIX action", async () => {
			await SireComparisonService.runComparison("company-2", "2024-01");

			const result = await SireComparisonService.resolveDiscrepancy(
				"row-mismatch",
				"MANUAL_FIX",
				"Fixing manually",
			);

			expect(result.status).toBe("REVIEWING");
			expect(result.notes).toBe("Fixing manually");
		});
	});

	describe("getReport", () => {
		it("returns complete report structure", async () => {
			const result = await SireComparisonService.getReport(
				"company-1",
				"2024-01",
			);

			expect(result.report.period).toBe("2024-01");
			expect(result.report.companyId).toBe("company-1");
			expect(result.report.summary.totalRecords).toBe(3);
			expect(result.report.discrepancies).toHaveLength(2);
			expect(result.report.generatedAt).toBeDefined();
		});
	});

	describe("getDashboard", () => {
		it("returns 6 periods and overall match percent", async () => {
			mocks.buildThreeWayDiff.mockResolvedValue({
				...defaultArtifact,
				summary: {
					matched: 1,
					mismatched: 0,
					missingOnLedger: 0,
					missingOnSunat: 0,
					critical: 0,
					totalDifference: 0,
				},
			});
			mocks.buildSummary.mockReturnValue({
				matched: 1,
				mismatched: 0,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 0,
				totalDifference: 0,
			});

			const result = await SireComparisonService.getDashboard("company-1");

			expect(result.periods).toHaveLength(6);
			expect(result.overallMatchPercent).toBeGreaterThan(0);
		});
	});
});
