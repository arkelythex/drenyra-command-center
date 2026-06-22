import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { createDrenyraBrainModule } from "./brain.routes";

const baseHeaders = {
	"content-type": "application/json",
	"x-organization-id": "org-route-001",
	"x-company-id": "company-route-001",
	"x-company-ruc": "20123456786",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-route-001",
};

function createApp() {
	return new Elysia().use(createDrenyraBrainModule());
}

async function postJson(
	app: Elysia,
	path: string,
	body: unknown,
	headers: Record<string, string> = baseHeaders,
) {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		}),
	);
}

async function getJson(
	app: Elysia,
	path: string,
	headers: Record<string, string> = baseHeaders,
) {
	return app.handle(
		new Request(`http://localhost${path}`, {
			method: "GET",
			headers,
		}),
	);
}

describe("drenyraBrainModule", () => {
	it("POST /api/drenyra/brain/threads creates a scoped thread", async () => {
		const app = createApp();
		const response = await postJson(app, "/api/drenyra/brain/threads", {
			title: "Route test thread",
			sourceSurface: "web",
			linkedCaseId: "case-1",
		});
		const payload = await response.json();

		expect(response.status).toBe(201);
		expect(payload.fiscalScope.companyRuc).toBe("20123456786");
		expect(payload.fiscalScope.period).toBe("2026-05");
		expect(payload.fiscalScope.countryCode).toBe("PE");
	});


	it("mirrors route-created Brain events into configured Fiscal Truth evidence graph", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const appendEdge = vi.fn().mockResolvedValue(undefined);
		const app = new Elysia().use(
			createDrenyraBrainModule({ evidenceGraph: { appendNode, appendEdge } }),
		);
		const createResponse = await postJson(app, "/api/drenyra/brain/threads", {
			title: "Evidence graph route",
			sourceSurface: "web",
		});
		const thread = await createResponse.json();

		await postJson(app, `/api/drenyra/brain/threads/${thread.id}/turns`, {
			prompt: "Mirror this prompt",
			sourceSurface: "web",
		});

		expect(appendNode).toHaveBeenCalledTimes(3);
		expect(appendEdge).toHaveBeenCalledTimes(2);
		expect(appendNode).toHaveBeenCalledWith(
			expect.objectContaining({
				nodeId: `drenyra-brain-thread:${thread.id}`,
				metadata: expect.objectContaining({ period: "2026-05" }),
			}),
		);
	});

	it("GET /api/drenyra/brain/threads lists only current fiscal scope", async () => {
		const app = createApp();
		const scopedHeaders = {
			...baseHeaders,
			"x-fiscal-period": "2027-01",
		};

		await postJson(
			app,
			"/api/drenyra/brain/threads",
			{ title: "Thread A", sourceSurface: "web" },
			scopedHeaders,
		);

		const otherScopeResponse = await postJson(
			app,
			"/api/drenyra/brain/threads",
			{ title: "Thread B", sourceSurface: "cli" },
			{
				...scopedHeaders,
				"x-organization-id": "org-route-002",
				"x-company-id": "company-route-002",
				"x-company-ruc": "20492928373",
				"x-fiscal-period": "2026-06",
			},
		);
		const otherScopePayload = await otherScopeResponse.json();

		const response = await getJson(app, "/api/drenyra/brain/threads", scopedHeaders);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(otherScopePayload.fiscalScope.companyId).toBe("company-route-002");
		expect(payload).toHaveLength(1);
		expect(payload[0]?.title).toBe("Thread A");
	});

	it("POST /api/drenyra/brain/threads/:threadId/turns appends a user_message", async () => {
		const app = createApp();
		const createResponse = await postJson(app, "/api/drenyra/brain/threads", {
			title: "Turn thread",
			sourceSurface: "web",
		});
		const thread = await createResponse.json();

		const turnResponse = await postJson(
			app,
			`/api/drenyra/brain/threads/${thread.id}/turns`,
			{ prompt: "Review this mismatch", sourceSurface: "web" },
		);
		const turnPayload = await turnResponse.json();

		const itemsResponse = await getJson(
			app,
			`/api/drenyra/brain/threads/${thread.id}/items`,
		);
		const itemsPayload = await itemsResponse.json();

		expect(turnResponse.status).toBe(201);
		expect(turnPayload.threadId).toBe(thread.id);
		expect(itemsPayload[0]?.type).toBe("user_message");
		expect(itemsPayload[0]?.content?.text).toBe("Review this mismatch");
	});

	it("GET /api/drenyra/brain/threads/:threadId/items returns timeline items", async () => {
		const app = createApp();
		const createResponse = await postJson(app, "/api/drenyra/brain/threads", {
			title: "Timeline thread",
			sourceSurface: "web",
		});
		const thread = await createResponse.json();

		await postJson(app, `/api/drenyra/brain/threads/${thread.id}/turns`, {
			prompt: "First event",
			sourceSurface: "web",
		});

		const response = await getJson(
			app,
			`/api/drenyra/brain/threads/${thread.id}/items`,
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toHaveLength(1);
		expect(payload[0]?.threadId).toBe(thread.id);
	});

	it("GET /api/drenyra/brain/threads/:threadId/events validates required tenant/user headers", async () => {
		const app = createApp();
		const response = await getJson(
			app,
			"/api/drenyra/brain/threads/thread-1/events",
			{
				"x-company-id": "company-route-001",
				"x-company-ruc": "20123456786",
				"x-fiscal-period": "2026-05",
				"x-user-id": "user-route-001",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toContain("x-organization-id");
	});

	it("GET /api/drenyra/brain/threads/:threadId/events returns heartbeat event-stream payload for scoped thread", async () => {
		const app = createApp();
		const createResponse = await postJson(app, "/api/drenyra/brain/threads", {
			title: "Stream thread",
			sourceSurface: "web",
		});
		const thread = await createResponse.json();
		const response = await getJson(
			app,
			`/api/drenyra/brain/threads/${thread.id}/events`,
		);
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		expect(response.headers.get("cache-control")).toContain("no-cache");
		expect(body).toContain("event: heartbeat");
		expect(body).toContain(`\"threadId\":\"${thread.id}\"`);
	});

	it("GET /api/drenyra/brain/threads/:threadId/events returns 404 for unknown scoped thread", async () => {
		const app = createApp();
		const response = await getJson(
			app,
			"/api/drenyra/brain/threads/thread-missing/events",
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.code).toBe("THREAD_NOT_FOUND");
	});

	it("rejects invalid RUC checksum in scope headers", async () => {
		const app = createApp();
		const response = await postJson(
			app,
			"/api/drenyra/brain/threads",
			{ title: "Invalid RUC", sourceSurface: "web" },
			{ ...baseHeaders, "x-company-ruc": "20123456789" },
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("INVALID_RUC");
		expect(payload.details.invalidHeaders).toContain("x-company-ruc");
	});

	it("GET /api/drenyra/brain/threads/:threadId/items returns 404 for unknown thread", async () => {
		const app = createApp();
		const response = await getJson(
			app,
			"/api/drenyra/brain/threads/thread-missing/items",
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.code).toBe("THREAD_NOT_FOUND");
	});

	it("requires x-organization-id instead of falling back to company id", async () => {
		const app = createApp();
		const response = await postJson(
			app,
			"/api/drenyra/brain/threads",
			{ title: "No org", sourceSurface: "web" },
			{
				"content-type": "application/json",
				"x-company-id": "company-route-001",
				"x-company-ruc": "20123456786",
				"x-fiscal-period": "2026-05",
				"x-user-id": "user-route-001",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.details.missingHeaders).toContain("x-organization-id");
	});

	it("isolates repository state between app instances", async () => {
		const appA = createApp();
		await postJson(appA, "/api/drenyra/brain/threads", {
			title: "App A thread",
			sourceSurface: "web",
		});

		const appB = createApp();
		const response = await getJson(appB, "/api/drenyra/brain/threads");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toHaveLength(0);
	});
});
