import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { evidenceRoutes } from "../../routes";

const app = new Elysia().use(evidenceRoutes);
const UUID = "550e8400-e29b-41d4-a716-446655440001";

describe("evidence route validation", () => {
	it("rejects uploads without an organization id", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/evidence/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }));
		expect(response.status).toBe(422);
	});

	it("rejects uploads with an invalid evidence type", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/evidence/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: UUID, filename: "invoice.pdf", mimeType: "application/pdf", sizeBytes: 1, hash: "hash", evidenceType: "INVALID", source: "UPLOAD" }) }));
		expect(response.status).toBe(422);
	});

	it("requires an organization id for list requests", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/evidence/list"));
		expect(response.status).toBe(422);
	});

	it("rejects an invalid evidence id for detail requests", async () => {
		const response = await app.handle(new Request(`http://localhost/api/v1/evidence/not-a-uuid?organizationId=${UUID}`));
		expect(response.status).toBe(422);
	});

	it("requires a classification payload when classifying evidence", async () => {
		const response = await app.handle(new Request(`http://localhost/api/v1/evidence/${UUID}/classify?organizationId=${UUID}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }));
		expect(response.status).toBe(422);
	});
});
