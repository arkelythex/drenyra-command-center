import type { User } from "./auth-utils";
export declare class ForbiddenError extends Error {
    constructor(message?: string);
}
export type Role = "owner" | "senior" | "junior" | "client";
export declare const ROLES: {
    OWNER: "owner";
    SENIOR: "senior";
    JUNIOR: "junior";
    CLIENT: "client";
};
export type Permission = "company:create" | "company:delete" | "company:update" | "company:read" | "journal:read" | "journal:create" | "journal:update" | "journal:update_draft" | "journal:delete" | "sunat:declare" | "sunat:read" | "accounting:close" | "accounting:open" | "reports:read_all" | "reports:read_operational" | "reports:read_basic" | "payroll:read" | "payroll:manage" | "users:create_staff" | "users:invite_team" | "users:read" | "audit:read";
export declare function roleHasPermission(role: Role, permission: Permission): boolean;
export declare function userHasPermission(user: User, permission: Permission): boolean;
export declare function requirePermission(user: User, permission: Permission): void;
export declare function isRoleHigher(roleA: Role, roleB: Role): boolean;
//# sourceMappingURL=permissions.d.ts.map