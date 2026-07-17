import { afterEach, describe, expect, it, vi } from "vitest";
import type { OSAgentContext } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { OPAPolicyEngine } from "../opa-policy-engine.js";

const mockContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.DRENYRA,
};

describe("OPAPolicyEngine", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return allow for auto approval level without OPA query", async () => {
		const engine = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		const result = await engine.evaluate({
			toolName: "invoice:list",
			input: {},
			context: mockContext,
			approvalLevel: "auto",
		});
		expect(result.decision).toBe("allow");
	});

	it("should return gate for gate level when OPA unavailable (fallback)", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa-unreachable:8181",
		});
		const result = await engine.evaluate({
			toolName: "drone:launch",
			input: { command: "takeoff" },
			context: mockContext,
			approvalLevel: "gate",
		});
		expect(result.decision).toBe("gate");
		expect(result.reason).toContain("fallback");
	});

	it("should query OPA when available and return parsed decision", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa:8181",
		});

		const mockOpaResult = { decision: "allow", reason: "Test override" };
		vi.spyOn(engine as any, "queryOpa").mockResolvedValue(mockOpaResult);

		const result = await engine.evaluate({
			toolName: "invoice:create",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
		});
		expect(result.decision).toBe("allow");
	});

	it("should use vertical-specific policy path", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa:8181",
		});
		const spy = vi
			.spyOn(engine as any, "queryOpa")
			.mockResolvedValue({ decision: "allow" });

		await engine.evaluate({
			toolName: "mission:plan",
			input: {},
			context: { ...mockContext, vertical: VerticalType.ANDINO },
			approvalLevel: "gate",
		});

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({
				vertical: "andino",
			}),
		);
	});

	it("should return gate for policy_gate in fallback", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa-unreachable:8181",
		});
		const result = await engine.evaluate({
			toolName: "sire:submit",
			input: {},
			context: mockContext,
			approvalLevel: "policy_gate",
		});
		expect(result.decision).toBe("gate");
		expect(result.reason).toBeDefined();
	});

	it("should handle OPA errors gracefully with fallback", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa:8181",
		});
		vi.spyOn(engine as any, "queryOpa").mockRejectedValue(
			new Error("OPA unavailable"),
		);

		const result = await engine.evaluate({
			toolName: "employee:terminate",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
		});

		expect(result.decision).toBe("gate");
		expect(result.reason).toContain("fallback");
	});

	it("should include vertical, action, approvalLevel and riskLevel in OPA input", async () => {
		const engine = new OPAPolicyEngine({
			opaUrl: "http://opa:8181",
		});
		const spy = vi
			.spyOn(engine as any, "queryOpa")
			.mockResolvedValue({ decision: "allow" });

		await engine.evaluate({
			toolName: "drone:mission",
			input: { altitude: 100 },
			context: { ...mockContext, vertical: VerticalType.ANDINO },
			approvalLevel: "gate",
			riskLevel: "high",
		});

		const callInput = spy.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(callInput.vertical).toBe("andino");
		expect(callInput.action).toBe("drone:mission");
		expect(callInput.approvalLevel).toBe("gate");
		expect(callInput.riskLevel).toBe("high");
	});
});
