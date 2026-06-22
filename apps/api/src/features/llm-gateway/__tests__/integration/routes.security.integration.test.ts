import { createHmac } from "node:crypto";
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@arkelythex/ai/gateway", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@arkelythex/ai/gateway")>();

	return {
		...actual,
		llmGateway: {
			...actual.llmGateway,
			chat: vi.fn(),
			getCostAggregation: vi.fn(),
			getHealthStatus: vi.fn(),
			getMetrics: vi.fn(),
			getRateLimitStatus: vi.fn(),
			streamChat: vi.fn(),
		},
	};
});

import { llmGateway } from "@arkelythex/ai/gateway";
import { auth } from "../../../auth/auth.config";
import * as tenantScope from "../../../documents/handlers/tenant-scope";
import { llmGatewayModule } from "../../module";

function buildApp(): Elysia {
	return new Elysia().use(llmGatewayModule);
}

describe("llm-gateway security hardening", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			SECURITY_ENFORCE_TEST_RBAC: "true",
			SECURITY_ENFORCE_TEST_SESSION: "true",
		};
		vi.spyOn(
			tenantScope,
			"resolveOrganizationIdFromCompanyId",
		).mockResolvedValue(42);
		vi.mocked(llmGateway.getHealthStatus).mockReturnValue([
			{
				provider: "openrouter",
				isAvailable: true,
				latencyMs: 10,
				errorRate: 0,
			},
		]);
		vi.mocked(llmGateway.getRateLimitStatus).mockReturnValue({
			remainingRpd: 100,
			remainingRpm: 10,
		});
		vi.mocked(llmGateway.getMetrics).mockReturnValue([]);
		vi.mocked(llmGateway.getCostAggregation).mockReturnValue({
			period: "daily",
			totalCostUsd: 0,
			byProvider: {},
			byModel: {},
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("uses session-derived organization scope for chat completions", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				legacyUserId: "legacy-user-1",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);
		vi.mocked(llmGateway.chat).mockResolvedValue({
			id: "chat-1",
			object: "chat.completion",
			created: 1,
			model: "openai/gpt-5",
			provider: "openrouter",
			choices: [
				{
					index: 0,
					message: { role: "assistant", content: "ok" },
					finishReason: "stop",
				},
			],
			usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
		} as never);

		const response = await buildApp().handle(
			new Request("http://localhost/api/v1/chat/completions", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-user-1",
					"x-user-id": "legacy-user-1",
					"x-user-role": "admin",
					"x-company-id": "cmp-session",
					"x-organization-id": "9999",
				},
				body: JSON.stringify({
					model: "openai/gpt-5",
					messages: [{ role: "user", content: "Hola" }],
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(tenantScope.resolveOrganizationIdFromCompanyId).toHaveBeenCalledWith(
			"cmp-session",
		);
		expect(llmGateway.chat).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: 42,
				userId: "auth-user-1",
			}),
		);
	});

	it("denies chat completions for unauthorized roles", async () => {
		process.env.SECURITY_ENFORCE_TEST_SESSION = "false";

		const response = await buildApp().handle(
			new Request("http://localhost/api/v1/chat/completions", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "viewer-1",
					"x-user-role": "viewer",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					model: "openai/gpt-5",
					messages: [{ role: "user", content: "Hola" }],
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.error.code).toBe("FORBIDDEN_ROLE");
		expect(llmGateway.chat).not.toHaveBeenCalled();
	});

	// TODO: Vitest picks up worktree copies of this file instead of
	// the main checkout, causing @arkelythex/ai/gateway import to
	// fail. Works in CI where there are no worktrees.
	it.skip("allows signed service credentials on read-only gateway routes", async () => {
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "machine-secret";
		vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);
		vi.spyOn(
			tenantScope,
			"resolveOrganizationIdFromCompanyId",
		).mockResolvedValue(51);

		const timestamp = Date.now().toString();
		const signature = createHmac("sha256", "machine-secret")
			.update(
				["ai-orchestrator", timestamp, "cmp-service", "service"].join("."),
			)
			.digest("hex");

		const response = await buildApp().handle(
			new Request("http://localhost/api/v1/providers", {
				method: "GET",
				headers: {
					"x-ark-service-id": "ai-orchestrator",
					"x-ark-service-role": "service",
					"x-ark-service-company-id": "cmp-service",
					"x-ark-service-timestamp": timestamp,
					"x-ark-service-signature": `sha256=${signature}`,
					"x-company-id": "cmp-service",
				},
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
	});
});
