import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import {
	createApiAvailabilityMiddleware,
	createApiProxyErrorPayload,
	handleApiProxyError,
	resolveApiProxyTarget,
} from "./vite.dev-api-proxy";

describe("dev API proxy", () => {
	it("uses localhost:3000 as the default API proxy target", () => {
		expect(resolveApiProxyTarget({})).toBe("http://localhost:3000");
	});

	it("allows overriding the API proxy target from environment", () => {
		expect(
			resolveApiProxyTarget({
				VITE_API_PROXY_TARGET: " http://127.0.0.1:3001 ",
			}),
		).toBe("http://127.0.0.1:3001");
	});

	it("returns an actionable payload when the local API is unavailable", () => {
		const payload = createApiProxyErrorPayload(
			Object.assign(new Error("connect ECONNREFUSED"), {
				code: "ECONNREFUSED",
			}),
			"/api/auth/session",
			"http://localhost:3000",
		);

		expect(payload).toEqual({
			success: false,
			code: "DEV_API_PROXY_UNAVAILABLE",
			error: "Local API unavailable",
			message:
				"Vite could not proxy /api/auth/session to http://localhost:3000. Start the API with `bun run --cwd apps/api dev` or use root `bun run dev` to start API + Web together.",
			details: {
				requestPath: "/api/auth/session",
				target: "http://localhost:3000",
				cause: "ECONNREFUSED",
			},
		});
	});

	it("writes a structured 503 response instead of leaking raw proxy errors", () => {
		const writeHead = vi.fn();
		const end = vi.fn();
		const response = {
			headersSent: false,
			writableEnded: false,
			writeHead,
			end,
		} as unknown as ServerResponse;
		const request = { url: "/api/auth/login" } as IncomingMessage;

		handleApiProxyError(
			Object.assign(new Error("connect ECONNREFUSED"), {
				code: "ECONNREFUSED",
			}),
			request,
			response,
			"http://localhost:3000",
		);

		expect(writeHead).toHaveBeenCalledWith(503, {
			"Content-Type": "application/json",
		});
		expect(JSON.parse(String(end.mock.calls[0]?.[0]))).toMatchObject({
			code: "DEV_API_PROXY_UNAVAILABLE",
			details: {
				requestPath: "/api/auth/login",
				target: "http://localhost:3000",
				cause: "ECONNREFUSED",
			},
		});
	});

	it("short-circuits /api requests before Vite proxy when the API is down", async () => {
		const writeHead = vi.fn();
		const end = vi.fn();
		const next = vi.fn();
		const response = {
			headersSent: false,
			writableEnded: false,
			writeHead,
			end,
		} as unknown as ServerResponse;
		const request = { url: "/api/auth/session" } as IncomingMessage;
		const middleware = createApiAvailabilityMiddleware(
			"http://localhost:3000",
			async () => false,
		);

		middleware(request, response, next);
		await vi.waitFor(() => expect(writeHead).toHaveBeenCalled());

		expect(next).not.toHaveBeenCalled();
		expect(writeHead).toHaveBeenCalledWith(503, {
			"Content-Type": "application/json",
		});
	});

	it("lets Vite handle /api requests when the API is reachable", async () => {
		const next = vi.fn();
		const middleware = createApiAvailabilityMiddleware(
			"http://localhost:3000",
			async () => true,
		);

		middleware(
			{ url: "/api/auth/session" } as IncomingMessage,
			{} as ServerResponse,
			next,
		);

		await vi.waitFor(() => expect(next).toHaveBeenCalled());
	});
});
