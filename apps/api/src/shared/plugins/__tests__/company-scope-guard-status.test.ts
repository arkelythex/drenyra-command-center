/**
 * A request the guard refuses answers with the guard's status (401/403) and
 * the usual error envelope, not a 500.
 */
import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";

const { resolveSessionContext } = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
}));

vi.mock("../../../features/security/session-context", () => ({
	resolveSessionContext,
}));

import { companyScopeGuard } from "../company-scope-guard";

const app = new Elysia()
	.use(companyScopeGuard())
	.get("/scoped", ({ companyContext }) => companyContext.companyId);

describe("companyScopeGuard refusals", () => {
	it.each([
		[401, "AUTH_REQUIRED"],
		[403, "TENANT_SCOPE_VIOLATION"],
	])("answers %i with code %s", async (status, code) => {
		resolveSessionContext.mockResolvedValue({
			ok: false,
			status,
			code,
			error: "refused",
		});

		const response = await app.handle(new Request("http://localhost/scoped"));

		expect(response.status).toBe(status);
		expect(await response.json()).toMatchObject({ success: false, code });
	});
});
