import { describe, expect, it } from "vitest";
import {
	buildDiffRows,
	buildSummary,
	computeSubmitBlocked,
	computeSubmitBlockedAfterCommit,
	validateDiffCommit,
} from "../../services/sire-diff.service";

function record(
	series: string,
	number: string,
	total: number,
): {
	key: string;
	record: {
		documentType: string;
		series: string;
		number: string;
		issueDate: string;
		total: number;
		currency: "PEN";
	};
} {
	return {
		key: `${series}-${number}`,
		record: {
			documentType: "01",
			series,
			number,
			issueDate: "2026-03-01",
			total,
			currency: "PEN",
		},
	};
}

describe("buildDiffRows", () => {
	it("marks identical local and SUNAT rows as MATCH", () => {
		const rows = buildDiffRows({
			local: [record("F001", "1", 100)],
			sunat: [record("F001", "1", 100)],
			cpe: [],
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]?.status).toBe("MATCH");
	});

	it("marks amount differences as MISMATCH", () => {
		const rows = buildDiffRows({
			local: [record("F001", "1", 100)],
			sunat: [record("F001", "1", 120)],
			cpe: [],
		});
		expect(rows[0]?.status).toBe("MISMATCH");
		expect(rows[0]?.difference).toBe(-20);
	});

	it("marks SUNAT-only rows as MISSING_LOCAL", () => {
		const rows = buildDiffRows({
			local: [],
			sunat: [record("F001", "9", 50)],
			cpe: [],
		});
		expect(rows[0]?.status).toBe("MISSING_LOCAL");
	});

	it("marks local-only rows as MISSING_SUNAT", () => {
		const rows = buildDiffRows({
			local: [record("E001", "2", 75)],
			sunat: [],
			cpe: [],
		});
		expect(rows[0]?.status).toBe("MISSING_SUNAT");
	});
});

describe("buildSummary", () => {
	it("aggregates row statuses", () => {
		const rows = buildDiffRows({
			local: [record("F001", "1", 100), record("F001", "2", 50)],
			sunat: [record("F001", "1", 100), record("F001", "3", 30)],
			cpe: [],
		});
		const summary = buildSummary(rows);
		expect(summary.matched).toBe(1);
		expect(summary.missingOnSunat).toBe(1);
		expect(summary.missingOnLedger).toBe(1);
		expect(summary.critical).toBe(2);
	});
});

describe("computeSubmitBlocked", () => {
	it("blocks when SUNAT source is unavailable", () => {
		const gate = computeSubmitBlocked({
			summary: {
				matched: 0,
				mismatched: 0,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 0,
				totalDifference: 0,
			},
			sunatSource: "unavailable",
		});
		expect(gate.submitBlocked).toBe(true);
	});

	it("blocks when critical discrepancies remain", () => {
		const gate = computeSubmitBlocked({
			summary: {
				matched: 1,
				mismatched: 1,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 1,
				totalDifference: 10,
			},
			sunatSource: "upload",
		});
		expect(gate.submitBlocked).toBe(true);
	});

	it("allows submit when persisted source and no critical rows", () => {
		const gate = computeSubmitBlocked({
			summary: {
				matched: 2,
				mismatched: 0,
				missingOnLedger: 0,
				missingOnSunat: 0,
				critical: 0,
				totalDifference: 0,
			},
			sunatSource: "persisted",
		});
		expect(gate.submitBlocked).toBe(false);
	});
});

describe("validateDiffCommit", () => {
	it("rejects commit when SUNAT source is unavailable", () => {
		const result = validateDiffCommit({
			sunatSource: "unavailable",
			rows: [],
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("SIRE_DIFF_COMMIT_BLOCKED");
		}
	});

	it("rejects commit when critical rows remain pending", () => {
		const result = validateDiffCommit({
			sunatSource: "upload",
			rows: [{ rowId: "1", status: "MISMATCH", decision: "PENDING" }],
		});
		expect(result.ok).toBe(false);
	});

	it("allows commit when all critical rows are resolved", () => {
		const result = validateDiffCommit({
			sunatSource: "persisted",
			rows: [
				{ rowId: "1", status: "MISMATCH", decision: "ACCEPT_SUNAT" },
				{ rowId: "2", status: "MATCH", decision: "KEEP_LOCAL" },
			],
		});
		expect(result.ok).toBe(true);
	});
});

describe("computeSubmitBlockedAfterCommit", () => {
	it("clears submit gate when all rows resolved with upload source", () => {
		const result = computeSubmitBlockedAfterCommit({
			sunatSource: "upload",
			rows: [{ rowId: "1", status: "MISMATCH", decision: "ACCEPT_SUNAT" }],
		});
		expect(result.submitBlocked).toBe(false);
	});
});
