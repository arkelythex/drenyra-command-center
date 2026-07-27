/**
 * CompensatingEntry Unit Tests
 *
 * @module domain/entities/journal-entry
 */

import { describe, expect, it } from "vitest";
import { CompensatingEntry } from "../compensating-entry";
import type { CompensatingEntryType } from "../compensating-entry";

const VALID_ID = "cmp-entry-001";
const VALID_ORG = 42;
const VALID_ORIGINAL = "journal-entry-original-001";
const VALID_COMPENSATING = "journal-entry-compensating-001";
const VALID_REASON = "Error en el monto del IGV, se corrige asiento original";
const VALID_AUTHORIZER = "user-contador-001";

function validProps(overrides: Record<string, unknown> = {}) {
	return {
		id: VALID_ID,
		organizationId: VALID_ORG,
		originalEntryId: VALID_ORIGINAL,
		compensatingEntryId: VALID_COMPENSATING,
		type: "correction" as CompensatingEntryType,
		reason: VALID_REASON,
		authorizedBy: VALID_AUTHORIZER,
		...overrides,
	};
}

describe("CompensatingEntry", () => {
	describe("create", () => {
		it("should create a compensating entry with valid props", () => {
			const entry = CompensatingEntry.create(validProps());

			expect(entry).toBeDefined();
			expect(entry.id).toBe(VALID_ID);
			expect(entry.organizationId).toBe(VALID_ORG);
			expect(entry.originalEntryId).toBe(VALID_ORIGINAL);
			expect(entry.compensatingEntryId).toBe(VALID_COMPENSATING);
			expect(entry.type).toBe("correction");
			expect(entry.reason).toBe(VALID_REASON);
			expect(entry.authorizedBy).toBe(VALID_AUTHORIZER);
			expect(entry.createdAt).toBeInstanceOf(Date);
		});

		it("should default createdAt to now", () => {
			const before = new Date();
			const entry = CompensatingEntry.create(validProps());
			const after = new Date();

			expect(entry.createdAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(entry.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it("should accept explicit createdAt", () => {
			const past = new Date("2026-01-15");
			const entry = CompensatingEntry.create(validProps({ createdAt: past }));

			expect(entry.createdAt.getTime()).toBe(past.getTime());
		});

		it("should create a reversal type", () => {
			const entry = CompensatingEntry.create(
				validProps({ type: "reversal" as CompensatingEntryType }),
			);
			expect(entry.type).toBe("reversal");
		});

		it("should create an adjustment type", () => {
			const entry = CompensatingEntry.create(
				validProps({ type: "adjustment" as CompensatingEntryType }),
			);
			expect(entry.type).toBe("adjustment");
		});
	});

	describe("validation", () => {
		it("should reject empty id", () => {
			expect(() => CompensatingEntry.create(validProps({ id: "" }))).toThrow(
				"El ID del asiento compensatorio es requerido",
			);
		});

		it("should reject zero organizationId", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ organizationId: 0 })),
			).toThrow("La organización es requerida");
		});

		it("should reject empty originalEntryId", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ originalEntryId: "" })),
			).toThrow("El ID del asiento original es requerido");
		});

		it("should reject empty compensatingEntryId", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ compensatingEntryId: "" })),
			).toThrow("El ID del asiento compensatorio es requerido");
		});

		it("should reject self-referential entries", () => {
			expect(() =>
				CompensatingEntry.create(
					validProps({
						originalEntryId: "same-id",
						compensatingEntryId: "same-id",
					}),
				),
			).toThrow("no puede ser el mismo que el original");
		});

		it("should reject invalid type", () => {
			expect(() =>
				CompensatingEntry.create(
					validProps({ type: "invalid" as CompensatingEntryType }),
				),
			).toThrow("Tipo de compensación inválido");
		});

		it("should reject short reason", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ reason: "Corto" })),
			).toThrow("al menos 10 caracteres");
		});

		it("should reject empty reason", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ reason: "" })),
			).toThrow("al menos 10 caracteres");
		});

		it("should reject empty authorizedBy", () => {
			expect(() =>
				CompensatingEntry.create(validProps({ authorizedBy: "" })),
			).toThrow("El autorizador es requerido");
		});

		it("should reject future createdAt", () => {
			const future = new Date(Date.now() + 86400000); // Tomorrow
			expect(() =>
				CompensatingEntry.create(validProps({ createdAt: future })),
			).toThrow("La fecha de creación no puede ser futura");
		});
	});

	describe("equals", () => {
		it("should return true for same id", () => {
			const a = CompensatingEntry.create(validProps());
			const b = CompensatingEntry.create(validProps());

			expect(a.equals(b)).toBe(true);
		});

		it("should return false for different ids", () => {
			const a = CompensatingEntry.create(validProps());
			const b = CompensatingEntry.create(validProps({ id: "other-id" }));

			expect(a.equals(b)).toBe(false);
		});

		it("should return false for null/undefined", () => {
			const a = CompensatingEntry.create(validProps());

			expect(a.equals(null)).toBe(false);
			expect(a.equals(undefined)).toBe(false);
		});
	});

	describe("immutability", () => {
		it("should be frozen", () => {
			const entry = CompensatingEntry.create(validProps());

			expect(Object.isFrozen(entry)).toBe(true);
		});

		it("toJSON should return serialized representation", () => {
			const entry = CompensatingEntry.create(validProps());
			const json = entry.toJSON();

			expect(json).toMatchObject({
				id: VALID_ID,
				organizationId: VALID_ORG,
				originalEntryId: VALID_ORIGINAL,
				compensatingEntryId: VALID_COMPENSATING,
				type: "correction",
				reason: VALID_REASON,
				authorizedBy: VALID_AUTHORIZER,
			});
			expect(typeof json.createdAt).toBe("string");
		});
	});
});
