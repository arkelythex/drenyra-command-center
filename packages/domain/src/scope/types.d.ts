export interface OrganizationScope {
    organizationId: string;
}
export interface TenantScope {
    organizationId: string;
    companyId: string;
}
export interface FiscalScope {
    organizationId: string;
    companyId: string;
    companyRuc: string;
    period: string;
    countryCode: string;
}
export interface FiscalScopeInput {
    company: {
        id: string;
        organizationId: string;
        ruc: string;
        countryCode: string;
    };
    period: string;
}
export declare function createFiscalScope(input: FiscalScopeInput): FiscalScope;
export interface AuthenticatedContext {
    userId: string;
    organizationId: string;
    memberships: OrganizationMembership[];
}
export interface OrganizationMembership {
    organizationId: string;
    companyId: string;
    companyRuc: string;
    role: MembershipRole;
    isDefault: boolean;
    status: MembershipStatus;
    permissions: Permission[];
}
export type MembershipStatus = "active" | "suspended" | "revoked" | "expired";
export declare const ACTIVE_MEMBERSHIP_STATUSES: MembershipStatus[];
export declare function isActiveMembership(membership: OrganizationMembership): boolean;
export type MembershipRole = "OWNER" | "ADMIN" | "ACCOUNTANT" | "REVIEWER" | "APPROVER" | "VIEWER";
export type Permission = "journal:read" | "journal:create" | "journal:update" | "journal:delete" | "document:read" | "document:upload" | "evidence:read" | "evidence:download" | "finding:read" | "finding:resolve" | "approval:request" | "approval:decide" | "sire:submit" | "report:generate" | "audit:read" | "company:read" | "company:update" | "settings:read" | "settings:update" | "user:invite";
export declare const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]>;
//# sourceMappingURL=types.d.ts.map