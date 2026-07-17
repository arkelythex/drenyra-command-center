/**
 * Core IAM types for the ARKELYTHEX Platform.
 *
 * These define the identity model shared across all domains.
 * Every domain references these types for users, orgs, and permissions.
 */

/** Unique identifier branded type for type safety */
export type UserId = string & { readonly __brand: "UserId" };
export type OrganizationId = string & { readonly __brand: "OrganizationId" };
export type RoleId = string & { readonly __brand: "RoleId" };
export type PermissionId = string & { readonly __brand: "PermissionId" };

/** Core user identity — shared across ALL domains */
export interface CoreUser {
	id: UserId;
	email: string;
	name: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Organization / tenant — the top-level entity in the platform */
export interface CoreOrganization {
	id: OrganizationId;
	ruc: string;
	businessName: string;
	tradeName?: string;
	countryCode: string;
	isActive: boolean;
	settings: {
		language: string;
		timezone: string;
		currency: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

/** Role definition for RBAC — scoped to an organization */
export interface CoreRole {
	id: RoleId;
	organizationId: OrganizationId;
	name: string;
	description?: string;
	isSystem: boolean;
	permissions: CorePermission[];
	createdAt: Date;
}

/** Individual permission — an action on a resource within a domain */
export interface CorePermission {
	id: PermissionId;
	roleId: RoleId;
	domain: string;
	resource: string;
	action: "create" | "read" | "update" | "delete" | "approve";
	conditions?: Record<string, unknown>;
}

/** Membership of a user in an organization with a role */
export interface CoreMembership {
	userId: UserId;
	organizationId: OrganizationId;
	roleId: RoleId;
	isDefault: boolean;
	joinedAt: Date;
}
