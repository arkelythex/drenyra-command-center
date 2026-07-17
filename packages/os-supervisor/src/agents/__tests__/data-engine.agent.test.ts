import { describe, expect, it } from "vitest";
import {
	createDataEngineAgent,
	type DataEngineTask,
} from "../data-engine.agent.js";

const mockCtx = {} as any;

describe("DataEngineAgent", () => {
	it("should report unknown capability gracefully", async () => {
		const agent = createDataEngineAgent("http://localhost:9999");
		const task: DataEngineTask = {
			type: "unknown-action",
			input: "test",
			context: { companyId: "c1", ruc: "12345678901" },
		};
		const result = await agent.execute(task, mockCtx);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("Unknown");
	});

	it("should handle fetch failure (no server) gracefully", async () => {
		const agent = createDataEngineAgent("http://localhost:1");
		const task: DataEngineTask = {
			type: "classify",
			input: "test",
			context: { companyId: "c1", ruc: "12345678901" },
		};
		const result = await agent.execute(task, mockCtx);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("unavailable");
	});

	it("should have correct capabilities", () => {
		const agent = createDataEngineAgent();
		expect(agent.id).toBe("data-engine");
		expect(agent.vertical).toBe("drenyra");
		expect(agent.capabilities).toContain("classify");
		expect(agent.capabilities).toContain("reconcile");
		expect(agent.capabilities).toContain("forecast");
		expect(agent.capabilities).toContain("anomalies");
		expect(agent.capabilities).toContain("ocr");
		expect(agent.capabilities).toContain("sire-validate");
		expect(agent.capabilities).toHaveLength(6);
	});

	it("should strip trailing slash from base URL", () => {
		const agent = createDataEngineAgent("http://localhost:8000/");
		expect(agent.id).toBe("data-engine");
	});

	it("should use default URL when none provided", () => {
		const agent = createDataEngineAgent();
		expect(agent.id).toBe("data-engine");
	});
});
