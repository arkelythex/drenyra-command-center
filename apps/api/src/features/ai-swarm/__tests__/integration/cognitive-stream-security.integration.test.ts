import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@drenyra/ai/openrouter", () => ({
	OpenRouterService: class OpenRouterService {},
}));

vi.mock("@drenyra/ai/model-registry", () => ({
	getOpenRouterModelForTier: () => "openai/gpt-5.1",
}));

vi.mock("@drenyra/ai/tool-bridge", () => ({
	getOpenRouterTools: () => [],
	streamWithToolExecution: async function* () {
		yield { type: "done", finish_reason: "stop" } as const;
	},
}));

describe("Cognitive Stream security hardening", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			SECURITY_ENFORCE_TEST_RBAC: "true",
			SECURITY_ENFORCE_TEST_SESSION: "true",
			OPENROUTER_API_KEY: "test-key",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("rejects missing auth context with 401", async () => {
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/cognitive-stream", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					messages: [{ role: "user", content: "hola" }],
					tools: false,
				}),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("SESSION_REQUIRED");
	});

	it("requires BetterAuth session when test session enforcement is enabled", async () => {
		const { auth } = await import("../../../auth/auth.config");
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);

		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/cognitive-stream", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "usr-analyst-1",
					"x-user-role": "analyst",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					companyId: "cmp-1",
					messages: [{ role: "user", content: "consulta saldos" }],
					tools: false,
				}),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("SESSION_REQUIRED");
	});

	it("blocks destructive prompt for non-privileged role", async () => {
		process.env.SECURITY_ENFORCE_TEST_SESSION = "false";
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/cognitive-stream", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "usr-analyst-1",
					"x-user-role": "analyst",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					companyId: "cmp-1",
					messages: [
						{ role: "user", content: "delete all ledger entries ahora" },
					],
					tools: false,
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(["DESTRUCTIVE_ACTION_BLOCKED", "ADMIN_OVERRIDE_REQUIRED"]).toContain(
			payload.code,
		);
	});

	it("denies approval resolution for viewer role", async () => {
		process.env.SECURITY_ENFORCE_TEST_SESSION = "false";
		const { cognitiveStreamRoute } = await import(
			"../../api/cognitive-stream.route"
		);
		const app = new Elysia().use(cognitiveStreamRoute);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/cognitive-stream/approval", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "viewer-1",
					"x-user-role": "viewer",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					companyId: "cmp-1",
					runId: "run-1",
					toolCallId: "tool-1",
					approved: true,
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("FORBIDDEN_ROLE");
	});
});
