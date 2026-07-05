import { randomUUID } from "node:crypto";
import { aiToolPermissions, db, eq } from "@drenyra/infrastructure";
import { Elysia } from "elysia";
import { afterEach, expect, it } from "vitest";
import { aiToolPermissionsModule } from "../../../ai-tool-permissions";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

type Fixture = {
	ids: string[];
};

describeDb("AiToolPermissions API (DB integration)", () => {
	const fixture: Fixture = { ids: [] };
	const app = new Elysia().use(aiToolPermissionsModule);

	afterEach(async () => {
		for (const id of fixture.ids) {
			await db.delete(aiToolPermissions).where(eq(aiToolPermissions.id, id));
		}
		fixture.ids = [];
	});

	it("should create and list tool permissions", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toolName: "crear_asiento",
					effect: "REQUIRE_APPROVAL",
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.toolName).toBe("crear_asiento");
		expect(body.data.effect).toBe("REQUIRE_APPROVAL");
		fixture.ids.push(body.data.id);

		// List
		const listRes = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions"),
		);
		expect(listRes.status).toBe(200);
		const listBody = await listRes.json();
		expect(listBody.success).toBe(true);
		expect(listBody.data.length).toBeGreaterThanOrEqual(1);
		expect(
			listBody.data.some(
				(p: { toolName: string }) => p.toolName === "crear_asiento",
			),
		).toBe(true);
	});

	it("should get by ID and update tool permission", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toolName: "registrar_gasto_voz",
					effect: "DENY",
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		const id = body.data.id;
		fixture.ids.push(id);

		// Get by ID
		const getRes = await app.handle(
			new Request(`http://localhost/api/ai-tool-permissions/${id}`),
		);
		expect(getRes.status).toBe(200);
		const getBody = await getRes.json();
		expect(getBody.data.toolName).toBe("registrar_gasto_voz");
		expect(getBody.data.effect).toBe("DENY");

		// Update
		const updateRes = await app.handle(
			new Request(`http://localhost/api/ai-tool-permissions/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ effect: "ALLOW" }),
			}),
		);
		expect(updateRes.status).toBe(200);
		const updateBody = await updateRes.json();
		expect(updateBody.data.effect).toBe("ALLOW");
	});

	it("should soft-delete tool permission", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toolName: "test_delete_tool",
					effect: "DENY",
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		const id = body.data.id;

		// Delete
		const delRes = await app.handle(
			new Request(`http://localhost/api/ai-tool-permissions/${id}`, {
				method: "DELETE",
			}),
		);
		expect(delRes.status).toBe(200);

		// Confirm deleted
		const getRes = await app.handle(
			new Request(`http://localhost/api/ai-tool-permissions/${id}`),
		);
		expect(getRes.status).toBe(200);
		const getBody = await getRes.json();
		expect(getBody.data).toBeNull();
	});

	it("should filter list by companyId", async () => {
		const companyId = randomUUID();
		const res = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toolName: "company_scoped_tool",
					effect: "ALLOW",
					companyId,
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		fixture.ids.push(body.data.id);

		// List with companyId filter
		const listRes = await app.handle(
			new Request(
				`http://localhost/api/ai-tool-permissions?companyId=${companyId}`,
			),
		);
		expect(listRes.status).toBe(200);
		const listBody = await listRes.json();
		expect(
			listBody.data.some(
				(p: { companyId: string }) => p.companyId === companyId,
			),
		).toBe(true);
	});

	it("should return 422 for invalid input", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/ai-tool-permissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ toolName: "", effect: "INVALID" }),
			}),
		);
		expect(res.status).toBe(422);
	});

	it("should return 404-equivalent for non-existent permission", async () => {
		const getRes = await app.handle(
			new Request(`http://localhost/api/ai-tool-permissions/${randomUUID()}`),
		);
		expect(getRes.status).toBe(200);
		const body = await getRes.json();
		expect(body.data).toBeNull();
	});
});
