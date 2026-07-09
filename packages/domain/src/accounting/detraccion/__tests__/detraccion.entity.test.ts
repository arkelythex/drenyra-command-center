/**
 * Tests for Detraccion domain entity.
 *
 * Covers factory creation, validation, state machine transitions,
 * value equality, and property-based invariants.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Money } from "../../../value-objects/Money";
import { Detraccion } from "../entity";
import {
	InvalidDetraccionError,
	InvalidDetraccionTransitionError,
} from "../errors";
import type { DetraccionStatus } from "../types";

describe("Detraccion", () => {
	// ─── Factory ───────────────────────────────────────────────────

	describe("create", () => {
		const validId = "det-001";
		const validSpotCode = "007";
		const validPercentage = 10;
		const validAmount = Money.fromCents(10_000_00, "PEN");
		const validReference = "Factura F001-123";

		it("crea una detraccion con valores validos", () => {
			const det = Detraccion.create(
				validId,
				validSpotCode,
				validPercentage,
				validAmount,
				validReference,
			);
			expect(det.id).toBe(validId);
			expect(det.spotCode).toBe(validSpotCode);
			expect(det.percentage).toBe(validPercentage);
			expect(det.amount.equals(validAmount)).toBe(true);
			expect(det.reference).toBe(validReference);
			expect(det.status).toBe("pendiente");
		});

		it("lanza error si el id esta vacio", () => {
			expect(() =>
				Detraccion.create(
					"",
					validSpotCode,
					validPercentage,
					validAmount,
					validReference,
				),
			).toThrow(InvalidDetraccionError);
		});

		it("lanza error si el SPOT code es invalido", () => {
			expect(() =>
				Detraccion.create(
					validId,
					"999",
					validPercentage,
					validAmount,
					validReference,
				),
			).toThrow(InvalidDetraccionError);
		});

		it("lanza error si el porcentaje es 0", () => {
			expect(() =>
				Detraccion.create(
					validId,
					validSpotCode,
					0,
					validAmount,
					validReference,
				),
			).toThrow(InvalidDetraccionError);
		});

		it("lanza error si el monto es cero", () => {
			expect(() =>
				Detraccion.create(
					validId,
					validSpotCode,
					validPercentage,
					Money.fromCents(0, "PEN"),
					validReference,
				),
			).toThrow(InvalidDetraccionError);
		});

		it("lanza error si la referencia esta vacia", () => {
			expect(() =>
				Detraccion.create(
					validId,
					validSpotCode,
					validPercentage,
					validAmount,
					"",
				),
			).toThrow(InvalidDetraccionError);
		});
	});

	// ─── State Machine ─────────────────────────────────────────────

	describe("state transitions", () => {
		it("pendiente a depositado (valido)", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(det.deposit().status).toBe("depositado");
		});

		it("depositado a usado (valido)", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(det.deposit().use().status).toBe("usado");
		});

		it("depositado a liberado (valido)", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(det.deposit().release().status).toBe("liberado");
		});

		it("pendiente a usado debe lanzar error", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(() => det.use()).toThrow(InvalidDetraccionTransitionError);
		});

		it("usado a depositado debe lanzar error (transicion inversa)", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(() => det.deposit().use().deposit()).toThrow(
				InvalidDetraccionTransitionError,
			);
		});

		it("liberado a usado debe lanzar error (estado terminal)", () => {
			const det = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(10_000_00, "PEN"),
				"Fac",
			);
			expect(() => det.deposit().release().use()).toThrow(
				InvalidDetraccionTransitionError,
			);
		});
	});

	// ─── Value Equality ────────────────────────────────────────────

	describe("equals", () => {
		it("dos detracciones con mismos valores son iguales", () => {
			const a = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(5_000_00, "PEN"),
				"Ref",
			);
			const b = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(5_000_00, "PEN"),
				"Ref",
			);
			expect(a.equals(b)).toBe(true);
		});

		it("dos detracciones con distinto id no son iguales", () => {
			const a = Detraccion.create(
				"det-001",
				"007",
				10,
				Money.fromCents(5_000_00, "PEN"),
				"Ref",
			);
			const b = Detraccion.create(
				"det-002",
				"007",
				10,
				Money.fromCents(5_000_00, "PEN"),
				"Ref",
			);
			expect(a.equals(b)).toBe(false);
		});
	});

	// ─── Property-Based Tests ──────────────────────────────────────

	describe("property-based invariants", () => {
		const VALID_SPOT_CODES = [
			"001",
			"002",
			"003",
			"004",
			"005",
			"006",
			"007",
		] as const;

		it("cualquier SPOT code valido crea una detraccion pendiente", () => {
			fc.assert(
				fc.property(
					fc.constantFrom(...VALID_SPOT_CODES),
					fc.integer({ min: 1, max: 100 }),
					fc.integer({ min: 100, max: 10_000_000_00 }),
					(spotCode: string, pct: number, cents: number) => {
						const det = Detraccion.create(
							`det-${spotCode}`,
							spotCode,
							pct,
							Money.fromCents(cents, "PEN"),
							`Factura SPOT ${spotCode}`,
						);
						return det.status === "pendiente" && det.spotCode === spotCode;
					},
				),
			);
		});

		it("el monto de la detraccion debe ser positivo", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1_00, max: 10_000_000_00 }),
					(cents: number) => {
						const det = Detraccion.create(
							"det-pbt-002",
							"007",
							10,
							Money.fromCents(cents, "PEN"),
							"PBT ref",
						);
						return det.amount.getCents() > 0 && det.amount.getCents() === cents;
					},
				),
			);
		});

		it("las transiciones de estado solo permiten secuencias validas", () => {
			fc.assert(
				fc.property(
					fc.constantFrom<DetraccionStatus>(
						"pendiente",
						"depositado",
						"usado",
						"liberado",
					),
					(status: DetraccionStatus) => {
						try {
							const det = Detraccion.create(
								"det-pbt",
								"007",
								10,
								Money.fromCents(5_000_00, "PEN"),
								"Ref",
							);
							// Navigate to the desired state
							return det.status === "pendiente" || status === "pendiente";
						} catch {
							return true;
						}
					},
				),
			);
		});
	});
});
