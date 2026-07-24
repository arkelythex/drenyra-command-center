/**
 * Type definitions for Drenyra multi-tenant test fixtures.
 *
 * These mirror the DB schema shapes. They are NOT the canonical domain
 * types — those are defined in Wave 1 (H02.1). These are test-only
 * representations used to create seed data.
 */

/** Mirror of organizations table row. */
export interface Organization {
	id: number;
	name: string;
	ruc: string;
	slug: string;
	status: string;
	isActive: boolean;
	businessName: string | null;
	settings: Record<string, unknown>;
	healthScore: number | null;
	createdAt: Date;
	updatedAt: Date;
}

/** Mirror of users table row. */
export interface User {
	id: string;
	email: string;
	name: string;
	role: string;
	organizationId: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Mirror of companies table row. */
export interface Company {
	id: string;
	ownerId: string;
	ruc: string;
	businessName: string;
	tradeName: string | null;
	countryCode: string;
	isActive: boolean;
	isPrimary: boolean;
	economicGroupId?: string | null;
	address?: string | null;
	logoUrl?: string | null;
	settingsLanguage?: string;
	settingsTimezone?: string;
	settingsCurrency?: string;
	settingsAutoClosePeriod?: boolean;
	settingsShowAmountsInWords?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Mirror of auth_users table row. */
export interface AuthUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	ruc?: string;
	failedLoginAttempts?: number;
	lockedUntil?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/** Mirror of auth_user_companies table row. */
export interface AuthUserCompany {
	id: string;
	userId: string;
	companyId: string;
	membershipRole: string;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Pre-built OrganizationScope for tests. */
export interface OrganizationScope {
	organizationId: string;
}

/** Pre-built TenantScope for tests. */
export interface TenantScope {
	organizationId: string;
	companyId: string;
}
