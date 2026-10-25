import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	resolveSessionIdentityFromHeaders: vi.fn(),
	createCompanyForUser: vi.fn(),
}));

vi.mock("../../auth/handlers/session-identity", () => ({
	resolveSessionIdentityFromHeaders: mocks.resolveSessionIdentityFromHeaders,
}));
vi.mock("../application/commands/create-company.command", () => ({
	createCompanyForUser: mocks.createCompanyForUser,
}));

import { onboardingRoutes } from "../api/onboarding.route";

const BODY = {
	ruc: "20100000017",
	businessName: "Empresa S.A.C.",
	userId: "someone-else",
};

function post(body: unknown = BODY) {
	return onboardingRoutes.handle(
		new Request("http://localhost/api/onboarding/company", {
			method: "POST",
			headers: { "content-type": "application/json", cookie: "s=1" },
			body: JSON.stringify(body),
		}),
	);
}

describe("POST /api/onboarding/company", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.resolveSessionIdentityFromHeaders.mockResolvedValue({
			authUserId: "user-1",
		});
	});

	it("answers 401 without a session", async () => {
		mocks.resolveSessionIdentityFromHeaders.mockResolvedValue({
			authUserId: "",
		});

		const response = await post();

		expect(response.status).toBe(401);
		expect(mocks.createCompanyForUser).not.toHaveBeenCalled();
	});

	it("creates the company for the session user, never one from the body", async () => {
		mocks.createCompanyForUser.mockResolvedValue({
			ok: true,
			company: { companyId: "cmp-1", membershipRole: "OWNER" },
		});

		const response = await post();

		expect(response.status).toBe(201);
		expect(mocks.createCompanyForUser).toHaveBeenCalledWith({
			authUserId: "user-1",
			ruc: "20100000017",
			businessName: "Empresa S.A.C.",
		});
		expect(await response.json()).toMatchObject({
			success: true,
			data: { companyId: "cmp-1" },
		});
	});

	it.each([
		["RUC_TAKEN", 409],
		["RUC_INVALID", 422],
		["NAME_REQUIRED", 422],
	])("maps %s to %i", async (code, status) => {
		mocks.createCompanyForUser.mockResolvedValue({ ok: false, code });

		const response = await post();

		expect(response.status).toBe(status);
		expect(await response.json()).toMatchObject({ success: false, code });
	});
});
