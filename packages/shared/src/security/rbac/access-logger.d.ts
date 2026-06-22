export interface AccessLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    result: "ALLOW" | "DENY" | "FAILED";
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
}
export interface FailedLoginAttempt {
    userId?: string;
    email: string;
    ipAddress: string;
    timestamp: Date;
    reason: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "MFA_REQUIRED";
}
export declare const ADMIN_ONLY_ACTIONS: readonly ["company:delete", "users:create_staff", "audit:read", "accounting:close"];
export declare const PROTECTED_RESOURCES: readonly ["ledger:delete", "ledger:override", "journal:delete", "users:delete"];
export type AdminOnlyAction = (typeof ADMIN_ONLY_ACTIONS)[number];
export type ProtectedResource = (typeof PROTECTED_RESOURCES)[number];
export declare function requiresAdminRole(action: string): boolean;
export declare function isProtectedResource(resource: string): boolean;
export declare function shouldLogAccess(action: string, result: AccessLog["result"]): boolean;
export declare function createAccessLogEntry(userId: string, action: string, resource: string, result: AccessLog["result"], options?: Partial<Pick<AccessLog, "ipAddress" | "userAgent" | "details">>): AccessLog;
export declare function createFailedLoginEntry(email: string, ipAddress: string, reason: FailedLoginAttempt["reason"]): FailedLoginAttempt;
//# sourceMappingURL=access-logger.d.ts.map