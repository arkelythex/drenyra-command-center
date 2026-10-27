import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { globalErrorHandler } from "../../../../../shared/plugins/error-handler";
import { billRoutes } from "../../api/routes";

describe("bill routes contract envelope", () => {
	it("returns canonical envelope for query schema validation errors", async () => {
		const app = new Elysia().use(globalErrorHandler).use(billRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/bills?status=SENT"),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({
			success: false,
			error: "Validation failed",
			code: "VALIDATION_ERROR",
		});
	});
});
