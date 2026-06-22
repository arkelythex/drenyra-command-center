import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { billRoutes } from "../../api/routes";

describe("bill routes contract envelope", () => {
	it("returns canonical envelope for query schema validation errors", async () => {
		const app = new Elysia().use(billRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/bills?status=SENT"),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({
			success: false,
			error: "Invalid bill request",
			code: "VALIDATION_ERROR",
		});
	});
});
