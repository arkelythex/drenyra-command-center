import { describe, expect, it } from "vitest";
import {
	parseStatementAmount,
	parseStatementCsv,
	parseStatementDate,
} from "../statement-csv";

describe("parseStatementAmount", () => {
	it.each([
		["80", 8000],
		["80.5", 8050],
		["1,234.56", 123456],
		["1.234,56", 123456],
		["1.234.567,89", 123456789],
		["S/ -80.00", -8000],
		["(80.00)", -8000],
		["80.00-", -8000],
		["100.0000", 10000],
		["0.10", 10],
		["1,234,567", 123456700],
	])("%s → %i cents", (raw, cents) => {
		expect(parseStatementAmount(raw)).toBe(cents);
	});

	it.each(["", "abc", "80.005", "100.0050", "1,23,4", "1,234", "12.34.56"])(
		"refuses %s",
		(raw) => {
			expect(parseStatementAmount(raw)).toBeNull();
		},
	);

	it("never goes through a float", () => {
		expect(parseStatementAmount("0.29")).toBe(29);
		expect(parseStatementAmount("1.15")).toBe(115);
	});
});

describe("parseStatementDate", () => {
	it.each([
		["31/01/2026", "2026-01-31"],
		["1-2-26", "2026-02-01"],
		["2026-01-31", "2026-01-31"],
		["2026-01-31T00:00:00", "2026-01-31"],
	])("%s → %s", (raw, iso) => {
		expect(parseStatementDate(raw)).toBe(iso);
	});

	it.each(["31/02/2026", "Saldo final", ""])("refuses %s", (raw) => {
		expect(parseStatementDate(raw)).toBeNull();
	});
});

describe("parseStatementCsv", () => {
	it("reads a signed amount column below a bank preamble", () => {
		const csv = [
			"Banco de Crédito del Perú",
			"Cuenta;191-0000000-0-00",
			"",
			"Fecha;Descripción;Monto;Nro. Operación",
			"10/09/2026;ABONO F001-77;1.180,00;000123",
			"11/09/2026;COMISION MANTENIMIENTO;-12,50;",
			"Saldo final;;1.167,50;",
		].join("\n");

		const parsed = parseStatementCsv(csv);

		expect(parsed.rows).toEqual([
			{
				date: "2026-09-10",
				description: "ABONO F001-77",
				reference: "000123",
				type: "CREDIT",
				amountCents: 118000,
			},
			{
				date: "2026-09-11",
				description: "COMISION MANTENIMIENTO",
				type: "DEBIT",
				amountCents: 1250,
			},
		]);
		expect(parsed.errors).toEqual([
			{ line: 7, message: 'fecha ilegible "Saldo final"' },
		]);
		expect(parsed.creditCents).toBe(118000);
		expect(parsed.debitCents).toBe(1250);
	});

	it("reads separate debit and credit columns", () => {
		const csv = [
			"fecha,concepto,cargo,abono,referencia",
			'2026-09-01,PAGO PROVEEDOR,"1,500.00",,OP-9',
			"2026-09-02,DEPOSITO,,250.00,",
		].join("\n");

		const parsed = parseStatementCsv(csv);

		expect(parsed.errors).toEqual([]);
		expect(parsed.rows.map((r) => [r.type, r.amountCents])).toEqual([
			["DEBIT", 150000],
			["CREDIT", 25000],
		]);
	});

	it("uses a type column when amounts are unsigned", () => {
		const csv = [
			"date,description,amount,type",
			"2026-09-01,FEE,5.00,D",
			"2026-09-02,TRANSFER,100.00,ABONO",
			"2026-09-03,ODD,1.00,X",
		].join("\n");

		const parsed = parseStatementCsv(csv);

		expect(parsed.rows.map((r) => r.type)).toEqual(["DEBIT", "CREDIT"]);
		expect(parsed.errors).toEqual([
			{ line: 4, message: 'tipo desconocido "X"' },
		]);
	});

	it("says so when there is no header row", () => {
		const parsed = parseStatementCsv("a,b,c\n1,2,3");

		expect(parsed.rows).toEqual([]);
		expect(parsed.errors[0]?.message).toMatch(/encabezados/);
	});
});
