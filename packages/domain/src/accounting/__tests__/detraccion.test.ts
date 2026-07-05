/**
 * Detraccion Value Object — Tests
 *
 * Covers:
 * - Happy path: valid detraccion creation
 * - Edge cases: boundary percentages, amounts
 * - Error states: invalid SPOT code, percentage, amount
 * - State transitions: deposit, use, release
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	Detraccion,
	InvalidDetraccionError,
	InvalidDetraccionTransitionError,
	SPOT_CODE_REGISTRY,
} from "../detraccion";

describe("Detraccion", () => {
	const penMoney = (amount: number) => Money.fromAmount(amount, "PEN");

	// --- Happy Path ---

	it("should create a valid detraccion", () => {
		const det = Detraccion.create(
			"det-1",
			"001",
			4,
			penMoney(1000),
			"Factura F001-123",
		);

		expect(det.id).toBe("det-1");
		expect(det.spotCode).toBe("001");
		expect(det.percentage).toBe(4);
		expect(det.reference).toBe("Factura F001-123");
		expect(det.status).toBe("pendiente");
	});

	it("should return SPOT code info", () => {
		const det = Detraccion.create("det-1", "005", 12, penMoney(5000), "Ref");
		const info = det.spotCodeInfo;

		expect(info.code).toBe("005");
		expect(info.description).toBe("Intermediación laboral y tercerización");
	});

	it("should accept all valid SPOT codes", () => {
		for (const code of Object.keys(SPOT_CODE_REGISTRY)) {
			const det = Detraccion.create(
				`det-${code}`,
				code,
				10,
				penMoney(1000),
				`Ref ${code}`,
			);
			expect(det.spotCode).toBe(code);
		}
	});

	// --- Edge Cases ---

	it("should handle very small amounts", () => {
		const det = Detraccion.create(
			"det-small",
			"001",
			4,
			penMoney(1),
			"Small amount",
		);
		expect(det.amount.getAmount()).toBe(1);
	});

	it("should handle maximum percentage (100)", () => {
		const det = Detraccion.create(
			"det-100",
			"001",
			100,
			penMoney(1000),
			"100%",
		);
		expect(det.percentage).toBe(100);
	});

	it("should handle decimal percentage (fractional)", () => {
		const det = Detraccion.create(
			"det-decimal",
			"001",
			5.5,
			penMoney(1000),
			"Decimal pct",
		);
		expect(det.percentage).toBe(5.5);
	});

	// --- Error States ---

	it("should reject empty ID", () => {
		expect(() =>
			Detraccion.create("", "001", 4, penMoney(1000), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject invalid SPOT code", () => {
		expect(() =>
			Detraccion.create("det-1", "999", 4, penMoney(1000), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject zero percentage", () => {
		expect(() =>
			Detraccion.create("det-1", "001", 0, penMoney(1000), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject negative percentage", () => {
		expect(() =>
			Detraccion.create("det-1", "001", -5, penMoney(1000), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject percentage over 100", () => {
		expect(() =>
			Detraccion.create("det-1", "001", 101, penMoney(1000), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject zero amount", () => {
		expect(() =>
			Detraccion.create("det-1", "001", 4, penMoney(0), "Ref"),
		).toThrow(InvalidDetraccionError);
	});

	it("should reject empty reference", () => {
		expect(() =>
			Detraccion.create("det-1", "001", 4, penMoney(1000), ""),
		).toThrow(InvalidDetraccionError);
	});

	// --- State Transitions ---

	it("should transition from pendiente to depositado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();

		expect(deposited.status).toBe("depositado");
		expect(det.status).toBe("pendiente"); // original unchanged
		expect(deposited.isDeposited()).toBe(true);
	});

	it("should transition from depositado to usado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();
		const used = deposited.use();

		expect(used.status).toBe("usado");
		expect(used.isUsed()).toBe(true);
	});

	it("should transition from depositado to liberado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();
		const released = deposited.release();

		expect(released.status).toBe("liberado");
		expect(released.isReleased()).toBe(true);
	});

	it("should reject deposit from depositado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();
		expect(() => deposited.deposit()).toThrow(InvalidDetraccionTransitionError);
	});

	it("should reject use from pendiente", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(() => det.use()).toThrow(InvalidDetraccionTransitionError);
	});

	it("should reject release from pendiente", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(() => det.release()).toThrow(InvalidDetraccionTransitionError);
	});

	it("should reject use from usado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();
		const used = deposited.use();
		expect(() => used.use()).toThrow(InvalidDetraccionTransitionError);
	});

	it("should reject release from liberado", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const deposited = det.deposit();
		const released = deposited.release();
		expect(() => released.release()).toThrow(InvalidDetraccionTransitionError);
	});

	// --- State Queries ---

	it("should correctly report isDeposited", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(det.isDeposited()).toBe(false);

		const deposited = det.deposit();
		expect(deposited.isDeposited()).toBe(true);
	});

	it("should correctly report isUsed", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(det.isUsed()).toBe(false);

		const used = det.deposit().use();
		expect(used.isUsed()).toBe(true);
	});

	it("should correctly report isReleased", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(det.isReleased()).toBe(false);

		const released = det.deposit().release();
		expect(released.isReleased()).toBe(true);
	});

	// --- Equality & Serialization ---

	it("should detect equal detracciones", () => {
		const a = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const b = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(a.equals(b)).toBe(true);
	});

	it("should detect non-equal detracciones", () => {
		const a = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		const b = Detraccion.create("det-2", "001", 4, penMoney(1000), "Ref");
		expect(a.equals(b)).toBe(false);
	});

	it("should return false for null/undefined", () => {
		const det = Detraccion.create("det-1", "001", 4, penMoney(1000), "Ref");
		expect(det.equals(null)).toBe(false);
		expect(det.equals(undefined)).toBe(false);
	});

	it("should serialize to JSON and back", () => {
		const original = Detraccion.create(
			"det-1",
			"005",
			12,
			penMoney(5000),
			"Factura F001-456",
		);

		const json = original.toJSON();
		expect(json.id).toBe("det-1");
		expect(json.spotCode).toBe("005");
		expect(json.percentage).toBe(12);
		expect(json.status).toBe("pendiente");
		expect(typeof json.createdAt).toBe("string");
		expect(typeof json.updatedAt).toBe("string");

		// Verify amount is in the JSON
		const amount = json.amount as { amount: number; currency: string };
		expect(amount.amount).toBe(5000);
		expect(amount.currency).toBe("PEN");
	});
});
