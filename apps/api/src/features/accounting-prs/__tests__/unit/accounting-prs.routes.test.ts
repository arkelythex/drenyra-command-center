import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { accountingPrRoutes } from "../../routes";

const app = new Elysia().use(accountingPrRoutes);

describe("accounting PR route authorization", () => {
	it("requires company context when listing PRs", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/accounting-prs/"))).status).toBe(401);
	});

	it("requires company context when creating PRs", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/accounting-prs/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "April close", entries: [], totalDebitCents: 0, totalCreditCents: 0 }) }));
		expect(response.status).toBe(401);
	});

	it("requires company context when submitting PRs", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/accounting-prs/pr-1/submit", { method: "PATCH" }))).status).toBe(401);
	});

	it("requires company context when approving PRs", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/accounting-prs/pr-1/approve", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }));
		expect(response.status).toBe(401);
	});

	it("rejects a PR creation with a missing title", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/accounting-prs/", { method: "POST", headers: { "content-type": "application/json", "x-company-id": "company-1" }, body: JSON.stringify({ entries: [], totalDebitCents: 0, totalCreditCents: 0 }) }));
		expect(response.status).toBe(422);
	});
});
