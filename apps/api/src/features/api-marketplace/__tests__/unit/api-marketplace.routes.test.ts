import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { apiMarketplaceRoutes } from "../../routes";

const app = new Elysia().use(apiMarketplaceRoutes);

describe("API marketplace route validation", () => {
	it("rejects an unsupported marketplace category", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/marketplace?category=invalid"))).status).toBe(422);
	});

	it("requires a company id when listing connections", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/marketplace/connections"))).status).toBe(422);
	});

	it("requires integration id when creating a connection", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/marketplace/connections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ companyId: "company-1" }) }));
		expect(response.status).toBe(422);
	});

	it("requires a connection id when listing webhooks", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/marketplace/webhooks"))).status).toBe(422);
	});

	it("rejects a webhook without an endpoint URL", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/marketplace/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ connectionId: "connection-1", eventType: "invoice.created" }) }));
		expect(response.status).toBe(422);
	});
});
