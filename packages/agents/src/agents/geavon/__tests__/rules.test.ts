import { describe, expect, it } from "vitest";
import { evaluateDelegationRules } from "../rules";
import type { DelegationContext } from "../types";

describe("Geavon delegation rules", () => {
	it("returns DIRECT for simple informational queries", () => {
		const ctx: DelegationContext = {
			queryType: "informational",
			fiscalDomain: null,
			requiresToolUse: false,
			estimatedComplexity: "low",
		};
		const result = evaluateDelegationRules(ctx);
		expect(result.action).toBe("direct");
		expect(result.reason).toBeTruthy();
	});

	it("returns DELEGATE for fiscal document processing requests", () => {
		const ctx: DelegationContext = {
			queryType: "document-processing",
			fiscalDomain: "invoice",
			requiresToolUse: true,
			estimatedComplexity: "high",
		};
		const result = evaluateDelegationRules(ctx);
		expect(result.action).toBe("delegate");
		expect(result.reason).toBeTruthy();
		expect(result.matchedRuleId).toBeTruthy();
	});

	it("returns DELEGATE with specific agent hint for compliance queries", () => {
		const ctx: DelegationContext = {
			queryType: "compliance-audit",
			fiscalDomain: "tax",
			requiresToolUse: true,
			estimatedComplexity: "medium",
		};
		const result = evaluateDelegationRules(ctx);
		expect(result.action).toBe("delegate");
		expect(result.suggestedAgent).toBe("vigila");
	});

	it("returns DELEGATE for multi-step orchestration", () => {
		const ctx: DelegationContext = {
			queryType: "multi-step",
			fiscalDomain: "invoice",
			requiresToolUse: true,
			estimatedComplexity: "high",
		};
		const result = evaluateDelegationRules(ctx);
		expect(result.action).toBe("delegate");
	});

	it("returns DIRECT for simple queries even with fiscal domain", () => {
		const ctx: DelegationContext = {
			queryType: "informational",
			fiscalDomain: "invoice",
			requiresToolUse: false,
			estimatedComplexity: "low",
		};
		const result = evaluateDelegationRules(ctx);
		expect(result.action).toBe("direct");
	});
});
