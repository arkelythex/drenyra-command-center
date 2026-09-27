import { hasBusinessPermission, isRoleHigher as unifiedIsRoleHigher, RBAC_FEATURE_FLAGS, } from "@drenyra/security/rbac";
export class ForbiddenError extends Error {
    constructor(message = "Forbidden") {
        super(message);
        this.name = "ForbiddenError";
    }
}
export const ROLES = {
    OWNER: "owner",
    SENIOR: "senior",
    JUNIOR: "junior",
    CLIENT: "client",
};
const ROLE_PERMISSIONS = {
    owner: [
        "company:create",
        "company:delete",
        "company:update",
        "company:read",
        "journal:read",
        "journal:create",
        "journal:update",
        "journal:update_draft",
        "journal:delete",
        "sunat:declare",
        "sunat:read",
        "accounting:close",
        "accounting:open",
        "reports:read_all",
        "reports:read_operational",
        "reports:read_basic",
        "payroll:read",
        "payroll:manage",
        "users:create_staff",
        "users:invite_team",
        "users:read",
        "audit:read",
    ],
    senior: [
        "company:update",
        "company:read",
        "journal:read",
        "journal:create",
        "journal:update",
        "journal:update_draft",
        "journal:delete",
        "sunat:declare",
        "sunat:read",
        "accounting:close",
        "reports:read_all",
        "reports:read_operational",
        "reports:read_basic",
        "payroll:read",
        "payroll:manage",
        "users:read",
    ],
    junior: [
        "company:read",
        "journal:read",
        "journal:create",
        "journal:update_draft",
        "sunat:read",
        "reports:read_operational",
        "reports:read_basic",
        "users:read",
    ],
    client: [
        "company:read",
        "reports:read_basic",
        "payroll:read",
        "users:invite_team",
    ],
};
const LEGACY_ROLE_HIERARCHY = {
    client: 1,
    junior: 2,
    senior: 3,
    owner: 4,
};
function mapLegacyRole(role) {
    switch (role) {
        case "owner":
            return "owner";
        case "senior":
            return "senior";
        case "junior":
            return "junior";
        case "client":
            return "client";
    }
}
function mapLegacyPermission(perm) {
    return `business:${perm}`;
}
export function roleHasPermission(role, permission) {
    if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
        return hasBusinessPermission(mapLegacyRole(role), mapLegacyPermission(permission));
    }
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
}
export function userHasPermission(user, permission) {
    return roleHasPermission(user.role, permission);
}
export function requirePermission(user, permission) {
    if (!userHasPermission(user, permission)) {
        throw new ForbiddenError(`Permission denied: ${permission} (your role: ${user.role})`);
    }
}
export function isRoleHigher(roleA, roleB) {
    if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
        return unifiedIsRoleHigher(mapLegacyRole(roleA), mapLegacyRole(roleB));
    }
    return LEGACY_ROLE_HIERARCHY[roleA] > LEGACY_ROLE_HIERARCHY[roleB];
}
//# sourceMappingURL=permissions.js.map