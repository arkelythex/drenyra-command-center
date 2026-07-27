import { describe, expect, it } from "vitest";
import { formatMayorLine, formatMayor } from "../../application/generators/ple-mayor.formatter";
import { formatComprasLine, formatCompras } from "../../application/generators/ple-compras.formatter";
import { formatVentasLine, formatVentas } from "../../application/generators/ple-ventas.formatter";
import { validateStructural, validateAccounting } from "../../application/services/ple-validator.service";
import { padField, formatRecord, amountToCents } from "../../application/generators/ple-formatter.utils";
import type { PleMayorRecord, PleComprasRecord, PleVentasRecord } from "../../domain/ple.types";

describe("PLE Formatter Utilities", () => {
	it("padField left-pads numbers", () => {
		expect(padField("120000", 12, true)).toBe("000000120000");
	});
	it("padField right-pads strings", () => {
		expect(padField("test", 6)).toBe("test  ");
	});
	it("padField handles null/undefined", () => {
		expect(padField(null, 5)).toBe("     ");
		expect(padField(undefined, 5)).toBe("     ");
	});
	it("amountToCents converts decimal string", () => {
		expect(amountToCents("1500.00")).toBe("000000150000");
	});
	it("amountToCents handles null", () => {
		expect(amountToCents(null)).toBe("000000000000");
	});
	it("formatRecord joins fields with pipes", () => {
		const result = formatRecord([["AB", 2], ["CD", 2]]);
		expect(result).toBe("AB|CD");
	});
});

describe("PLE Mayor Formatter", () => {
	const sample: PleMayorRecord = {
		period: "06", fiscalYear: "2026", ruc: "20123456789",
		accountCode: "601000", accountDescription: "GASTOS DE PERSONAL",
		openingDebitCents: "000000000000", openingCreditCents: "000000000000",
		monthlyDebitsCents: "000000120000", monthlyCreditsCents: "000000000000",
		closingDebitCents: "000000120000", closingCreditCents: "000000000000",
		state: "1",
	};

	it("produces correct fixed-width line", () => {
		const line = formatMayorLine(sample);
		const fields = line.split("|");
		expect(fields).toHaveLength(12);
		expect(fields[0]?.trim()).toBe("06");
		expect(fields[3]?.trim()).toBe("601000");
	});

	it("generates complete file", () => {
		const output = formatMayor([sample], "2026-06", "20123456789");
		expect(output).toContain("|LIBRO MAYOR|");
		expect(output).toContain("REGISTROS:000001");
	});
});

describe("PLE Compras Formatter", () => {
	const sample: PleComprasRecord = {
		period: "06", fiscalYear: "2026", ruc: "20123456789",
		operationDate: "15/06/2026", issueDate: "15/06/2026", dueDate: "15/07/2026",
		documentType: "01", documentSeries: "F001", documentNumber: "00001234",
		supplierRuc: "10765432101", supplierName: "PROVEEDOR SAC",
		taxablePurchases: "000000100000", igvBase: "000000100000",
		igvAmount: "000000018000", nonTaxablePurchases: "000000000000",
		totalPurchases: "000000100000", iscAmount: "000000000000",
		detractionAmount: "000000000000", retentionAmount: "000000000000",
		totalAmount: "000000118000", currencyCode: "PEN       ",
		exchangeRate: "0000010000", state: "1",
	};

	it("produces correct fixed-width line", () => {
		const line = formatComprasLine(sample);
		const fields = line.split("|");
		expect(fields).toHaveLength(23);
		expect(fields[9]?.trim()).toBe("10765432101");
	});

	it("generates complete file with IGV summary", () => {
		const output = formatCompras([sample], "2026-06", "20123456789");
		expect(output).toContain("|REGISTRO DE COMPRAS|");
		expect(output).toContain("TOTAL IGV");
	});
});

describe("PLE Ventas Formatter", () => {
	const sample: PleVentasRecord = {
		period: "06", fiscalYear: "2026", ruc: "20123456789",
		operationDate: "15/06/2026", issueDate: "15/06/2026", dueDate: "15/07/2026",
		documentType: "01", documentSeries: "F001", documentNumber: "00001234",
		customerRuc: "20123456789", customerName: "CLIENTE SA",
		taxableSales: "000000100000", igvBase: "000000100000",
		igvAmount: "000000018000", exports: "000000000000",
		nonTaxableSales: "000000000000", iscAmount: "000000000000",
		discounts: "000000000000", totalAmount: "000000118000",
		currencyCode: "PEN       ", exchangeRate: "0000010000", state: "1",
	};

	it("produces correct fixed-width line", () => {
		const line = formatVentasLine(sample);
		const fields = line.split("|");
		expect(fields).toHaveLength(22);
		expect(fields[9]?.trim()).toBe("20123456789");
	});

	it("generates complete file with IGV summary", () => {
		const output = formatVentas([sample], "2026-06", "20123456789");
		expect(output).toContain("|REGISTRO DE VENTAS|");
		expect(output).toContain("TOTAL IGV");
	});
});

describe("PLE Validator", () => {
	it("validates valid content", () => {
		const content = "06|2026|20123456789   |ASIENTO-00001       |02|30/06/2026|30/06/2026|601000    |GASTOS DE PERSONAL                      |01|000000120000|000000000000|01        |000000120000|000000000000|          |PAGO DE PLANILLA JUNIO 2026             |  |F001-00001234       |30/06/2026|1";
		const result = validateStructural(content, "LE-DIARIO");
		expect(result.valid).toBe(true);
	});

	it("rejects empty content", () => {
		const result = validateStructural("", "LE-DIARIO");
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.message).toContain("empty");
	});

	it("validates accounting: debit and credit cannot both be >0", () => {
		const content = "06|2026|RUC|VOUCHER|02|30/06/2026|30/06/2026|ACC|DESC|01|000000100000|000000050000|01|000000100000|000000000000|          |GLOSS|  |DOC|30/06/2026|1";
		const result = validateAccounting(content, "LE-DIARIO");
		expect(result.valid).toBe(false);
	});
});
