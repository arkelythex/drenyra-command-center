import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { firmRoutes } from "../../routes";

const app = new Elysia().use(firmRoutes);

describe("firm routes tenant boundary", () => {
	it("requires tenant context for the dashboard", async () => {
		expect((await app.handle(new Request("http://localhost/api/firm/dashboard"))).status).toBe(403);
	});

	it("requires tenant context for client lists", async () => {
		expect((await app.handle(new Request("http://localhost/api/firm/clients"))).status).toBe(403);
	});

	it("requires tenant context for client detail", async () => {
		expect((await app.handle(new Request("http://localhost/api/firm/clients/client-1"))).status).toBe(403);
	});

	it("requires tenant context before creating a client", async () => {
		const response = await app.handle(new Request("http://localhost/api/firm/clients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Client", ruc: "20100000001", slug: "client" }) }));
		expect(response.status).toBe(403);
	});

	it("requires tenant context for the alert feed", async () => {
		expect((await app.handle(new Request("http://localhost/api/firm/alerts"))).status).toBe(403);
	});
});
