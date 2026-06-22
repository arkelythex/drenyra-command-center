import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@arkelythex/ai/gateway", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@arkelythex/ai/gateway")>();

	return {
		...actual,
		llmGateway: {
			...actual.llmGateway,
			chat: vi.fn(),
		},
	};
});

vi.mock(
	"@arkelythex/infrastructure/services/sunat-knowledge/sunat-knowledge.service",
	() => ({
		sunatKnowledgeService: {
			hybridSearch: vi.fn(),
			buildContext: vi.fn(),
		},
	}),
);

import { llmGateway } from "@arkelythex/ai/gateway";
import { sunatKnowledgeService } from "@arkelythex/infrastructure/services/sunat-knowledge/sunat-knowledge.service";
import { auth } from "../../../auth/auth.config";
import * as tenantScope from "../../../documents/handlers/tenant-scope";
import { aiRagModule } from "../../module";

function buildApp(): Elysia {
	return new Elysia().use(aiRagModule);
}

describe("ai-rag security hardening", () => {
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
		).mockResolvedValue(77);
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("rejects tenant assertions that do not match the session tenant", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-1",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);

		const response = await buildApp().handle(
			new Request("http://localhost/api/v1/ai/rag/search", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-user-role": "admin",
					"x-company-id": "cmp-spoofed",
				},
				body: JSON.stringify({ query: "consulta igv" }),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.error.code).toBe("AUTH_CONTEXT_MISMATCH");
	});

	it("uses authenticated tenant scope for RAG generation", async () => {
		vi.spyOn(auth.api, "getSession").mockResolvedValue({
			session: { id: "sess-1" },
			user: {
				id: "auth-user-2",
				legacyUserId: "legacy-user-2",
				role: "admin",
				companyId: "cmp-session",
				activeCompanyId: "cmp-session",
			},
		} as never);
		vi.mocked(sunatKnowledgeService.hybridSearch).mockResolvedValue([
			{
				id: "chunk-1",
				documentType: "igv",
				source: "sunat-doc",
				section: "art-1",
				content: "Contenido relevante",
				scores: { bm25Score: 1, denseScore: 1, hybridScore: 1, finalScore: 1 },
			},
		] as never);
		vi.mocked(sunatKnowledgeService.buildContext).mockResolvedValue({
			formatted: "Contexto preparado",
		} as never);
		vi.mocked(llmGateway.chat).mockResolvedValue({
			id: "chat-1",
			object: "chat.completion",
			created: 1,
			model: "anthropic/claude-sonnet-4-20250514",
			provider: "openrouter",
			choices: [
				{
					index: 0,
					message: { role: "assistant", content: "Respuesta" },
					finishReason: "stop",
				},
			],
			usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
		} as never);

		const response = await buildApp().handle(
			new Request("http://localhost/api/v1/ai/rag/generate", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: "better-auth.session_token=test-session",
					"x-auth-user-id": "auth-user-2",
					"x-user-id": "legacy-user-2",
					"x-user-role": "admin",
					"x-company-id": "cmp-session",
					"x-organization-id": "12345",
				},
				body: JSON.stringify({ query: "consulta igv" }),
			}),
		);

		expect(response.status).toBe(200);
		expect(tenantScope.resolveOrganizationIdFromCompanyId).toHaveBeenCalledWith(
			"cmp-session",
		);
		expect(llmGateway.chat).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: 77,
				userId: "auth-user-2",
			}),
		);
	});
});
