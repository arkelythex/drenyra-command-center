import { describe, expect, it } from "vitest";
import { buildPdt621, type Pdt621Input } from "../pdt-621.service";

const validInput: Pdt621Input = {
	ruc: "20123456789",
	period: "2026-04",
	razonSocial: "EMPRESA TEST SAC",
	ventasGravadasBase: 10000,
	ventasGravadasIgv: 1800,
	comprasGravadasBase: 5000,
	comprasGravadasIgv: 900,
	percepciones: 0,
	retenciones: 0,
};

describe("PDT 621 — buildPdt621", () => {
	it("calculates standard input correctly", () => {
		const result = buildPdt621(validInput);

		expect(result.casillas["100"]).toBe(10000);
		expect(result.casillas["105"]).toBe(1800);
		expect(result.casillas["120"]).toBe(5000);
		expect(result.casillas["125"]).toBe(900);
		expect(result.casillas["185"]).toBe(900);
		expect(result.igvResultante).toBe(900);
		expect(result.status).toBe("a_pagar");
		expect(result.warnings).toHaveLength(0);
	});

	it("fires IGV consistency warning when declared differs by more than ±2", () => {
		const result = buildPdt621({
			...validInput,
			ventasGravadasIgv: 1795, // should be 1800, diff=5 > 2
		});

		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("difiere del calculado");
		expect(result.warnings[0]).toContain("ventas");
		expect(result.casillas["105"]).toBe(1795);
	});

	it("does not warn when IGV is within tolerance (±2)", () => {
		const result = buildPdt621({
			...validInput,
			ventasGravadasIgv: 1801, // diff=1 ≤ 2
		});

		expect(result.warnings).toHaveLength(0);
	});

	it("warns on both sales AND purchases IGV mismatch", () => {
		const result = buildPdt621({
			...validInput,
			ventasGravadasIgv: 1795,
			comprasGravadasIgv: 895,
		});

		expect(result.warnings).toHaveLength(2);
		expect(result.warnings[0]).toContain("difiere del calculado");
		expect(result.warnings[0]).toContain("ventas");
		expect(result.warnings[1]).toContain("difiere del calculado");
		expect(result.warnings[1]).toContain("compras");
	});

	it("reduces tributo resultante with percepciones and retenciones", () => {
		const result = buildPdt621({
			...validInput,
			percepciones: 50,
			retenciones: 30,
		});

		expect(result.casillas["185"]).toBe(820); // 1800-900-50-30
	});

	it("returns saldo_a_favor when IGV resultante is negative", () => {
		const result = buildPdt621({
			...validInput,
			ventasGravadasIgv: 500,
			comprasGravadasIgv: 1500,
		});

		expect(result.igvResultante).toBe(-1000);
		expect(result.status).toBe("saldo_a_favor");
	});

	it("returns equilibrado when IGV resultante is zero", () => {
		const result = buildPdt621({
			...validInput,
			ventasGravadasIgv: 1000,
			comprasGravadasIgv: 1000,
		});

		expect(result.igvResultante).toBe(0);
		expect(result.status).toBe("equilibrado");
	});

	describe("threshold boundaries", () => {
		const base = {
			ruc: "20123456789",
			period: "2026-04",
			razonSocial: "TEST",
			ventasGravadasBase: 0,
			comprasGravadasBase: 0,
		};

		it("a_pagar threshold: 0.51 → a_pagar", () => {
			const result = buildPdt621({
				...base,
				ventasGravadasIgv: 1000.51,
				comprasGravadasIgv: 1000,
			});
			expect(result.status).toBe("a_pagar");
		});

		it("equilibrado threshold: 0.50 → equilibrado", () => {
			const result = buildPdt621({
				...base,
				ventasGravadasIgv: 1000.5,
				comprasGravadasIgv: 1000,
			});
			expect(result.status).toBe("equilibrado");
		});

		it("saldo_a_favor threshold: -0.51 → saldo_a_favor", () => {
			const result = buildPdt621({
				...base,
				ventasGravadasIgv: 1000,
				comprasGravadasIgv: 1000.51,
			});
			expect(result.status).toBe("saldo_a_favor");
		});

		it("equilibrado negative threshold: -0.50 → equilibrado", () => {
			const result = buildPdt621({
				...base,
				ventasGravadasIgv: 1000,
				comprasGravadasIgv: 1000.5,
			});
			expect(result.status).toBe("equilibrado");
		});
	});

	describe("zod schema", () => {
		it("rejects invalid RUC (wrong length)", () => {
			expect(() => buildPdt621({ ...validInput, ruc: "123" })).toThrow();
		});

		it("rejects invalid period format", () => {
			expect(() => buildPdt621({ ...validInput, period: "2026-13" })).toThrow();
		});

		it("rejects negative amounts", () => {
			expect(() =>
				buildPdt621({ ...validInput, ventasGravadasBase: -100 }),
			).toThrow();
		});

		it("rejects missing required fields", () => {
			expect(() =>
				buildPdt621({
					...validInput,
					ventasGravadasBase: undefined as unknown as number,
				}),
			).toThrow();
		});
	});

	describe("default values", () => {
		it("defaults omitted optional fields to 0", () => {
			const input = {
				ruc: "20123456789",
				period: "2026-04",
				razonSocial: "TEST",
				ventasGravadasBase: 1000,
				ventasGravadasIgv: 180,
				comprasGravadasBase: 500,
				comprasGravadasIgv: 90,
			};

			const result = buildPdt621(input);
			expect(result.casillas["107"]).toBe(0); // percepciones default
			expect(result.casillas["169"]).toBe(0); // retenciones default
		});
	});

	it("handles zero-amount input (no activity period)", () => {
		const result = buildPdt621({
			ruc: "20123456789",
			period: "2026-04",
			razonSocial: "TEST",
			ventasGravadasBase: 0,
			ventasGravadasIgv: 0,
			comprasGravadasBase: 0,
			comprasGravadasIgv: 0,
		});

		expect(result.status).toBe("equilibrado");
		expect(result.warnings).toHaveLength(0);
	});
});
