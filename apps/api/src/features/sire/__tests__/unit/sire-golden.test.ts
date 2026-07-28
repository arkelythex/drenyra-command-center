/**
 * CAP-SIRE-01 Phase C.3 — Golden test fixtures for SIRE diff output.
 *
 * Ensures buildDiffRows and buildSummary produce deterministic output
 * that matches pre-computed golden fixtures.
 */
import { describe, expect, it } from "vitest";
import { buildDiffRows, buildSummary } from "../../services/sire-diff.service";

// Golden input fixture (mirrors tests/fixtures/sire-diff-input.json)
const goldenInput = {
	period: "2026-03",
	currency: "PEN" as const,
	local: [
		{ series: "F001", number: "1", documentType: "01", issueDate: "2026-03-01", total: 1000, currency: "PEN" as const },
		{ series: "F001", number: "2", documentType: "01", issueDate: "2026-03-02", total: 2500, currency: "PEN" as const },
		{ series: "F001", number: "3", documentType: "01", issueDate: "2026-03-03", total: 500, currency: "PEN" as const },
		{ series: "E001", number: "1", documentType: "01", issueDate: "2026-03-04", total: 800, currency: "PEN" as const },
	],
	sunat: [
		{ series: "F001", number: "1", documentType: "01", issueDate: "2026-03-01", total: 1000, currency: "PEN" as const },
		{ series: "F001", number: "2", documentType: "01", issueDate: "2026-03-02", total: 2700, currency: "PEN" as const },
		{ series: "F001", number: "4", documentType: "01", issueDate: "2026-03-05", total: 1200, currency: "PEN" as const },
	],
	cpe: [] as Array<{ series: string; number: string; documentType: string; issueDate: string; total: number; currency: string }>,
};

// Golden expected output (mirrors tests/fixtures/sire-diff-expected.json)
const goldenExpected = {
	summary: { matched: 1, mismatched: 1, missingOnLedger: 1, missingOnSunat: 2, critical: 4, totalDifference: 2700 },
	rows: [
		{ status: "MISMATCH", reason: "Diferencia de monto entre libros internos y SUNAT", difference: -200, key: "F001-2" },
		{ status: "MISSING_LOCAL", reason: "Presente en propuesta SUNAT, ausente en libros internos", difference: 1200, key: "F001-4" },
		{ status: "MISSING_SUNAT", reason: "Presente en libros internos, ausente en propuesta SUNAT", difference: 500, key: "F001-3" },
		{ status: "MISSING_SUNAT", reason: "Presente en libros internos, ausente en propuesta SUNAT", difference: 800, key: "E001-1" },
		{ status: "MATCH", reason: "Consistente entre fuentes", difference: 0, key: "F001-1" },
	],
};

function recordFromJson(entry: typeof goldenInput.local[number]) {
	return {
		key: `${entry.series}-${entry.number}`,
		record: {
			documentType: entry.documentType,
			series: entry.series,
			number: entry.number,
			issueDate: entry.issueDate,
			total: entry.total,
			currency: entry.currency,
		},
	};
}

describe("Golden test fixtures (Phase C.3)", () => {
	it("buildDiffRows output matches golden expected rows", () => {
		const local = goldenInput.local.map(recordFromJson);
		const sunat = goldenInput.sunat.map(recordFromJson);
		const cpe = goldenInput.cpe.map(recordFromJson);

		const rows = buildDiffRows({ local, sunat, cpe });

		const actual = rows
			.map((r) => ({
				status: r.status,
				reason: r.reason,
				difference: r.difference,
				key: `${r.localRecord?.series ?? r.sunatRecord?.series ?? r.cpeRecord?.series ?? "?"}-${r.localRecord?.number ?? r.sunatRecord?.number ?? r.cpeRecord?.number ?? "?"}`,
			}))
			.sort((a, b) => a.key.localeCompare(b.key));

		const expected = [...goldenExpected.rows].sort((a, b) =>
			a.key.localeCompare(b.key),
		);

		expect(actual).toEqual(expected);
	});

	it("buildSummary matches golden summary", () => {
		const local = goldenInput.local.map(recordFromJson);
		const sunat = goldenInput.sunat.map(recordFromJson);
		const cpe = goldenInput.cpe.map(recordFromJson);

		const rows = buildDiffRows({ local, sunat, cpe });
		const summary = buildSummary(rows);

		expect(summary).toEqual(goldenExpected.summary);
	});

	it("buildSummary with threshold 1000 produces only 1 critical row (F001-4 diff=1200)", () => {
		const local = goldenInput.local.map(recordFromJson);
		const sunat = goldenInput.sunat.map(recordFromJson);
		const cpe = goldenInput.cpe.map(recordFromJson);

		const rows = buildDiffRows({ local, sunat, cpe });
		const summary = buildSummary(rows, { threshold: 1000 });

		// F001-4 MISSING_LOCAL diff=1200 >= 1000 → critical
		// All other non-MATCH rows: F001-2 diff=200, F001-3 diff=500, E001-1 diff=800 → below threshold
		expect(summary.critical).toBe(1);
	});

	it("golden output is deterministic — same inputs produce same output twice", () => {
		const local = goldenInput.local.map(recordFromJson);
		const sunat = goldenInput.sunat.map(recordFromJson);
		const cpe = goldenInput.cpe.map(recordFromJson);

		const rows1 = buildDiffRows({ local, sunat, cpe });
		const rows2 = buildDiffRows({ local, sunat, cpe });

		// Compare serialized forms for deep equality
		expect(JSON.stringify(rows1.map(r => ({ status: r.status, difference: r.difference }))))
			.toBe(JSON.stringify(rows2.map(r => ({ status: r.status, difference: r.difference }))));
	});
});
