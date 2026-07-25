/**
 * Idempotency Plugin — Elysia transport tests (W2-03D).
 *
 * Tests the plugin's validation, error mapping, and response handling
 * using Elysia's test utility (Elysia.handle or equivalent).
 *
 * These are transport-level tests. Service orchestration is tested in W2-03C.
 */

import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import {
	applyIdempotencyResult,
	idempotencyPlugin,
} from "../idempotency-plugin";

// ─── Test app setup ──────────────────────────────────────────────────────────

/**
 * Build a test Elysia app with the idempotency plugin and a simple handler.
 */
function buildTestApp(handler: (ctx: { idempotencyKey: string }) => object) {
	return new Elysia()
		.use(idempotencyPlugin)
		.post("/test", ({ idempotencyKey, set }) => {
			const result = handler({ idempotencyKey });
			return result;
		});
}

/**
 * Send a POST request to the test app and get the response.
 */
async function request(
	app: Elysia,
	headers: Record<string, string>,
	body?: unknown,
): Promise<{ status: number; body: unknown; headers: Record<string, string> }> {
	// Simulate an Elysia request using fetch
	const req = new Request("http://localhost/test", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	const response = await app.handle(req);

	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});

	return {
		status: response.status,
		body: await response.json(),
		headers: responseHeaders,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Idempotency Plugin — validation", () => {
	it("rejects missing idempotency-key header with 400", async () => {
		const app = buildTestApp(() => ({ ok: true }));
		const res = await request(app, {});

		expect(res.status).toBe(400);
	});

	it("rejects key shorter than 8 chars", async () => {
		const app = buildTestApp(() => ({ ok: true }));
		const res = await request(app, { "idempotency-key": "abc" });

		expect(res.status).toBe(400);
	});

	it("rejects key longer than 255 chars", async () => {
		const app = buildTestApp(() => ({ ok: true }));
		const res = await request(app, { "idempotency-key": "x".repeat(256) });

		expect(res.status).toBe(400);
	});

	it("accepts a valid key and passes it to the handler", async () => {
		const app = buildTestApp(({ idempotencyKey }) => ({
			ok: true,
			key: idempotencyKey,
		}));
		const res = await request(app, { "idempotency-key": "valid-key-12345678" });

		expect(res.status).toBe(200);
	});
});

describe("applyIdempotencyResult", () => {
	it("sets status and body for executed result", () => {
		const set = { status: 0, headers: {} as Record<string, string> };
		const result = {
			kind: "executed" as const,
			response: {
				status: 201,
				body: { id: "case-1" },
				headers: { "content-type": "application/json" },
			},
		};

		const body = applyIdempotencyResult(set, result);

		expect(set.status).toBe(201);
		expect(set.headers["idempotency-replayed"]).toBe("false");
		expect(body).toEqual({ id: "case-1" });
	});

	it("sets Idempotency-Replayed: true for replayed result", () => {
		const set = { status: 0, headers: {} as Record<string, string> };
		const result = {
			kind: "replayed" as const,
			response: { status: 200, body: { cached: true } },
		};

		applyIdempotencyResult(set, result);

		expect(set.status).toBe(200);
		expect(set.headers["idempotency-replayed"]).toBe("true");
	});

	it("applies response headers from sanitized result", () => {
		const set = { status: 0, headers: {} as Record<string, string> };
		const result = {
			kind: "executed" as const,
			response: {
				status: 201,
				body: null,
				headers: { location: "/cases/123", "content-type": "application/json" },
			},
		};

		applyIdempotencyResult(set, result);

		expect(set.headers.location).toBe("/cases/123");
		expect(set.headers["content-type"]).toBe("application/json");
	});

	it("handles null body (204-style)", () => {
		const set = { status: 0, headers: {} as Record<string, string> };
		const result = {
			kind: "executed" as const,
			response: { status: 204, body: null },
		};

		const body = applyIdempotencyResult(set, result);
		expect(set.status).toBe(204);
		expect(body).toBeNull();
	});
});
