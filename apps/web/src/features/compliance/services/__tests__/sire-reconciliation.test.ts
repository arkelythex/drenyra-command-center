import { describe, expect, it } from "vitest";
import type { SireRecord } from "../../types/sire.types";
import { reconcileSire, toCents } from "../sire-reconciliation";

const record = (overrides: Partial<SireRecord> = {}): SireRecord => ({
	periodo: "202501",
	caratula: "RVIE",
	rucEmisor: "20100000001",
	razonSocial: "PROVEEDOR A S.A.C.",
	tipoComprobante: "01",
	serie: "F001",
	numero: "00001234",
	fechaEmision: "2025-01-10",
	moneda: "PEN",
	baseImponible: 1000,
	igv: 180,
	total: 1180,
	estado: "ACTIVO",
	origen: "SUNAT",
	...overrides,
});

describe("toCents", () => {
	it("rounds decimal amounts to integer cents without float drift", () => {
		expect(toCents(0.1 + 0.2)).toBe(30);
		expect(toCents(1.005)).toBe(101);
		expect(toCents(118.59)).toBe(11859);
		expect(toCents(-450.5)).toBe(-45050);
	});

	it("rejects non-finite amounts", () => {
		expect(() => toCents(Number.NaN)).toThrow();
		expect(() => toCents(Number.POSITIVE_INFINITY)).toThrow();
	});
});

describe("reconcileSire", () => {
	it("matches identical records with no discrepancies", () => {
		const { discrepancies, stats } = reconcileSire(
			[record()],
			[record({ origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([]);
		expect(stats).toMatchObject({
			matchCount: 1,
			discrepancyCount: 0,
			igvGap: 0,
		});
	});

	it("flags SUNAT records absent from the books as HIGH", () => {
		const { discrepancies } = reconcileSire([record()], []);
		expect(discrepancies).toEqual([
			expect.objectContaining({
				type: "MISSING_IN_ARKELYTHEX",
				severity: "HIGH",
			}),
		]);
	});

	it("flags local records absent from SUNAT as MEDIUM, but only once SUNAT data exists", () => {
		const local = record({ origen: "ARKELYTHEX" });
		expect(reconcileSire([], [local]).discrepancies).toEqual([]);
		const other = record({ numero: "00000001" });
		const { discrepancies } = reconcileSire([other], [local]);
		expect(discrepancies.map((d) => d.type).sort()).toEqual([
			"MISSING_IN_ARKELYTHEX",
			"MISSING_IN_SUNAT",
		]);
	});

	it("detects an amount difference of a single cent by default", () => {
		const { discrepancies } = reconcileSire(
			[record({ total: 1180.01 })],
			[record({ total: 1180, origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({
				type: "AMOUNT_MISMATCH",
				severity: "MEDIUM",
				diffAmount: 0.01,
			}),
		]);
	});

	it("honours an explicit tolerance in cents", () => {
		const { discrepancies } = reconcileSire(
			[record({ total: 1180.05 })],
			[record({ total: 1180, origen: "ARKELYTHEX" })],
			{ toleranceCents: 5 },
		);
		expect(discrepancies).toEqual([]);
	});

	it("computes the amount gap exactly (no float residue)", () => {
		const { discrepancies } = reconcileSire(
			[record({ total: 0.3 })],
			[record({ total: 0.1 + 0.2 - 0.1, origen: "ARKELYTHEX" })],
		);
		expect(discrepancies[0]?.diffAmount).toBe(0.1);
	});

	it("reports a currency mismatch instead of comparing amounts across currencies", () => {
		const { discrepancies } = reconcileSire(
			[record({ moneda: "USD", total: 590 })],
			[record({ moneda: "PEN", total: 590, origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({ type: "CURRENCY_MISMATCH", severity: "HIGH" }),
		]);
	});

	it("does not confuse documents of different type that share serie and number", () => {
		const { discrepancies } = reconcileSire(
			[record({ tipoComprobante: "03" })],
			[record({ tipoComprobante: "01", origen: "ARKELYTHEX" })],
		);
		expect(discrepancies.map((d) => d.type).sort()).toEqual([
			"MISSING_IN_ARKELYTHEX",
			"MISSING_IN_SUNAT",
		]);
	});

	it("ignores leading-zero padding differences in the document number", () => {
		const { discrepancies } = reconcileSire(
			[record({ numero: "00001234" })],
			[record({ numero: "1234", origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([]);
	});

	it("sums totals and IGV only for PEN so currencies are never mixed", () => {
		const { stats } = reconcileSire(
			[
				record({ total: 1180, igv: 180 }),
				record({ numero: "2", moneda: "USD", total: 590, igv: 90 }),
			],
			[record({ total: 1180, igv: 180, origen: "ARKELYTHEX" })],
		);
		expect(stats).toMatchObject({
			totalSunat: 1180,
			totalLocal: 1180,
			igvGap: 0,
		});
	});

	it("reports a negative IGV gap when the books carry more IGV than SUNAT", () => {
		const { stats } = reconcileSire(
			[record({ igv: 180 })],
			[record({ igv: 190.5, origen: "ARKELYTHEX" })],
		);
		expect(stats.igvGap).toBe(-10.5);
	});

	it("keeps matchCount equal to the documents that agree on both sides", () => {
		const { stats } = reconcileSire(
			[record(), record({ numero: "00000002", total: 10 })],
			[
				record({ origen: "ARKELYTHEX" }),
				record({ numero: "00000002", total: 11, origen: "ARKELYTHEX" }),
				record({ numero: "00000003", origen: "ARKELYTHEX" }),
			],
		);
		// Both documents exist on both sides but only one agrees; one is local-only.
		expect(stats.matchCount).toBe(1);
		expect(stats.discrepancyCount).toBe(2);
	});

	it("gives every discrepancy a unique id", () => {
		const { discrepancies } = reconcileSire(
			[record(), record({ numero: "00000002" })],
			[],
		);
		expect(new Set(discrepancies.map((d) => d.id)).size).toBe(2);
	});

	it("flags an IGV difference even when totals agree", () => {
		const { discrepancies, stats } = reconcileSire(
			[record({ igv: 180, baseImponible: 1000, total: 1180 })],
			[
				record({
					igv: 0,
					baseImponible: 1180,
					total: 1180,
					origen: "ARKELYTHEX",
				}),
			],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({
				type: "IGV_MISMATCH",
				severity: "HIGH",
				diffAmount: 180,
			}),
		]);
		expect(stats.matchCount).toBe(0);
	});

	it("does not let opposite IGV gaps on two documents net to zero", () => {
		const { discrepancies, stats } = reconcileSire(
			[record({ igv: 180 }), record({ numero: "2", igv: 90 })],
			[
				record({ igv: 162, origen: "ARKELYTHEX" }),
				record({ numero: "2", igv: 108, origen: "ARKELYTHEX" }),
			],
		);
		expect(stats.igvGap).toBe(0);
		expect(discrepancies.filter((d) => d.type === "IGV_MISMATCH")).toHaveLength(
			2,
		);
	});

	it("reports repeated documents instead of silently dropping them", () => {
		const { discrepancies, stats } = reconcileSire(
			[record({ total: 100 }), record({ total: 500 })],
			[record({ total: 100, origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({ type: "DUPLICATE_DOCUMENT", severity: "HIGH" }),
		]);
		// Totals use the same de-duplicated view as the comparison.
		expect(stats.totalSunat).toBe(100);
		expect(stats.totalLocal).toBe(100);
	});

	it("flags an annulled document that is still active on the other side and keeps it out of totals", () => {
		const { discrepancies, stats } = reconcileSire(
			[record({ estado: "ANULADO" })],
			[record({ origen: "ARKELYTHEX" })],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({ type: "STATUS_MISMATCH", severity: "HIGH" }),
		]);
		expect(stats.totalSunat).toBe(0);
		expect(stats.totalLocal).toBe(1180);
	});

	it("accepts SUNAT's zeroed row as the annulment of a cancelled local document", () => {
		// SIRE files carry no status column: SUNAT reports annulled documents with zero amounts.
		const { discrepancies, stats } = reconcileSire(
			[record({ baseImponible: 0, igv: 0, total: 0 })],
			[record({ origen: "ARKELYTHEX", estado: "ANULADO" })],
		);
		expect(discrepancies).toEqual([]);
		expect(stats.matchCount).toBe(1);
	});

	it("still flags a cancelled local document that SUNAT reports with amounts", () => {
		const { discrepancies } = reconcileSire(
			[record()],
			[record({ origen: "ARKELYTHEX", estado: "ANULADO" })],
		);
		expect(discrepancies).toEqual([
			expect.objectContaining({ type: "STATUS_MISMATCH", severity: "HIGH" }),
		]);
	});

	it("rejects tolerances that would hide discrepancies", () => {
		for (const toleranceCents of [Number.NaN, -5, 0.5]) {
			expect(() => reconcileSire([], [], { toleranceCents })).toThrow(
				RangeError,
			);
		}
	});

	it("normalises case, whitespace and tipo padding in the document key", () => {
		const { discrepancies } = reconcileSire(
			[
				record({
					serie: "F001",
					tipoComprobante: "01",
					numero: "1234",
					rucEmisor: "20100000001",
				}),
			],
			[
				record({
					serie: " f001 ",
					tipoComprobante: "1",
					numero: "1234 ",
					rucEmisor: " 20100000001 ",
					origen: "ARKELYTHEX",
				}),
			],
		);
		expect(discrepancies).toEqual([]);
	});

	it("treats currency codes case-insensitively and does not count a currency mismatch as a match", () => {
		const same = reconcileSire(
			[record({ moneda: "pen" })],
			[record({ moneda: "PEN", origen: "ARKELYTHEX" })],
		);
		expect(same.discrepancies).toEqual([]);
		expect(same.stats.totalSunat).toBe(1180);

		const different = reconcileSire(
			[record({ moneda: "USD" })],
			[record({ moneda: "PEN", origen: "ARKELYTHEX" })],
		);
		expect(different.stats.matchCount).toBe(0);
	});

	it("never returns negative zero", () => {
		expect(Object.is(toCents(-0), 0)).toBe(true);
	});
});
