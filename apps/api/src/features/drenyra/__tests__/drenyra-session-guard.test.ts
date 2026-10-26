import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSessionContext } = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
}));

vi.mock("../../security/session-context", () => ({
	resolveSessionContext,
}));

import { drenyraSessionGuard } from "../drenyra-session-guard";

const SESSION = {
	ok: true,
	context: {
		userId: "user-1",
		authUserId: "user-1",
		legacyUserId: null,
		role: "accountant",
		companyId: "company-1",
	},
};

function build() {
	return new Elysia()
		.use(drenyraSessionGuard())
		.get("/api/drenyra/contract", () => ({ ok: "public" }))
		.get("/api/drenyra/cases", () => ({ ok: "cases" }))
		.get("/api/other", () => ({ ok: "other" }));
}

const call = (path: string, headers: Record<string, string> = {}) =>
	build().handle(new Request(`http://localhost${path}`, { headers }));

beforeEach(() => {
	resolveSessionContext.mockReset();
});

describe("drenyraSessionGuard", () => {
	it("rejects /api/drenyra/* without a session, even with tenant headers", async () => {
		resolveSessionContext.mockResolvedValue({
			ok: false,
			status: 401,
			code: "SESSION_REQUIRED",
			error: "Se requiere autenticación",
		});

		const response = await call("/api/drenyra/cases", {
			"x-company-id": "company-1",
			"x-user-id": "user-1",
		});

		expect(response.status).toBe(401);
		expect((await response.json()).code).toBe("SESSION_REQUIRED");
	});

	it("lets a session through when the headers agree with it", async () => {
		resolveSessionContext.mockResolvedValue(SESSION);

		const response = await call("/api/drenyra/cases", {
			"x-company-id": "company-1",
			"x-user-id": "user-1",
		});

		expect(response.status).toBe(200);
	});

	it("rejects a company header that is not the session's company", async () => {
		resolveSessionContext.mockResolvedValue(SESSION);

		const response = await call("/api/drenyra/cases", {
			"x-company-id": "company-OTHER",
			"x-user-id": "user-1",
		});

		expect(response.status).toBe(403);
		expect((await response.json()).code).toBe("TENANT_MISMATCH");
	});

	it("rejects a user header that is not the session's user", async () => {
		resolveSessionContext.mockResolvedValue(SESSION);

		const response = await call("/api/drenyra/cases", {
			"x-company-id": "company-1",
			"x-user-id": "someone-else",
		});

		expect(response.status).toBe(403);
	});

	it("keeps the contract public and leaves other prefixes alone", async () => {
		resolveSessionContext.mockResolvedValue({
			ok: false,
			status: 401,
			code: "SESSION_REQUIRED",
			error: "x",
		});

		expect((await call("/api/drenyra/contract")).status).toBe(200);
		expect((await call("/api/other")).status).toBe(200);
		expect(resolveSessionContext).not.toHaveBeenCalled();
	});

	it("never trusts header identity: the guard asks for the session without fallback", async () => {
		resolveSessionContext.mockResolvedValue(SESSION);
		await call("/api/drenyra/cases", { "x-company-id": "company-1" });

		expect(resolveSessionContext).toHaveBeenCalledWith(
			expect.objectContaining({ allowHeaderFallback: false }),
		);
	});
});
