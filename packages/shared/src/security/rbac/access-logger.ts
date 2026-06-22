/**
 * Audit log entry for security-sensitive access decisions.
 *
 * @example
 * ```ts
 * const entry: AccessLog = {
 *   id: "log_1",
 *   userId: "usr_1",
 *   action: "company:delete",
 *   resource: "company:123",
 *   result: "DENY",
 *   timestamp: new Date(),
 * };
 * ```
 */
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

/**
 * Structured record for failed login telemetry.
 *
 * @example
 * ```ts
 * const failed: FailedLoginAttempt = {
 *   email: "ops@arkelythexfounders.com",
 *   ipAddress: "203.0.113.10",
 *   timestamp: new Date(),
 *   reason: "INVALID_CREDENTIALS",
 * };
 * ```
 */
export interface FailedLoginAttempt {
	userId?: string;
	email: string;
	ipAddress: string;
	timestamp: Date;
	reason: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "MFA_REQUIRED";
}

/**
 * Actions that must be executed only by admin-level identities.
 *
 * @example
 * ```ts
 * console.log(ADMIN_ONLY_ACTIONS);
 * ```
 */
export const ADMIN_ONLY_ACTIONS = [
	"company:delete",
	"users:create_staff",
	"audit:read",
	"accounting:close",
] as const;

/**
 * Resources that always require access logging.
 *
 * @example
 * ```ts
 * console.log(PROTECTED_RESOURCES);
 * ```
 */
export const PROTECTED_RESOURCES = [
	"ledger:delete",
	"ledger:override",
	"journal:delete",
	"users:delete",
] as const;

/**
 * Union type generated from `ADMIN_ONLY_ACTIONS`.
 *
 * @example
 * ```ts
 * const action: AdminOnlyAction = "audit:read";
 * ```
 */
export type AdminOnlyAction = (typeof ADMIN_ONLY_ACTIONS)[number];
/**
 * Union type generated from `PROTECTED_RESOURCES`.
 *
 * @example
 * ```ts
 * const resource: ProtectedResource = "ledger:delete";
 * ```
 */
export type ProtectedResource = (typeof PROTECTED_RESOURCES)[number];

/**
 * Returns whether an action belongs to the admin-only policy list.
 *
 * @param action - Action identifier to evaluate
 * @returns `true` when action requires admin role
 * @example
 * ```ts
 * const isAdminOnly = requiresAdminRole("audit:read");
 * ```
 */
export function requiresAdminRole(action: string): boolean {
	return ADMIN_ONLY_ACTIONS.includes(action as AdminOnlyAction);
}

/**
 * Returns whether a resource is in the protected-resource registry.
 *
 * @param resource - Resource identifier to evaluate
 * @returns `true` when resource should always be logged
 * @example
 * ```ts
 * const isProtected = isProtectedResource("ledger:delete");
 * ```
 */
export function isProtectedResource(resource: string): boolean {
	return PROTECTED_RESOURCES.includes(resource as ProtectedResource);
}

/**
 * Computes whether an access decision must be written to audit logs.
 *
 * @param action - Action identifier
 * @param result - Access outcome (`ALLOW`, `DENY`, `FAILED`)
 * @returns `true` when logging is mandatory for this event
 * @example
 * ```ts
 * const shouldLog = shouldLogAccess("company:delete", "DENY");
 * ```
 */
export function shouldLogAccess(
	action: string,
	result: AccessLog["result"],
): boolean {
	if (result === "DENY" || result === "FAILED") return true;
	return isProtectedResource(action) || requiresAdminRole(action);
}

/**
 * Creates a normalized access-log object with generated id/timestamp.
 *
 * @param userId - Actor identifier
 * @param action - Action identifier
 * @param resource - Resource identifier
 * @param result - Access result
 * @param options - Optional network/device/context metadata
 * @returns Complete `AccessLog` entry
 * @example
 * ```ts
 * const entry = createAccessLogEntry("usr_1", "audit:read", "audit", "ALLOW");
 * ```
 */
export function createAccessLogEntry(
	userId: string,
	action: string,
	resource: string,
	result: AccessLog["result"],
	options?: Partial<Pick<AccessLog, "ipAddress" | "userAgent" | "details">>,
): AccessLog {
	return {
		id: crypto.randomUUID(),
		userId,
		action,
		resource,
		result,
		timestamp: new Date(),
		...options,
	};
}

/**
 * Creates a failed-login record for security telemetry pipelines.
 *
 * @param email - Login email
 * @param ipAddress - Source IP address
 * @param reason - Failure classification
 * @returns Failed login record with generated timestamp
 * @example
 * ```ts
 * const failed = createFailedLoginEntry("ops@arkelythexfounders.com", "203.0.113.10", "MFA_REQUIRED");
 * ```
 */
export function createFailedLoginEntry(
	email: string,
	ipAddress: string,
	reason: FailedLoginAttempt["reason"],
): FailedLoginAttempt {
	return {
		email,
		ipAddress,
		timestamp: new Date(),
		reason,
	};
}
