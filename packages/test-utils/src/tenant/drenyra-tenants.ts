/**
 * Drenyra-specific multi-tenant test fixtures for H02 Tenant Isolation Hardening.
 *
 * Provides fully isolated Organization + Company hierarchies for cross-tenant tests.
 *
 * Structure:
 *   Organization A (org-a, "Drenyra SAC", id=1)
 *     ├── Company A1 (company-a1, "Drenyra Principal", RUC: 20546296564)
 *     └── Company A2 (company-a2, "Drenyra Secundaria", RUC: 20601234573)
 *
 *   Organization B (org-b, "Competencia SAC", id=2)
 *     └── Company B1 (company-b1, "Competencia Única", RUC: 20601234581)
 *
 * Each fixture produces ready-to-use TenantScope and OrganizationScope objects
 * for direct use in repository and application tests.
 *
 * @module test-utils/tenant
 */

import type {
	AuthUser,
	User,
	Organization,
	Company,
	AuthUserCompany,
	OrganizationScope,
	TenantScope,
} from "./types";

// ============================================================
// CONSTANTS — Stable IDs for test reproducibility
// ============================================================

export const ORG_A_ID = 1;
export const ORG_B_ID = 2;

export const COMPANY_A1_ID = "00000000-0000-0000-0000-0000000000a1";
export const COMPANY_A2_ID = "00000000-0000-0000-0000-0000000000a2";
export const COMPANY_B1_ID = "00000000-0000-0000-0000-0000000000b1";

export const USER_A_ID = "00000000-0000-0000-0000-00000000000a";
export const USER_B_ID = "00000000-0000-0000-0000-00000000000b";

export const AUTH_USER_A_ID = "auth-user-a";
export const AUTH_USER_B_ID = "auth-user-b";

// ============================================================
// SCOPE HELPERS
// ============================================================

export const orgAScope: OrganizationScope = {
	organizationId: String(ORG_A_ID),
};
export const orgBScope: OrganizationScope = {
	organizationId: String(ORG_B_ID),
};

export const tenantA1Scope: TenantScope = {
	organizationId: String(ORG_A_ID),
	companyId: COMPANY_A1_ID,
};
export const tenantA2Scope: TenantScope = {
	organizationId: String(ORG_A_ID),
	companyId: COMPANY_A2_ID,
};
export const tenantB1Scope: TenantScope = {
	organizationId: String(ORG_B_ID),
	companyId: COMPANY_B1_ID,
};

// ============================================================
// FIXTURE DATA
// ============================================================

/** Pre-built Organization fixture rows. */
export const organizationFixtures: Organization[] = [
	{
		id: ORG_A_ID,
		name: "Drenyra SAC",
		ruc: "20546296564",
		slug: "drenyra-sac",
		status: "ACTIVE",
		isActive: true,
		businessName: "Drenyra SAC",
		settings: {},
		healthScore: 100,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: ORG_B_ID,
		name: "Competencia SAC",
		ruc: "20601234573",
		slug: "competencia-sac",
		status: "ACTIVE",
		isActive: true,
		businessName: "Competencia SAC",
		settings: {},
		healthScore: 100,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
];

/** Pre-built User fixture rows (linked to Drenyra users table). */
export const userFixtures: User[] = [
	{
		id: USER_A_ID,
		email: "admin@drenyra.com",
		name: "Admin Drenyra",
		role: "ADMIN",
		organizationId: ORG_A_ID,
		isActive: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: USER_B_ID,
		email: "admin@competencia.com",
		name: "Admin Competencia",
		role: "ADMIN",
		organizationId: ORG_B_ID,
		isActive: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
];

/** Pre-built Better Auth user fixture rows. */
export const authUserFixtures: AuthUser[] = [
	{
		id: AUTH_USER_A_ID,
		name: "Admin Drenyra",
		email: "admin@drenyra.com",
		emailVerified: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: AUTH_USER_B_ID,
		name: "Admin Competencia",
		email: "admin@competencia.com",
		emailVerified: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
];

/** Pre-built Company fixture rows. */
export const companyFixtures: Company[] = [
	{
		id: COMPANY_A1_ID,
		ownerId: USER_A_ID,
		ruc: "20546296564",
		businessName: "Drenyra Principal",
		tradeName: "Drenyra Principal",
		countryCode: "pe",
		isActive: true,
		isPrimary: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: COMPANY_A2_ID,
		ownerId: USER_A_ID,
		ruc: "20601234573",
		businessName: "Drenyra Secundaria",
		tradeName: "Drenyra Secundaria",
		countryCode: "pe",
		isActive: true,
		isPrimary: false,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: COMPANY_B1_ID,
		ownerId: USER_B_ID,
		ruc: "20601234581",
		businessName: "Competencia Única",
		tradeName: "Competencia Única",
		countryCode: "pe",
		isActive: true,
		isPrimary: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
];

/** Pre-built AuthUserCompany bridge fixture rows. */
export const authUserCompanyFixtures: AuthUserCompany[] = [
	{
		id: "membership-a-a1",
		userId: AUTH_USER_A_ID,
		companyId: COMPANY_A1_ID,
		membershipRole: "OWNER",
		isDefault: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: "membership-a-a2",
		userId: AUTH_USER_A_ID,
		companyId: COMPANY_A2_ID,
		membershipRole: "ACCOUNTANT",
		isDefault: false,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
	{
		id: "membership-b-b1",
		userId: AUTH_USER_B_ID,
		companyId: COMPANY_B1_ID,
		membershipRole: "OWNER",
		isDefault: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	},
];
