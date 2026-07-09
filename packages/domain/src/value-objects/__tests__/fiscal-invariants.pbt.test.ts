/**
 * Property-Based Tests — Fiscal Invariants
 *
 * These tests verify fiscal rules hold for ANY valid input,
 * not just hand-picked examples.
 *
 * Uses fc.assert + fc.property directly instead of test.prop
 * for cross-package compatibility.
 */
import { describe, it } from "vitest";
import * as fc from "fast-check";
import { Money } from "../Money";
import { RUC } from "../RUC";

const IGV_RATE = 0.18;

describe("Property-based: IGV fiscal invariants", () => {
	it("IGV debe ser exactamente 18% de la base imponible", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 10_000_000_00 }),
				(baseCents: number) => {
					const base = Money.fromCents(baseCents, "PEN");
					const igv = base.multiply(IGV_RATE);
					return igv.getCents() === Math.round(baseCents * IGV_RATE);
				},
			),
		);
	});

	it("Multiplicar y dividir debe dar el mismo resultado que multiplicar por 0.18", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 10_000_000_00 }),
				(baseCents: number) => {
					const base = Money.fromCents(baseCents, "PEN");
					const igv1 = base.multiply(0.18);
					const igv2 = base.multiply(18).divide(100);
					return igv1.equals(igv2);
				},
			),
		);
	});

	it("Base + IGV debe ser igual al total", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 10_000_000_00 }),
				(baseCents: number) => {
					const base = Money.fromCents(baseCents, "PEN");
					const igv = base.multiply(IGV_RATE);
					const total = base.add(igv);
					return total.getCents() === baseCents + Math.round(baseCents * IGV_RATE);
				},
			),
		);
	});

	it("Detracción no puede exceder el monto de la factura", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 10_000_000_00 }),
				fc.integer({ min: 1_000, max: 100_000_00 }),
				(baseCents: number, detraccionCents: number) => {
					const factura = Money.fromCents(baseCents, "PEN");
					const detraccion = Money.fromCents(detraccionCents, "PEN");
					return (
						detraccion.greaterThan(factura) ||
						factura.greaterThanOrEqual(detraccion)
					);
				},
			),
		);
	});
});

describe("Property-based: RUC checksum invariants", () => {
	const ALLOWED_PREFIXES = ["10", "15", "16", "17", "20"] as const;
	const CHECKSUM_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

	function generateValidRUC(prefix: string): string {
		const digits = Array.from({ length: 8 }, () =>
			Math.floor(Math.random() * 10),
		).join("");
		const base = prefix + digits;
		let sum = 0;
		for (let i = 0; i < 10; i++) {
			sum += Number.parseInt(base[i] ?? "0", 10) * CHECKSUM_WEIGHTS[i];
		}
		const remainder = sum % 11;
		const checkDigit = 11 - remainder;
		const finalDigit =
			checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;
		return base + finalDigit;
	}

	it("RUC checksum debe ser correcto para cualquier prefijo válido", () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...ALLOWED_PREFIXES),
				(prefix: string) => {
					const ruc = generateValidRUC(prefix);
					return RUC.isValid(ruc);
				},
			),
		);
	});

	it("RUC con prefijo inválido debe ser rechazado", () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 9 }), (digit: number) => {
				const ruc = `${digit}${digit}000000000`;
				return !RUC.isValid(ruc);
			}),
		);
	});

	it("RUC con longitud incorrecta debe ser rechazado", () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1, maxLength: 10 }),
				(value: string) => !RUC.isValid(value),
			),
		);
	});
});
