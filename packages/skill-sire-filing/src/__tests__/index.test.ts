/**
 * Tests for @drenyra/skill-sire-filing.
 */

import { describe, it, expect } from "vitest";
import { detectOverdueDocuments, type SireFilingRecord } from "../index.js";

describe("detectOverdueDocuments", () => {
	const baseRecord: SireFilingRecord = {
		emisorRuc: "20123456789",
		tipoDoc: "01",
		serie: "F001",
		numero: "1",
		fechaEmision: "2026-06-01",
		fechaEnvio: "2026-06-05",
		cdrRecibido: true,
		cdrCodigo: "0",
		montoTotal: 1000,
	};

	it("detects critical-overdue documents (>30 days past deadline)", () => {
		const now = new Date("2026-08-01");
		const records: SireFilingRecord[] = [
			{ ...baseRecord, fechaEnvio: undefined },
		];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].tipo).toBe("critical-overdue");
		expect(anomalies[0].severidad).toBe("critica");
	});

	it("detects overdue documents (past deadline but <30 days)", () => {
		const now = new Date("2026-06-15");
		const records: SireFilingRecord[] = [
			{ ...baseRecord, fechaEnvio: undefined },
		];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].tipo).toBe("overdue");
		expect(anomalies[0].severidad).toBe("alta");
	});

	it("detects near-deadline documents (within 2 days)", () => {
		const now = new Date("2026-06-08");
		const records: SireFilingRecord[] = [
			{ ...baseRecord, fechaEnvio: undefined },
		];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].tipo).toBe("near-deadline");
	});

	it("detects missing CDR after sending", () => {
		const now = new Date("2026-06-10");
		const records: SireFilingRecord[] = [{ ...baseRecord, cdrRecibido: false }];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies.some((a) => a.tipo === "missing-cdr")).toBe(true);
		expect(anomalies.filter((a) => a.tipo === "missing-cdr")[0].severidad).toBe(
			"alta",
		);
	});

	it("returns empty for compliant documents", () => {
		const now = new Date("2026-06-03");
		const records: SireFilingRecord[] = [baseRecord];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies).toHaveLength(0);
	});

	it("returns multiple anomalies for the same document", () => {
		const now = new Date("2026-07-15");
		const records: SireFilingRecord[] = [
			{
				...baseRecord,
				fechaEnvio: "2026-07-10",
				cdrRecibido: false,
			},
		];
		const anomalies = detectOverdueDocuments(records, now);

		expect(anomalies.length).toBeGreaterThanOrEqual(2);
	});
});
