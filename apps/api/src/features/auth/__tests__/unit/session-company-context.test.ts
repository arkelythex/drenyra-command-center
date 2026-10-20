/**
 * The session's role is the user's membership role in the active company, so
 * role-gated routes (missions, reconciliations, banking) accept a signed-in
 * user without any client-sent x-user-role header.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listUserCompanyMemberships } = vi.hoisted(() => ({
	listUserCompanyMemberships: vi.fn(),
}));

vi.mock("../../handlers/company-membership", async (importOriginal) => ({
	...(await importOriginal<object>()),
	listUserCompanyMemberships,
	ensureUserCompanyMembershipFromRuc: vi.fn(),
}));

import { enrichSessionUserWithCompanyContext } from "../../handlers/session-company-context";

const company = (
	companyId: string,
	membershipRole: string,
	isDefault = false,
) => ({
	companyId,
	companyName: `Empresa ${companyId}`,
	ruc: "20600000013",
	countryCode: "PE",
	membershipRole,
	isDefault,
});

describe("enrichSessionUserWithCompanyContext", () => {
	beforeEach(() => {
		listUserCompanyMemberships.mockReset();
	});

	it("takes the role from the active company's membership", async () => {
		listUserCompanyMemberships.mockResolvedValue([
			company("cmp-a", "VIEWER"),
			company("cmp-b", "OWNER", true),
		]);

		const user = await enrichSessionUserWithCompanyContext({ id: "u-1" });

		expect(user).toMatchObject({ activeCompanyId: "cmp-b", role: "owner" });
	});

	it("ignores a role the user record claims for itself", async () => {
		listUserCompanyMemberships.mockResolvedValue([company("cmp-a", "VIEWER")]);

		const user = await enrichSessionUserWithCompanyContext({
			id: "u-1",
			role: "superadmin",
		});

		expect(user?.role).toBe("viewer");
	});

	it("leaves the role unset without a company", async () => {
		listUserCompanyMemberships.mockResolvedValue([]);

		const user = await enrichSessionUserWithCompanyContext({ id: "u-1" });

		expect(user?.role).toBeUndefined();
	});
});
