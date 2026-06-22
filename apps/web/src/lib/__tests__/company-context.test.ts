import { beforeEach, describe, expect, it } from "vitest";
import {
	ACTIVE_COMPANY_STORAGE_KEY,
	clearActiveCompanyContext,
	DEMO_COMPANY_ID,
	DEMO_COMPANY_NAME,
	DEMO_COMPANY_RUC,
	getAvailableCompanyContexts,
	getCompanyContext,
	mergeUserWithStoredCompanyContext,
	setActiveCompanyContext,
	syncActiveCompanyContextFromUser,
} from "../company-context";

describe("getCompanyContext", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns the seeded demo company when auth storage is empty", () => {
		expect(getCompanyContext()).toEqual({
			companyId: DEMO_COMPANY_ID,
			companyName: DEMO_COMPANY_NAME,
			ruc: DEMO_COMPANY_RUC,
			countryCode: "pe",
			isDemoFallback: true,
		});
	});

	it("reads the authenticated company context when available", () => {
		localStorage.setItem(
			"arkelythex-auth",
			JSON.stringify({
				state: {
					user: {
						companyId: "11111111-1111-1111-1111-111111111111",
						companyName: "LOGISTICA REAL S.A.C.",
						ruc: "20123456789",
					},
				},
			}),
		);

		expect(getCompanyContext()).toEqual({
			companyId: "11111111-1111-1111-1111-111111111111",
			companyName: "LOGISTICA REAL S.A.C.",
			ruc: "20123456789",
			countryCode: "pe",
			isDemoFallback: false,
		});
	});

	it("prefers the explicit active company override when it exists", () => {
		setActiveCompanyContext({
			companyId: "22222222-2222-2222-2222-222222222222",
			companyName: "GRUPO BETA S.A.C.",
			ruc: "20567891234",
		});

		expect(getCompanyContext()).toEqual({
			companyId: "22222222-2222-2222-2222-222222222222",
			companyName: "GRUPO BETA S.A.C.",
			ruc: "20567891234",
			countryCode: "pe",
			isDemoFallback: false,
		});
	});

	it("clears the active company override cleanly", () => {
		localStorage.setItem(
			ACTIVE_COMPANY_STORAGE_KEY,
			JSON.stringify({
				companyId: "22222222-2222-2222-2222-222222222222",
				companyName: "GRUPO BETA S.A.C.",
				ruc: "20567891234",
			}),
		);

		clearActiveCompanyContext();

		expect(localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)).toBeNull();
	});

	it("hydrates a session user with stored company context when Better Auth omits tenant fields", () => {
		localStorage.setItem(
			"arkelythex-auth",
			JSON.stringify({
				state: {
					user: {
						companyId: "11111111-1111-1111-1111-111111111111",
						companyName: "LOGISTICA REAL S.A.C.",
						ruc: "20123456789",
						role: "ADMIN",
					},
				},
			}),
		);

		expect(
			mergeUserWithStoredCompanyContext({
				id: "usr-1",
				email: "test@empresa.com",
				name: "Test User",
				emailVerified: true,
			}),
		).toEqual({
			id: "usr-1",
			email: "test@empresa.com",
			name: "Test User",
			emailVerified: true,
			companyId: "11111111-1111-1111-1111-111111111111",
			companyName: "LOGISTICA REAL S.A.C.",
			ruc: "20123456789",
			role: "ADMIN",
		});
	});

	it("syncs the selected active company from the user memberships", () => {
		syncActiveCompanyContextFromUser({
			companyId: "11111111-1111-1111-1111-111111111111",
			companyName: "LOGISTICA REAL S.A.C.",
			ruc: "20123456789",
			activeCompanyId: "22222222-2222-2222-2222-222222222222",
			availableCompanies: [
				{
					companyId: "11111111-1111-1111-1111-111111111111",
					companyName: "LOGISTICA REAL S.A.C.",
					ruc: "20123456789",
					isDefault: true,
				},
				{
					companyId: "22222222-2222-2222-2222-222222222222",
					companyName: "GRUPO BETA S.A.C.",
					ruc: "20567891234",
					isDefault: false,
				},
			],
		});

		expect(getCompanyContext()).toEqual({
			companyId: "22222222-2222-2222-2222-222222222222",
			companyName: "GRUPO BETA S.A.C.",
			ruc: "20567891234",
			countryCode: "pe",
			isDemoFallback: false,
		});
	});

	it("returns the available company memberships when present in auth storage", () => {
		localStorage.setItem(
			"arkelythex-auth",
			JSON.stringify({
				state: {
					user: {
						availableCompanies: [
							{
								companyId: "11111111-1111-1111-1111-111111111111",
								companyName: "LOGISTICA REAL S.A.C.",
								ruc: "20123456789",
							},
							{
								companyId: "22222222-2222-2222-2222-222222222222",
								companyName: "GRUPO BETA S.A.C.",
								ruc: "20567891234",
							},
						],
					},
				},
			}),
		);

		expect(getAvailableCompanyContexts()).toEqual([
			{
				companyId: "11111111-1111-1111-1111-111111111111",
				companyName: "LOGISTICA REAL S.A.C.",
				ruc: "20123456789",
				countryCode: "pe",
				isDemoFallback: false,
			},
			{
				companyId: "22222222-2222-2222-2222-222222222222",
				companyName: "GRUPO BETA S.A.C.",
				ruc: "20567891234",
				countryCode: "pe",
				isDemoFallback: false,
			},
		]);
	});
});
