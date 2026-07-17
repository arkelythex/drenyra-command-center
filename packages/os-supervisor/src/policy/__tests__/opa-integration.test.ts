import { describe, expect, it, vi } from "vitest";
import { OSApprovalGateEngine } from "../../approval/approval-gate-engine.js";
import { InMemoryApprovalStore } from "../../approval/approval-store.js";
import type { OSAgentContext } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { OPAPolicyEngine } from "../opa-policy-engine.js";

const baseContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-integration",
	vertical: VerticalType.DRENYRA,
};

describe("OPA Integration — OSApprovalGateEngine + OPAPolicyEngine", () => {
	it("should auto-allow auto level without touching OPA", async () => {
		const store = new InMemoryApprovalStore();
		const opa = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		const spy = vi
			.spyOn(opa as any, "queryOpa")
			.mockRejectedValue(new Error("should not be called"));
		const engine = new OSApprovalGateEngine(store, opa);

		const result = await engine.evaluate({
			toolName: "invoice:list",
			input: {},
			context: baseContext,
			approvalLevel: "auto",
		});

		expect(result.allowed).toBe(true);
		expect(result.opaDecision).toBeUndefined();
		expect(spy).not.toHaveBeenCalled();
	});

	it("should use OPA for gate decision and create approval request", async () => {
		const store = new InMemoryApprovalStore();
		const opa = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		vi.spyOn(opa as any, "queryOpa").mockResolvedValue({
			decision: "gate",
			reason: "Invoice over 10k requires approval",
		});
		const engine = new OSApprovalGateEngine(store, opa);

		const result = await engine.evaluate({
			toolName: "invoice:submit",
			input: { amount: 50000 },
			context: baseContext,
			approvalLevel: "gate",
		});

		expect(result.allowed).toBe(false);
		expect(result.requiresAction).toBe(true);
		expect(result.opaDecision).toBe("gate");
		expect(result.requestId).toBeDefined();
	});

	it("should deny action when OPA returns deny", async () => {
		const store = new InMemoryApprovalStore();
		const opa = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		vi.spyOn(opa as any, "queryOpa").mockResolvedValue({
			decision: "deny",
			reason: "Invoice exceeds 1M threshold",
		});
		const engine = new OSApprovalGateEngine(store, opa);

		const result = await engine.evaluate({
			toolName: "invoice:submit",
			input: { amount: 2000000 },
			context: baseContext,
			approvalLevel: "gate",
			riskLevel: "critical",
		});

		expect(result.allowed).toBe(false);
		expect(result.requiresAction).toBe(false);
		expect(result.opaDecision).toBe("deny");
	});

	it("should pass context through OPA input for multi-tenant scoping", async () => {
		const store = new InMemoryApprovalStore();
		const opa = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		const spy = vi
			.spyOn(opa as any, "queryOpa")
			.mockResolvedValue({ decision: "allow" });
		const engine = new OSApprovalGateEngine(store, opa);

		const companyContext: OSAgentContext = {
			...baseContext,
			companyId: "comp-42",
			organizationId: "org-7",
		};

		await engine.evaluate({
			toolName: "invoice:submit",
			input: { amount: 5000 },
			context: companyContext,
			approvalLevel: "gate",
		});

		const opaInput = spy.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(opaInput.companyId).toBe("comp-42");
		expect(opaInput.organizationId).toBe("org-7");
		expect(opaInput.ruc).toBe("20123456789");
	});

	it("should work without OPA engine (backward compatible)", async () => {
		const store = new InMemoryApprovalStore();
		const engine = new OSApprovalGateEngine(store);

		const result = await engine.evaluate({
			toolName: "tool-a",
			input: {},
			context: baseContext,
			approvalLevel: "gate",
		});

		expect(result.allowed).toBe(false);
		expect(result.requiresAction).toBe(true);
		expect(result.requestId).toBeDefined();
		expect(result.opaDecision).toBeUndefined();
	});

	it("should handle OPA returning deny and reject in the store", async () => {
		const store = new InMemoryApprovalStore();
		const opa = new OPAPolicyEngine({ opaUrl: "http://opa:8181" });
		vi.spyOn(opa as any, "queryOpa").mockResolvedValue({
			decision: "deny",
			reason: "Policy violation",
		});
		const engine = new OSApprovalGateEngine(store, opa);

		await engine.evaluate({
			toolName: "sensitive:action",
			input: {},
			context: baseContext,
			approvalLevel: "gate",
		});

		// Should have created a rejected request for audit trail
		const rejected = await store.list({ state: "rejected" });
		expect(rejected.length).toBeGreaterThanOrEqual(1);
	});
});
