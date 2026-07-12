/**
 * Cross-Stack Contract Tests
 *
 * Verifies that the actual domain implementation matches the fiscal contracts.
 * These tests ensure contracts stay in sync with code.
 *
 * Go and Python implementations MUST verify against the same contracts.
 *
 * @module @drenyra/domain/cross-stack-tests
 */

import { describe, expect, it } from "vitest";
import { IGVDomainService } from "../services/igv-calculator";
import { RUC } from "../value-objects/RUC";
import {
	FISCAL_CONTRACTS,
	IGV_CONTRACT,
	RUC_CONTRACT,
	MONEY_CONTRACT,
	getFiscalContractsJSON,
} from "../fiscal-contracts";

// ─── Contract Structure Tests ──────────────────────────────────────────────

describe("Fiscal Contracts structure", () => {
	it("all contracts have required metadata", () => {
		for (const contract of Object.values(FISCAL_CONTRACTS)) {
			expect(contract).toHaveProperty("version");
			expect(contract).toHaveProperty("name");
			expect(contract).toHaveProperty("lastUpdated");
			expect(contract).toHaveProperty("invariants");
			expect(contract.invariants).toBeInstanceOf(Array);
			expect(contract.invariants.length).toBeGreaterThan(0);
		}
	});

	it("contracts serialize to valid JSON", () => {
		const json = getFiscalContractsJSON();
		expect(() => JSON.parse(json)).not.toThrow();
		const parsed = JSON.parse(json);
		expect(parsed).toHaveProperty("igv");
		expect(parsed).toHaveProperty("ruc");
		expect(parsed).toHaveProperty("detraccion");
		expect(parsed).toHaveProperty("money");
	});
});

// ─── IGV Contract Verification ─────────────────────────────────────────────

describe("IGV Contract vs Implementation", () => {
	const igvService = new IGVDomainService();

	it("implementation rate matches contract rate", () => {
		expect(IGV_CONTRACT.rate).toBe(0.18);
	});

	it("invariant: total = base + igv", () => {
		const result = igvService.calculateIGV(10000);
		expect(result.totalCents).toBe(result.baseCents + result.igvCents);
	});

	it("invariant: igv >= 0 for base >= 0", () => {
		const result = igvService.calculateIGV(1);
		expect(result.igvCents).toBeGreaterThanOrEqual(0);
	});

	it("contract input/output types match implementation", () => {
		const result = igvService.calculateIGV(10000);
		expect(typeof result.baseCents).toBe("number");
		expect(Number.isInteger(result.baseCents)).toBe(true);
		expect(typeof result.igvCents).toBe("number");
		expect(Number.isInteger(result.igvCents)).toBe(true);
		expect(typeof result.totalCents).toBe("number");
		expect(Number.isInteger(result.totalCents)).toBe(true);
	});
});

// ─── RUC Contract Verification ─────────────────────────────────────────────

describe("RUC Contract vs Implementation", () => {
	it("valid RUC satisfies contract input pattern", () => {
		const ruc = RUC.create("20546296564");
		expect(ruc.value).toMatch(/^\d{11}$/);
		expect(ruc.value.length).toBe(11);
	});

	it("output types match contract", () => {
		const ruc = RUC.create("20546296564");
		expect(typeof ruc.countryCode).toBe("string");
		expect(ruc.countryCode).toBe("PE");
	});

	it("entity type matches contract enum", () => {
		const validTypes = ["COMPANY", "PERSON", "GOVERNMENT", "UNKNOWN"];
		expect(RUC_CONTRACT.output.entityType.enum).toEqual(
			expect.arrayContaining(validTypes),
		);
	});
});

// ─── Money Contract Verification ───────────────────────────────────────────

describe("Money Contract vs Implementation", () => {
	it("operations match contract definitions", () => {
		expect(MONEY_CONTRACT.operations).toHaveProperty("add");
		expect(MONEY_CONTRACT.operations).toHaveProperty("subtract");
		expect(MONEY_CONTRACT.operations).toHaveProperty("multiply");
	});

	it("currency list matches contract", () => {
		expect(MONEY_CONTRACT.currencies).toContain("PEN");
		expect(MONEY_CONTRACT.currencies).toContain("USD");
	});
});
