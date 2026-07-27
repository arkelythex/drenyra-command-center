/**
 * ReconciliationRule Entity Tests — RED phase
 *
 * Tests for the ReconciliationRule entity.
 * These tests MUST FAIL until the entity is implemented.
 */

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// ReconciliationRule is imported from its future location.
// This import WILL FAIL (file doesn't exist yet) — that's the RED phase.
// ---------------------------------------------------------------------------
import {
	ReconciliationRule,
	type ReconciliationRuleType,
} from "../ReconciliationRule";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RuleConditions {
	amountTolerance?: number;
	dateTolerance?: number;
	matchFields?: string[];
	[key: string]: unknown;
}

    const createValidRule = (
	overrides: Partial<{
		companyId: string;
		name: string;
		ruleType: ReconciliationRuleType;
		conditions: RuleConditions;
		priority: number;
		isActive: boolean;
	}> = {},
    ): ReconciliationRule => {
	return ReconciliationRule.createNew({
		companyId: overrides.companyId ?? "cmp-abc123",
		name: overrides.name ?? "Exact Amount + Same Date",
		ruleType: overrides.ruleType ?? "MATCH",
		conditions: overrides.conditions ?? {
			amountTolerance: 0,
			dateTolerance: 0,
			matchFields: ["amount", "valueDate"],
		},
		priority: overrides.priority ?? 10,
		isActive: overrides.isActive ?? true,
	});
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReconciliationRule Entity", () => {
	// =========================================================================
	// CREATION
	// =========================================================================
	describe("Creation", () => {
		it("should create a rule with valid data", () => {
			const rule = createValidRule();

			expect(rule.companyId).toBe("cmp-abc123");
			expect(rule.name).toBe("Exact Amount + Same Date");
			expect(rule.ruleType).toBe("MATCH");
			expect(rule.conditions).toEqual({
				amountTolerance: 0,
				dateTolerance: 0,
				matchFields: ["amount", "valueDate"],
			});
			expect(rule.priority).toBe(10);
			expect(rule.isActive).toBe(true);
		});

		it("should auto-generate an id for new rules", () => {
			const rule = createValidRule();
			expect(rule.id).toBeDefined();
			expect(typeof rule.id).toBe("string");
			expect(rule.id.length).toBeGreaterThan(0);
		});

		it("should create a rule with higher priority", () => {
			const rule = createValidRule({ priority: 100 });
			expect(rule.priority).toBe(100);
		});

		it("should create an inactive rule", () => {
			const rule = createValidRule({ isActive: false });
			expect(rule.isActive).toBe(false);
		});

		it("should reject priority of 0", () => {
			expect(() => createValidRule({ priority: 0 })).toThrow();
		});

		it("should reject negative priority", () => {
			expect(() => createValidRule({ priority: -1 })).toThrow();
		});

		it("should set createdAt to current timestamp", () => {
			const before = new Date();
			const rule = createValidRule();
			const after = new Date();
			expect(rule.createdAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime() - 1000,
			);
			expect(rule.createdAt.getTime()).toBeLessThanOrEqual(
				after.getTime() + 1000,
			);
		});
	});

	// =========================================================================
	// ACTIVATION / DEACTIVATION
	// =========================================================================
	describe("Activation / Deactivation", () => {
		it("should deactivate an active rule", () => {
			const rule = createValidRule({ isActive: true });
			const deactivated = rule.deactivate();
			expect(deactivated.isActive).toBe(false);
		});

		it("should keep deactivated rule deactivated (idempotent)", () => {
			const rule = createValidRule({ isActive: false });
			const again = rule.deactivate();
			expect(again.isActive).toBe(false);
		});

		it("should activate an inactive rule", () => {
			const rule = createValidRule({ isActive: false });
			const activated = rule.activate();
			expect(activated.isActive).toBe(true);
		});

		it("should keep active rule active (idempotent activate)", () => {
			const rule = createValidRule({ isActive: true });
			const again = rule.activate();
			expect(again.isActive).toBe(true);
		});
	});

	// =========================================================================
	// PRIORITY UPDATES
	// =========================================================================
	describe("Priority updates", () => {
		it("should update priority to a valid positive integer", () => {
			const rule = createValidRule({ priority: 10 });
			const updated = rule.updatePriority(25);
			expect(updated.priority).toBe(25);
		});

		it("should reject priority update to zero", () => {
			const rule = createValidRule({ priority: 10 });
			expect(() => rule.updatePriority(0)).toThrow();
		});

		it("should reject priority update to negative", () => {
			const rule = createValidRule({ priority: 10 });
			expect(() => rule.updatePriority(-5)).toThrow();
		});

		it("should reject non-integer priority", () => {
			const rule = createValidRule({ priority: 10 });
			expect(() => rule.updatePriority(3.5)).toThrow();
		});
	});

	// =========================================================================
	// CONDITIONS UPDATES
	// =========================================================================
	describe("Conditions updates", () => {
		it("should update conditions with valid JSON object", () => {
			const rule = createValidRule();
			const newConditions: RuleConditions = {
				amountTolerance: 0.5,
				dateTolerance: 1,
				matchFields: ["amount", "valueDate", "reference"],
			};

			const updated = rule.updateConditions(newConditions);
			expect(updated.conditions).toEqual(newConditions);
		});

		it("should reject null conditions", () => {
			const rule = createValidRule();
			expect(() =>
				rule.updateConditions(null as unknown as Record<string, unknown>),
			).toThrow();
		});

		it("should reject undefined conditions", () => {
			const rule = createValidRule();
			expect(() =>
				rule.updateConditions(undefined as unknown as Record<string, unknown>),
			).toThrow();
		});

		it("should reject non-object conditions (array)", () => {
			const rule = createValidRule();
			expect(() =>
				rule.updateConditions([] as unknown as Record<string, unknown>),
			).toThrow();
		});

		it("should accept empty conditions object", () => {
			const rule = createValidRule();
			const updated = rule.updateConditions({});
			expect(updated.conditions).toEqual({});
		});
	});

	// =========================================================================
	// RULE TYPE VALIDATION
	// =========================================================================
	describe("Rule type validation", () => {
		it("should accept valid MATCH rule type", () => {
			const rule = createValidRule({ ruleType: "MATCH" });
			expect(rule.ruleType).toBe("MATCH");
		});

		it("should accept valid EXCLUSION rule type", () => {
			const rule = createValidRule({ ruleType: "EXCLUSION" });
			expect(rule.ruleType).toBe("EXCLUSION");
		});

		it("should reject invalid rule type", () => {
			expect(() =>
				createValidRule({
					ruleType: "INVALID_TYPE" as ReconciliationRuleType,
				}),
			).toThrow();
		});
	});

	// =========================================================================
	// SERIALIZATION
	// =========================================================================
	describe("Serialization", () => {
		it("should serialize to JSON with all fields", () => {
			const rule = createValidRule();

			const json = rule.toJSON();

			expect(json.companyId).toBe("cmp-abc123");
			expect(json.name).toBe("Exact Amount + Same Date");
			expect(json.ruleType).toBe("MATCH");
			expect(json.conditions).toEqual({
				amountTolerance: 0,
				dateTolerance: 0,
				matchFields: ["amount", "valueDate"],
			});
			expect(json.priority).toBe(10);
			expect(json.isActive).toBe(true);
			expect(typeof json.createdAt).toBe("string");
		});

		it("should serialize inactive rule with isActive false", () => {
			const rule = createValidRule({ isActive: false });
			const json = rule.toJSON();
			expect(json.isActive).toBe(false);
		});
	});

	// =========================================================================
	// EDGE CASES
	// =========================================================================
	describe("Edge cases", () => {
		it("should create rule with complex conditions including extra fields", () => {
			const complexConditions: RuleConditions = {
				amountTolerance: 0.01,
				dateTolerance: 2,
				matchFields: ["amount", "valueDate", "reference", "entity"],
				customThreshold: 0.95,
				excludeWeekends: true,
			};

			const rule = createValidRule({ conditions: complexConditions });
			expect(rule.conditions).toEqual(complexConditions);
		});

		it("should accept maximum reasonable priority", () => {
			const rule = createValidRule({ priority: 9999 });
			expect(rule.priority).toBe(9999);
		});

		it("should accept priority of 1 (minimum valid)", () => {
			const rule = createValidRule({ priority: 1 });
			expect(rule.priority).toBe(1);
		});

		it("should deactivate an active rule and keep other fields unchanged", () => {
			const rule = createValidRule({
				name: "Fuzzy Match",
				priority: 20,
				conditions: {
					amountTolerance: 0.5,
					dateTolerance: 1,
					matchFields: ["amount"],
				},
			});

			const deactivated = rule.deactivate();

			expect(deactivated.isActive).toBe(false);
			expect(deactivated.name).toBe("Fuzzy Match");
			expect(deactivated.priority).toBe(20);
			expect(deactivated.conditions).toEqual({
				amountTolerance: 0.5,
				dateTolerance: 1,
				matchFields: ["amount"],
			});
		});
	});
});
