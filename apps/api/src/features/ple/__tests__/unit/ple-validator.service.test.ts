/**
 * PLE Validation — Unit Tests
 *
 * Tests for PLE book validation: format checks, fiscal consistency,
 * totals verification, and RUC validation.
 */
import { describe, expect, it } from "vitest";
import { PleValidator } from "../../ple-validator.service";

// ─── Format Validation ─────────────────────────────────────────────

describe("PleValidator — format validation", () => {
	it("accepts valid pipe-delimited LE-DIARIO content", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Compra de mercadería|601100|1000.00|0.00",
			"2026-03-15|Compra de mercadería|421200|0.00|1000.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("rejects empty content", () => {
		const result = PleValidator.validate("LE-DIARIO", "");

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].code).toBe("EMPTY_CONTENT");
	});

	it("rejects content without header", () => {
		const content = "2026-03-15|Test|601100|100.00|0.00";
		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "MISSING_HEADER")).toBe(true);
	});

	it("rejects content with mismatched RUC in header", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Test|601100|100.00|0.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content, {
			expectedRuc: "99999999999",
		});

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "RUC_MISMATCH")).toBe(true);
	});
});

// ─── Fiscal Consistency ────────────────────────────────────────────

describe("PleValidator — fiscal consistency", () => {
	it("validates LE-DIARIO debit equals credit", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Asiento 1|601100|1000.00|0.00",
			"2026-03-15|Asiento 1|421200|0.00|500.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "DEBIT_CREDIT_MISMATCH")).toBe(
			true,
		);
	});

	it("accepts LE-DIARIO with balanced debits and credits", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Asiento 1|601100|1000.00|0.00",
			"2026-03-15|Asiento 1|421200|0.00|1000.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(true);
	});

	it("validates LE-COMPRAS IGV consistency", () => {
		const content = [
			"20123456786|2026-03|LE-COMPRAS",
			"20100066613|PROVEEDOR SAC|01|F001|00001234|2026-03-15|1000.00|180.00|1180.00",
			"20100066613|PROVEEDOR SAC|01|F001|00001235|2026-03-16|1000.00|200.00|1200.00",
		].join("\n");

		const result = PleValidator.validate("LE-COMPRAS", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "IGV_CONSISTENCY_ERROR")).toBe(
			true,
		);
	});

	it("validates LE-VENTAS IGV consistency", () => {
		const content = [
			"20123456786|2026-03|LE-VENTAS",
			"20100066613|CLIENTE SAC|01|F001|00005678|2026-03-15|2000.00|360.00|2360.00",
		].join("\n");

		const result = PleValidator.validate("LE-VENTAS", content);

		expect(result.valid).toBe(true);
	});
});

// ─── Date Validation ───────────────────────────────────────────────

describe("PleValidator — date validation", () => {
	it("rejects lines with invalid dates", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"invalid-date|Test|601100|100.00|0.00",
			"invalid-date|Test|421200|0.00|100.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
	});

	it("warns when dates are outside the period", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2025-01-15|Test|601100|100.00|0.00",
			"2025-01-15|Test|421200|0.00|100.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.warnings.some((w) => w.code === "DATE_OUTSIDE_PERIOD")).toBe(
			true,
		);
	});
});

// ─── Amount Validation ─────────────────────────────────────────────

describe("PleValidator — amount validation", () => {
	it("rejects negative amounts", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Test|601100|-100.00|0.00",
			"2026-03-15|Test|421200|0.00|-100.00",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "NEGATIVE_AMOUNT")).toBe(true);
	});

	it("rejects non-numeric amounts", () => {
		const content = [
			"20123456786|2026-03|LE-DIARIO",
			"2026-03-15|Test|601100|abc|0.00",
			"2026-03-15|Test|421200|0.00|abc",
		].join("\n");

		const result = PleValidator.validate("LE-DIARIO", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "INVALID_AMOUNT")).toBe(true);
	});
});

// ─── LE-MAYOR Validation ───────────────────────────────────────────

describe("PleValidator — LE-MAYOR", () => {
	it("validates correct LE-MAYOR content", () => {
		const content = [
			"20123456786|2026-03|LE-MAYOR",
			"101100|Caja|5000.00|1000.00|200.00|5800.00",
			"421200|Proveedores|0.00|0.00|3000.00|-3000.00",
		].join("\n");

		const result = PleValidator.validate("LE-MAYOR", content);

		expect(result.valid).toBe(true);
	});

	it("validates LE-MAYOR balance formula", () => {
		// saldo_actual = saldo_anterior + debe - haber
		const content = [
			"20123456786|2026-03|LE-MAYOR",
			"101100|Caja|5000.00|1000.00|200.00|9999.99", // wrong: 5000+1000-200=5800, not 9999.99
		].join("\n");

		const result = PleValidator.validate("LE-MAYOR", content);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "BALANCE_MISMATCH")).toBe(true);
	});
});

// ─── Book Type Validation ──────────────────────────────────────────

describe("PleValidator — book type", () => {
	it("rejects invalid book type", () => {
		expect(() => PleValidator.validate("INVALID" as never, "content")).toThrow(
			/book type/i,
		);
	});

	it("validates all four book types", () => {
		const diarioContent = "20123456786|2026-03|LE-DIARIO\n";
		const mayorContent = "20123456786|2026-03|LE-MAYOR\n";
		const comprasContent = "20123456786|2026-03|LE-COMPRAS\n";
		const ventasContent = "20123456786|2026-03|LE-VENTAS\n";

		expect(PleValidator.validate("LE-DIARIO", diarioContent).valid).toBe(true);
		expect(PleValidator.validate("LE-MAYOR", mayorContent).valid).toBe(true);
		expect(PleValidator.validate("LE-COMPRAS", comprasContent).valid).toBe(
			true,
		);
		expect(PleValidator.validate("LE-VENTAS", ventasContent).valid).toBe(true);
	});
});
