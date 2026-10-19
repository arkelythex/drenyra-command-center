import { beforeEach, describe, expect, it } from "vitest";
import {
	ACTIVE_COMPANY_STORAGE_KEY,
	AUTH_STORAGE_KEYS,
	clearActiveCompanyContext,
	mergeUserWithStoredCompanyContext,
	readActiveCompanyState,
	setActiveCompanyById,
	syncActiveCompanyContextFromUser,
} from "../company-context";
import {
	ACTIVE_FISCAL_PERIOD_STORAGE_KEY,
	setActiveFiscalPeriod,
} from "../fiscal-period";

const ACME = {
	companyId: "cmp-acme",
	companyName: "ACME SAC",
	ruc: "20100000001",
	countryCode: "pe",
	membershipRole: "ADMIN",
	isDefault: true,
};
const BETA = {
	...ACME,
	companyId: "cmp-beta",
	companyName: "BETA SAC",
	ruc: "20100000002",
	isDefault: false,
};

describe("company-context", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("exposes the auth storage keys used by the persisted store", () => {
		expect(AUTH_STORAGE_KEYS).toContain("drenyra-auth-storage");
	});

	describe("mergeUserWithStoredCompanyContext", () => {
		it("fills missing company fields from persisted state", () => {
			localStorage.setItem(
				"drenyra-auth-storage",
				JSON.stringify({
					state: {
						user: {
							companyId: "cmp-1",
							companyName: "X",
							ruc: "201",
							legacyUserId: "u-1",
						},
					},
				}),
			);
			expect(
				mergeUserWithStoredCompanyContext({ id: "a", email: "e" }),
			).toMatchObject({
				id: "a",
				companyId: "cmp-1",
				companyName: "X",
				ruc: "201",
				legacyUserId: "u-1",
			});
		});

		it("never overrides fields the live session already has", () => {
			localStorage.setItem(
				"drenyra-auth-storage",
				JSON.stringify({ state: { user: { companyId: "stale" } } }),
			);
			expect(
				mergeUserWithStoredCompanyContext({ companyId: "live" }),
			).toMatchObject({
				companyId: "live",
			});
		});

		it("ignores corrupt storage and passes non-objects through", () => {
			localStorage.setItem("drenyra-auth-storage", "{not json");
			const user = { id: "a" };
			expect(mergeUserWithStoredCompanyContext(user)).toEqual(user);
			expect(mergeUserWithStoredCompanyContext(null)).toBeNull();
		});
	});

	describe("active company", () => {
		it("activates the default company and lists the granted ones", () => {
			syncActiveCompanyContextFromUser({ availableCompanies: [BETA, ACME] });
			const state = readActiveCompanyState();
			expect(state?.active.companyId).toBe("cmp-acme");
			expect(state?.active.countryCode).toBe("PE");
			expect(state?.available.map((c) => c.companyId)).toEqual([
				"cmp-beta",
				"cmp-acme",
			]);
		});

		it("falls back to the user's own company when no list is granted", () => {
			syncActiveCompanyContextFromUser({
				companyId: "cmp-1",
				companyName: "Solo",
				ruc: "201",
			});
			expect(readActiveCompanyState()?.active).toMatchObject({
				companyId: "cmp-1",
			});
		});

		it("refuses to switch to a company the session did not grant", () => {
			syncActiveCompanyContextFromUser({ availableCompanies: [ACME] });
			expect(setActiveCompanyById("cmp-other-tenant")).toBe(false);
			expect(readActiveCompanyState()?.active.companyId).toBe("cmp-acme");
		});

		it("switches between granted companies and keeps the choice on re-sync", () => {
			const user = { availableCompanies: [ACME, BETA] };
			syncActiveCompanyContextFromUser(user);
			expect(setActiveCompanyById("cmp-beta")).toBe(true);
			syncActiveCompanyContextFromUser(user);
			expect(readActiveCompanyState()?.active.companyId).toBe("cmp-beta");
		});

		it("drops a previous choice the session no longer grants", () => {
			syncActiveCompanyContextFromUser({ availableCompanies: [ACME, BETA] });
			setActiveCompanyById("cmp-beta");
			syncActiveCompanyContextFromUser({ availableCompanies: [ACME] });
			expect(readActiveCompanyState()?.active.companyId).toBe("cmp-acme");
		});

		it("clears the company and fiscal period on logout", () => {
			syncActiveCompanyContextFromUser({ availableCompanies: [ACME] });
			setActiveFiscalPeriod("2026-07");
			clearActiveCompanyContext();
			expect(localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)).toBeNull();
			expect(localStorage.getItem(ACTIVE_FISCAL_PERIOD_STORAGE_KEY)).toBeNull();
		});

		it("ignores a corrupt persisted company", () => {
			localStorage.setItem(
				ACTIVE_COMPANY_STORAGE_KEY,
				JSON.stringify({ active: { companyId: 5 } }),
			);
			expect(readActiveCompanyState()).toBeNull();
		});
	});
});
