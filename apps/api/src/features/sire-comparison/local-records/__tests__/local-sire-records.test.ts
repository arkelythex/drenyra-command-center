import { describe, expect, it } from "vitest";
import {
	decimalToCents,
	documentTypeFromSeries,
	periodBounds,
	toPurchaseRecord,
	toSalesRecord,
} from "../local-sire-records";

describe("decimalToCents", () => {
	it("converts DB decimal strings to integer cents without float drift", () => {
		expect(decimalToCents("1180.00")).toBe(118000);
		expect(decimalToCents("0.10")).toBe(10);
		expect(decimalToCents("0.29")).toBe(29);
		expect(decimalToCents("1234567.5")).toBe(123456750);
		expect(decimalToCents("100")).toBe(10000);
		expect(decimalToCents("-15.25")).toBe(-1525);
		expect(decimalToCents(" 7.05 ")).toBe(705);
	});

	it("treats a missing amount as zero", () => {
		expect(decimalToCents(null)).toBe(0);
		expect(decimalToCents(undefined)).toBe(0);
	});

	it("rejects amounts that are not money", () => {
		expect(() => decimalToCents("1.234")).toThrow(/monto inválido/);
		expect(() => decimalToCents("abc")).toThrow(/monto inválido/);
		expect(() => decimalToCents("1e3")).toThrow(/monto inválido/);
		expect(() => decimalToCents("")).toThrow(/monto inválido/);
	});
});

describe("documentTypeFromSeries", () => {
	it("maps SUNAT series prefixes to the comprobante type", () => {
		expect(documentTypeFromSeries("F001")).toBe("01");
		expect(documentTypeFromSeries("f002")).toBe("01");
		expect(documentTypeFromSeries("E001")).toBe("01");
		expect(documentTypeFromSeries("B001")).toBe("03");
		expect(documentTypeFromSeries("b010")).toBe("03");
	});
});

describe("periodBounds", () => {
	it("covers the whole month, last day included", () => {
		const { start, end } = periodBounds("2025-01");
		expect(start.toISOString()).toBe("2025-01-01T00:00:00.000Z");
		expect(end.toISOString()).toBe("2025-02-01T00:00:00.000Z");
	});

	it("rolls December over to the next year", () => {
		const { start, end } = periodBounds("2025-12");
		expect(start.toISOString()).toBe("2025-12-01T00:00:00.000Z");
		expect(end.toISOString()).toBe("2026-01-01T00:00:00.000Z");
	});

	it("rejects malformed periods", () => {
		expect(() => periodBounds("2025-13")).toThrow(/periodo inválido/);
		expect(() => periodBounds("202501")).toThrow(/periodo inválido/);
	});
});

describe("toSalesRecord (RVIE)", () => {
	const invoice = {
		series: "F001",
		correlative: 1234,
		issueDate: new Date("2025-01-10T15:30:00.000Z"),
		currency: "PEN",
		subtotal: "1000.00",
		igvAmount: "180.00",
		totalAmount: "1180.00",
		status: "SENT",
		customerName: "CLIENTE A S.A.C.",
	};

	it("maps an invoice to the SIRE record keyed by the company's own RUC", () => {
		expect(toSalesRecord(invoice, "2025-01", "20100000001")).toEqual({
			periodo: "202501",
			caratula: "RVIE",
			rucEmisor: "20100000001",
			razonSocial: "CLIENTE A S.A.C.",
			tipoComprobante: "01",
			serie: "F001",
			numero: "1234",
			fechaEmision: "2025-01-10",
			moneda: "PEN",
			baseImponible: 100000,
			igv: 18000,
			total: 118000,
			estado: "ACTIVO",
			origen: "ARKELYTHEX",
		});
	});

	it("marks cancelled invoices as ANULADO and boletas as type 03", () => {
		const record = toSalesRecord(
			{ ...invoice, series: "B001", status: "CANCELLED" },
			"2025-01",
			"20100000001",
		);
		expect(record.estado).toBe("ANULADO");
		expect(record.tipoComprobante).toBe("03");
	});
});

describe("toPurchaseRecord (RCE)", () => {
	const bill = {
		billNumber: "F002-00000567",
		issueDate: new Date("2025-01-31T23:00:00.000Z"),
		currency: "USD",
		subtotalAmount: "500.00",
		igvAmount: "90.00",
		totalAmount: "590.00",
		status: "PAID",
		vendorTaxId: "20200000002",
		vendorName: "PROVEEDOR B E.I.R.L.",
	};

	it("maps a bill to the SIRE record keyed by the supplier's RUC", () => {
		expect(toPurchaseRecord(bill, "2025-01")).toEqual({
			periodo: "202501",
			caratula: "RCE",
			rucEmisor: "20200000002",
			razonSocial: "PROVEEDOR B E.I.R.L.",
			tipoComprobante: "01",
			serie: "F002",
			numero: "00000567",
			fechaEmision: "2025-01-31",
			moneda: "USD",
			baseImponible: 50000,
			igv: 9000,
			total: 59000,
			estado: "ACTIVO",
			origen: "ARKELYTHEX",
		});
	});

	it("keeps the whole bill number when it has no series separator", () => {
		const record = toPurchaseRecord(
			{ ...bill, billNumber: "12345" },
			"2025-01",
		);
		expect(record.serie).toBe("");
		expect(record.numero).toBe("12345");
	});
});
