import { describe, expect, it } from "vitest";
import { isValidPeriod, isValidRuc, PreflightValidator } from "../preflight";

describe("isValidRuc", () => {
	it("validates a correct RUC (Módulo 11)", () => {
		// RUC 20123456786: prefijo 20, dígito verificador 6
		expect(isValidRuc("20123456786")).toBe(true);
	});

	it("rejects RUC with wrong length", () => {
		expect(isValidRuc("1234567890")).toBe(false);
		expect(isValidRuc("123456789012")).toBe(false);
	});

	it("rejects RUC with invalid prefix", () => {
		expect(isValidRuc("30123456786")).toBe(false);
		expect(isValidRuc("00123456786")).toBe(false);
	});

	it("rejects RUC with non-numeric characters", () => {
		expect(isValidRuc("20A1234567A")).toBe(false);
	});

	it("rejects empty RUC", () => {
		expect(isValidRuc("")).toBe(false);
	});
});

describe("isValidPeriod", () => {
	it("validates a correct period format", () => {
		expect(isValidPeriod("2026-07")).toBe(true);
	});

	it("rejects invalid month", () => {
		expect(isValidPeriod("2026-13")).toBe(false);
		expect(isValidPeriod("2026-00")).toBe(false);
	});

	it("rejects missing zero padding", () => {
		expect(isValidPeriod("2026-1")).toBe(false);
	});

	it("rejects empty period", () => {
		expect(isValidPeriod("")).toBe(false);
	});

	it("rejects non-numeric year", () => {
		expect(isValidPeriod("abcd-07")).toBe(false);
	});
});

describe("PreflightValidator", () => {
	it("passes with valid scope", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "20123456786",
			period: "2026-07",
		});

		expect(result.passed).toBe(true);
		expect(result.blocked).toBe(false);
	});

	it("blocks on invalid RUC", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "12345678901",
			period: "2026-07",
		});

		expect(result.passed).toBe(false);
		expect(result.blocked).toBe(true);
		expect(result.reasons[0]).toContain("RUC inválido");
	});

	it("blocks on empty RUC", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "",
			period: "2026-07",
		});

		expect(result.passed).toBe(false);
		expect(result.blocked).toBe(true);
	});

	it("blocks on invalid period", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "20123456786",
			period: "2026-13",
		});

		expect(result.passed).toBe(false);
		expect(result.blocked).toBe(true);
		expect(result.reasons[0]).toContain("período");
	});

	it("blocks on empty period", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "20123456786",
			period: "",
		});

		expect(result.passed).toBe(false);
		expect(result.blocked).toBe(true);
	});

	it("blocks on missing organization or company IDs", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "",
			companyId: "",
			companyRuc: "20123456786",
			period: "2026-07",
		});

		expect(result.passed).toBe(false);
		expect(result.blocked).toBe(true);
		expect(result.reasons.some((r) => r.includes("organizationId"))).toBe(true);
	});

	it("returns warnings for artifact store checks when no store available", async () => {
		const validator = new PreflightValidator();
		const result = await validator.validate("cambio-001", {
			organizationId: "org-1",
			companyId: "comp-1",
			companyRuc: "20123456786",
			period: "2026-07",
		});

		expect(result.warnings.length).toBeGreaterThanOrEqual(1);
	});
});
