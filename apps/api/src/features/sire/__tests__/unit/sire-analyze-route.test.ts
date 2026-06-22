import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

import { DataEngineClient } from "../../../../shared/clients/data-engine.client";
import { sireModule } from "../../index";
import { createSireAuthHeaders } from "../support/sire-auth-test-helpers";

describe("sire analyze route", () => {
	const app = new Elysia().use(sireModule);
	const jwtSecret = "test-sire-secret-12345678901234567890";

	beforeEach(() => {
		process.env.SIRE_JWT_SECRET = jwtSecret;
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp_123",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.SIRE_JWT_SECRET;
	});

	it("returns 503 when data engine is offline", async () => {
		vi.spyOn(DataEngineClient, "healthCheck").mockResolvedValue({
			status: "offline",
			error: "Data Engine unreachable",
		});

		const formData = new FormData();
		formData.append("file", new File(["test"], "ventas.txt"));

		const response = await app.handle(
			new Request("http://localhost/api/sire/analyze?companyId=cmp_123", {
				method: "POST",
				headers: createSireAuthHeaders("cmp_123", jwtSecret),
				body: formData,
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "DATA_ENGINE_UNAVAILABLE",
		});
	});
});
