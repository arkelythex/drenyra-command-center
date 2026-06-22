import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Elysia } from "elysia";
import { frontendTelemetryModule } from "../../index";
import { FrontendTelemetryService } from "../../../../services/frontend-telemetry.service";

describe("frontendTelemetryModule", () => {
	const app = new Elysia().use(frontendTelemetryModule);
	const originalMonitoringKey = process.env.FRONTEND_MONITORING_KEY;
	const originalRequireKey = process.env.FRONTEND_MONITORING_REQUIRE_KEY;

	beforeEach(() => {
		FrontendTelemetryService.resetForTests();
		delete process.env.FRONTEND_MONITORING_KEY;
		delete process.env.FRONTEND_MONITORING_REQUIRE_KEY;
	});

	afterEach(() => {
		if (originalMonitoringKey) {
			process.env.FRONTEND_MONITORING_KEY = originalMonitoringKey;
		} else {
			delete process.env.FRONTEND_MONITORING_KEY;
		}

		if (originalRequireKey) {
			process.env.FRONTEND_MONITORING_REQUIRE_KEY = originalRequireKey;
		} else {
			delete process.env.FRONTEND_MONITORING_REQUIRE_KEY;
		}
	});

	it("ingests telemetry event and exposes summary counters", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/telemetry/frontend", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"user-agent": "vitest-agent",
					"x-forwarded-for": "127.0.0.1",
				},
				body: JSON.stringify({
					kind: "pageview",
					path: "/dashboard",
					timestamp: new Date("2026-02-27T00:00:00.000Z").toISOString(),
					context: {
						section: "home",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				accepted: true,
			},
		});
		expect(typeof payload.data.id).toBe("string");

		const summaryResponse = await app.handle(
			new Request("http://localhost/api/telemetry/frontend/summary"),
		);

		expect(summaryResponse.status).toBe(200);
		const summaryPayload = await summaryResponse.json();
		expect(summaryPayload).toMatchObject({
			success: true,
			data: {
				total: 1,
				counters: {
					pageview: 1,
					error: 0,
				},
			},
		});
	});

	it("sanitizes oversized fields and returns recent records", async () => {
		const longMessage = "x".repeat(3_500);

		const post = await app.handle(
			new Request("http://localhost/api/telemetry/frontend", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					kind: "error",
					message: longMessage,
					stack: "stacktrace",
					timestamp: "2026-02-27T01:00:00.000Z",
				}),
			}),
		);

		expect(post.status).toBe(200);

		const recent = await app.handle(
			new Request("http://localhost/api/telemetry/frontend/recent?limit=1"),
		);
		expect(recent.status).toBe(200);

		const recentPayload = await recent.json();
		const item = recentPayload.data.items[0];
		expect(item.kind).toBe("error");
		expect(item.message.length).toBeLessThanOrEqual(1_000);
		expect(item.stack).toBe("stacktrace");
	});

	it("requires x-monitoring-key when FRONTEND_MONITORING_KEY is configured", async () => {
		process.env.FRONTEND_MONITORING_KEY = "secret-key";
		process.env.FRONTEND_MONITORING_REQUIRE_KEY = "true";

		const unauthorized = await app.handle(
			new Request("http://localhost/api/telemetry/frontend", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					kind: "event",
					name: "test",
					timestamp: new Date().toISOString(),
				}),
			}),
		);

		expect(unauthorized.status).toBe(401);

		const authorizedByQuery = await app.handle(
			new Request("http://localhost/api/telemetry/frontend?key=secret-key", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					kind: "event",
					name: "test-query",
					timestamp: new Date().toISOString(),
				}),
			}),
		);

		expect(authorizedByQuery.status).toBe(200);

		const authorized = await app.handle(
			new Request("http://localhost/api/telemetry/frontend", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-monitoring-key": "secret-key",
				},
				body: JSON.stringify({
					kind: "event",
					name: "test",
					timestamp: new Date().toISOString(),
				}),
			}),
		);

		expect(authorized.status).toBe(200);
	});

	it("returns 503 when key is required but not configured", async () => {
		process.env.FRONTEND_MONITORING_REQUIRE_KEY = "true";

		const response = await app.handle(
			new Request("http://localhost/api/telemetry/frontend", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					kind: "event",
					name: "test",
					timestamp: new Date().toISOString(),
				}),
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "FRONTEND_TELEMETRY_MISCONFIGURED",
		});
	});
});

