import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { aiSwarmRoutes } from "../../api/routes";

describe("ai-swarm routes contract envelope", () => {
	it("returns canonical envelope for schema validation errors", async () => {
		const app = new Elysia().use(aiSwarmRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/api/ai-swarm/analyze-task", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					fileCount: "not-a-number",
					taskType: "INVOICE",
				}),
			}),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({
			success: false,
			error: "Invalid ai-swarm request",
			code: "VALIDATION_ERROR",
		});
	});
});
