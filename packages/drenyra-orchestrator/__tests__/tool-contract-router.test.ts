import type {
	ToolCall,
	ToolContract,
	ToolContractRegistry,
} from "@drenyra/domain";
import { createContractRegistry } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import {
	routeToolCall,
	type ToolRouteContext,
} from "../src/feos/tool-contract-router";

function makeContract(overrides: Partial<ToolContract> = {}): ToolContract {
	return {
		name: "post_journal_entry",
		riskLevel: "R2",
		outputMode: "strict_schema",
		description: "Post a journal entry",
		inputSchema: { type: "object", properties: {} },
		hasDeterministicValidator: true,
		requiresApproval: true,
		requiredCapabilities: ["journal:post"],
		idempotent: false,
		...overrides,
	};
}

function makeCall(contract: ToolContract): ToolCall {
	return {
		toolName: contract.name,
		riskLevel: contract.riskLevel,
		contractVersion: "1.0.0",
		input: {},
		actor: { id: "actor-1", type: "agent", label: "Test Agent" },
		scope: {
			organizationId: "org-1",
			companyId: "company-1",
			companyRuc: "20100000001",
			fiscalPeriod: "2026-06",
		},
		traceId: "trace-1",
		timestamp: "2026-06-30T00:00:00.000Z",
	} as unknown as ToolCall;
}

function contextFor(
	contract: ToolContract,
	modelCapabilities?: ToolRouteContext["modelCapabilities"],
): ToolRouteContext {
	const registry: ToolContractRegistry = createContractRegistry();
	registry.set(contract.name, contract);
	return { registry, modelCapabilities };
}

describe("routeToolCall", () => {
	it("rejects an R2 call when the model cannot produce constrained output", async () => {
		const contract = makeContract({ riskLevel: "R2" });

		const action = await routeToolCall(
			makeCall(contract),
			contextFor(contract, {
				supportsConstrainedOutput: false,
				supportsJsonSchema: true,
				supportsToolCalling: true,
			}),
		);

		expect(action).toEqual({
			action: "rejected",
			reason:
				'Model does not support constrained output required for R2 tool "post_journal_entry"',
		});
	});

	it("rejects an R2 call when the model has no JSON schema support", async () => {
		const contract = makeContract({ riskLevel: "R2" });

		const action = await routeToolCall(
			makeCall(contract),
			contextFor(contract, {
				supportsConstrainedOutput: true,
				supportsJsonSchema: false,
				supportsToolCalling: true,
			}),
		);

		expect(action.action).toBe("rejected");
	});

	it("enforces the schema for an R2 call when the model is capable", async () => {
		const contract = makeContract({ riskLevel: "R2" });

		const action = await routeToolCall(
			makeCall(contract),
			contextFor(contract, {
				supportsConstrainedOutput: true,
				supportsJsonSchema: true,
				supportsToolCalling: true,
			}),
		);

		expect(action.action).toBe("enforce_schema");
	});

	it("does not inspect model capabilities below R2", async () => {
		const contract = makeContract({
			riskLevel: "R1",
			outputMode: "structured",
		});

		const action = await routeToolCall(
			makeCall(contract),
			contextFor(contract, {
				supportsConstrainedOutput: false,
				supportsJsonSchema: false,
				supportsToolCalling: false,
			}),
		);

		expect(action).toEqual({ action: "prefer_structured" });
	});

	it("routes R2 normally when the caller declares no model capabilities", async () => {
		const contract = makeContract({ riskLevel: "R2" });

		const action = await routeToolCall(
			makeCall(contract),
			contextFor(contract),
		);

		expect(action.action).toBe("enforce_schema");
	});

	it("rejects an unknown tool", async () => {
		const contract = makeContract({ riskLevel: "R0", outputMode: "flexible" });

		const action = await routeToolCall(
			makeCall({ ...contract, name: "unknown_tool" }),
			contextFor(contract),
		);

		expect(action).toEqual({
			action: "rejected",
			reason: 'Unknown tool: "unknown_tool"',
		});
	});
});
