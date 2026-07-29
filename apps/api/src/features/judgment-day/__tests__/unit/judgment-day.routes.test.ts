import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { judgmentDayRoutes } from "../../routes";

const app = new Elysia().use(judgmentDayRoutes);

describe("judgment day route validation", () => {
	it("requires companyId for the dashboard", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/judgment/dashboard"));
		expect(response.status).toBe(400);
	});

	it("requires companyId when listing reviews", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/judgment/reviews"));
		expect(response.status).toBe(400);
	});

	it("requires companyId when listing rules", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/judgment/rules"));
		expect(response.status).toBe(400);
	});

	it("rejects a review without a target type", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/judgment/reviews", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ companyId: "company-1", targetId: "target-1" }),
		}));
		expect(response.status).toBe(422);
	});

	it("rejects a rule without its required condition", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/judgment/rules", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ companyId: "company-1", name: "rule", category: "TAX", severity: "HIGH" }),
		}));
		expect(response.status).toBe(422);
	});
});
