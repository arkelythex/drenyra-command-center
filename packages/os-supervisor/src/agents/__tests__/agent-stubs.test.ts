import { describe, expect, it } from "vitest";
import type { OSAgentContext } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { createAdminAgent } from "../admin.agent.js";
import { createAndinoAgent } from "../andino.agent.js";
import { createEdgeAgent } from "../edge.agent.js";
import { createKuseAgent } from "../kuse.agent.js";

const mockContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.ANDINO,
};

describe("AndinoAgent", () => {
	it("should have correct id and vertical", () => {
		const agent = createAndinoAgent();
		expect(agent.id).toBe("andino-main");
		expect(agent.vertical).toBe(VerticalType.ANDINO);
	});
	it("should handle missing API key gracefully", async () => {
		const agent = createAndinoAgent();
		const result = await agent.execute(
			{ command: "drone-status" },
			mockContext,
		);
		// Without ANTHROPIC_API_KEY, the agent should return a graceful error
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("not available");
	});
});

describe("AdminAgent", () => {
	it("should have correct id and vertical", () => {
		const agent = createAdminAgent();
		expect(agent.id).toBe("admin-main");
		expect(agent.vertical).toBe(VerticalType.ADMIN);
	});
	it("should handle missing API key gracefully", async () => {
		const agent = createAdminAgent();
		const result = await agent.execute(
			{ command: "list-employees" },
			mockContext,
		);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("not available");
	});
});

describe("EdgeAgent", () => {
	it("should have correct id and vertical", () => {
		const agent = createEdgeAgent();
		expect(agent.id).toBe("edge-main");
		expect(agent.vertical).toBe(VerticalType.EDGE_TRAZ_AGRO);
	});
	it("should handle missing API key gracefully", async () => {
		const agent = createEdgeAgent();
		const result = await agent.execute({ traceId: "tr-123" }, mockContext);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("not available");
	});
});

describe("KuseAgent", () => {
	it("should have correct id and vertical", () => {
		const agent = createKuseAgent();
		expect(agent.id).toBe("kuse-main");
		expect(agent.vertical).toBe(VerticalType.KUSE);
	});
	it("should handle missing API key gracefully", async () => {
		const agent = createKuseAgent();
		const result = await agent.execute({ action: "list-spaces" }, mockContext);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("not available");
	});
});
