import { describe, it, expect } from "vitest";
import { findBestAccount, PCGE_CATALOG } from "../pcge-catalog";

describe("PCGE Catalog", () => {
	it("has at least 15 accounts", () => {
		expect(PCGE_CATALOG.length).toBeGreaterThanOrEqual(15);
	});

	it("categorizes service invoices correctly", () => {
		const result = findBestAccount(
			"Servicio de consultoría mensual",
			"Proveedor SAC",
		);
		expect(result.account.code).toBe("7011.11");
		expect(result.confidence).toBeGreaterThanOrEqual(10);
	});

	it("categorizes utility bills correctly", () => {
		const result = findBestAccount("Recibo de luz julio 2026", "Luz del Sur");
		expect(result.account.code).toBe("6311.11");
	});

	it("categorizes salary payments correctly", () => {
		const result = findBestAccount("Planilla de remuneraciones", "Empresa SAC");
		expect(result.account.code).toBe("6211.11");
	});

	it("categorizes purchases correctly", () => {
		const result = findBestAccount(
			"Compra de útiles de oficina",
			"Papelería SAC",
		);
		expect(result.account.code).toBe("6011.11");
	});

	it("categorizes bank transfers correctly", () => {
		const result = findBestAccount("Transferencia bancaria proveedor", "BCP");
		expect(result.account.code).toBe("1041.11");
	});

	it("falls back to otros gastos for unknown descriptions", () => {
		const result = findBestAccount("zzzzdescripción irreconociblezzz");
		expect(result.account.code).toBe("6391.11");
		expect(result.confidence).toBeLessThan(50);
	});

	it("returns confidence below 50 for weak matches", () => {
		const result = findBestAccount("cosa rara sin sentido");
		expect(result.confidence).toBeLessThan(50);
	});
});
