import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

const { contextModule } = await import("../../index");

describe("contextModule", () => {
	it("switches company context", async () => {
		const app = new Elysia().use(contextModule);
		const response = await app.handle(
			new Request("http://localhost/api/context/switch", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					companyId: "cmp-123",
				}),
			}),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			success: true,
			data: {
				companyId: "cmp-123",
				message: "Context switched successfully",
			},
		});
	});
});
