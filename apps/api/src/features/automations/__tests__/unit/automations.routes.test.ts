import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { automationsRoutes } from "../../automations.routes";

const app = new Elysia().use(automationsRoutes);

describe("automations route validation", () => {
	it("rejects listing without a company context", async () => {
		expect((await app.handle(new Request("http://localhost/api/automations/"))).status).toBe(401);
	});

	it("rejects creation without a company context", async () => {
		const response = await app.handle(new Request("http://localhost/api/automations/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Daily sync", triggerType: "manual", triggerConfig: {}, skillIds: ["skill-1"], autonomy: "suggest" }) }));
		expect(response.status).toBe(401);
	});

	it("does not accept a company header as a substitute for authentication", async () => {
		const response = await app.handle(new Request("http://localhost/api/automations/", { method: "POST", headers: { "content-type": "application/json", "x-company-id": "company-1" }, body: JSON.stringify({ triggerType: "manual", triggerConfig: {}, skillIds: ["skill-1"], autonomy: "suggest" }) }));
		expect(response.status).toBe(401);
	});

	it("does not bypass authentication for an empty skill list", async () => {
		const response = await app.handle(new Request("http://localhost/api/automations/", { method: "POST", headers: { "content-type": "application/json", "x-company-id": "company-1" }, body: JSON.stringify({ name: "Daily sync", triggerType: "manual", triggerConfig: {}, skillIds: [], autonomy: "suggest" }) }));
		expect(response.status).toBe(401);
	});

	it("does not bypass authentication for an unsupported autonomy mode", async () => {
		const response = await app.handle(new Request("http://localhost/api/automations/", { method: "POST", headers: { "content-type": "application/json", "x-company-id": "company-1" }, body: JSON.stringify({ name: "Daily sync", triggerType: "manual", triggerConfig: {}, skillIds: ["skill-1"], autonomy: "unsafe" }) }));
		expect(response.status).toBe(401);
	});
});
