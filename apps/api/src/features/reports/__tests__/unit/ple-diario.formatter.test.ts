import { describe, expect, it } from "vitest";
import { formatDiarioLine, formatDiario } from "../../application/generators/ple-diario.formatter";
import type { PleDiarioRecord } from "../../domain/ple.types";

const sampleRecord: PleDiarioRecord = {
	period: "06",
	fiscalYear: "2026",
	ruc: "20123456789",
	voucherNumber: "ASIENTO-00001",
	operationCode: "02",
	voucherDate: "30/06/2026",
	operationDate: "30/06/2026",
	accountCode: "601000",
	accountDescription: "GASTOS DE PERSONAL",
	currencyCode: "01",
	debitCents: "000000120000",
	creditCents: "000000000000",
	glCurrencyCode: "01",
	glDebitCents: "000000120000",
	glCreditCents: "000000000000",
	transactionType: "",
	gloss: "PAGO DE PLANILLA JUNIO 2026",
	documentType: "",
	documentNumber: "F001-00001234",
	documentDate: "30/06/2026",
	state: "1",
};

describe("PLE Diario Formatter", () => {
	it("produces correct fixed-width line from a record", () => {
		const line = formatDiarioLine(sampleRecord);

		// Verify pipe-delimited format
		expect(line).toContain("|");

		// Verify expected fields
		const fields = line.split("|");
		expect(fields).toHaveLength(21);

		// Verify specific known values
		expect(fields[0]?.trim()).toBe("06");      // Period
		expect(fields[1]?.trim()).toBe("2026");     // Year
		expect(fields[2]?.trim()).toBe("20123456789"); // RUC
		expect(fields[3]?.trim()).toBe("ASIENTO-00001"); // Voucher
		expect(fields[4]?.trim()).toBe("02");       // Operation code
		expect(fields[10]?.trim()).toBe("000000120000"); // Debit
		expect(fields[11]?.trim()).toBe("000000000000"); // Credit
	});

	it("aligns numeric fields right (zero-padded)", () => {
		const line = formatDiarioLine(sampleRecord);
		const fields = line.split("|");

		// Debit and credit fields should be right-aligned (12 chars, zero-padded)
		expect(fields[10]).toBe("000000120000");
		expect(fields[10]?.length).toBe(12);
	});

	it("generates complete file with header and footer", () => {
		const records = [sampleRecord, { ...sampleRecord, debitCents: "000000050000" }];
		const output = formatDiario(records, "2026-06", "20123456789");

		expect(output).toContain("|LIBRO DIARIO|2026-06|20123456789|");
		expect(output).toContain("TOTAL DEBITOS");
		expect(output).toContain("TOTAL CREDITOS");
		expect(output).toContain("REGISTROS:000002");
	});

	it("handles empty records array", () => {
		const output = formatDiario([], "2026-06", "20123456789");
		expect(output).toContain("REGISTROS:000000");
	});

	it("matches SUNAT 5.1 example format from spec", () => {
		const line = formatDiarioLine(sampleRecord);

		// From spec: 06|2026|20123456789  |ASIENTO-00001        |02|30/06/2026|...
		expect(line.startsWith("06|2026|")).toBe(true);
		expect(line.length).toBeGreaterThan(250); // 21 fields with separators

		// Verify all pipe separators are present
		const pipeCount = (line.match(/\|/g) || []).length;
		expect(pipeCount).toBe(20); // 21 fields = 20 pipes
	});
});
