export function createFiscalScope(input) {
    if (!input.company.id || !input.company.organizationId) {
        throw new Error("Company must have id and organizationId");
    }
    if (input.company.ruc?.length !== 11) {
        throw new Error("Company must have a valid 11-digit RUC");
    }
    if (!input.period || !/^\d{4}-\d{2}$/.test(input.period)) {
        throw new Error("Period must be in YYYY-MM format");
    }
    return {
        organizationId: input.company.organizationId,
        companyId: input.company.id,
        companyRuc: input.company.ruc,
        period: input.period,
        countryCode: input.company.countryCode,
    };
}
export const ACTIVE_MEMBERSHIP_STATUSES = ["active"];
export function isActiveMembership(membership) {
    return ACTIVE_MEMBERSHIP_STATUSES.includes(membership.status);
}
export const ROLE_PERMISSIONS = {
    OWNER: [
        "journal:read",
        "journal:create",
        "journal:update",
        "journal:delete",
        "document:read",
        "document:upload",
        "evidence:read",
        "evidence:download",
        "finding:read",
        "finding:resolve",
        "approval:request",
        "approval:decide",
        "sire:submit",
        "report:generate",
        "audit:read",
        "company:read",
        "company:update",
        "settings:read",
        "settings:update",
        "user:invite",
    ],
    ADMIN: [
        "journal:read",
        "journal:create",
        "journal:update",
        "journal:delete",
        "document:read",
        "document:upload",
        "evidence:read",
        "evidence:download",
        "finding:read",
        "finding:resolve",
        "approval:request",
        "approval:decide",
        "sire:submit",
        "report:generate",
        "audit:read",
        "company:read",
        "company:update",
        "settings:read",
        "settings:update",
        "user:invite",
    ],
    ACCOUNTANT: [
        "journal:read",
        "journal:create",
        "journal:update",
        "journal:delete",
        "document:read",
        "document:upload",
        "evidence:read",
        "evidence:download",
        "finding:read",
        "finding:resolve",
        "approval:request",
        "sire:submit",
        "report:generate",
        "company:read",
        "settings:read",
    ],
    REVIEWER: [
        "journal:read",
        "document:read",
        "evidence:read",
        "evidence:download",
        "finding:read",
        "report:generate",
        "company:read",
    ],
    APPROVER: [
        "document:read",
        "evidence:read",
        "evidence:download",
        "approval:decide",
        "company:read",
    ],
    VIEWER: [
        "document:read",
        "evidence:read",
        "evidence:download",
        "company:read",
    ],
};
//# sourceMappingURL=types.js.map