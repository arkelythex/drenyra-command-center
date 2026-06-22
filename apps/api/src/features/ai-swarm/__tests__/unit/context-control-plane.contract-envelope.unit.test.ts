import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { contextControlPlaneRoute } from "../../api/context-control-plane.route";

describe("context-control-plane route contract envelope", () => {
	it("returns canonical envelope for schema validation errors", async () => {
		const app = new Elysia().use(contextControlPlaneRoute);

		const response = await app.handle(
			new Request(
				"http://localhost/api/ai-swarm/context-control-plane/registry",
				{
					method: "GET",
					headers: {
						"x-auth-user-id": "auth-user-1",
						"x-user-id": "11111111-1111-1111-1111-111111111111",
						"x-user-role": "admin",
						"x-company-id": "cmp-1",
					},
				},
			),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({
			success: false,
			error: "Invalid context-control-plane request",
			code: "VALIDATION_ERROR",
		});
	});
});
