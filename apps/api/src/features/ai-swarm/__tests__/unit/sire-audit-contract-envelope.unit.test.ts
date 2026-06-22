import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { sireAuditRoute } from "../../api/sire-audit.route";

describe("sire-audit route contract envelope", () => {
	it("returns canonical envelope for schema validation errors", async () => {
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/sire-audit-stream", {
				method: "GET",
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
