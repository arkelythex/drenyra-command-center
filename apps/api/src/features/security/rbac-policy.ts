import {
	hasPlatformPermission,
	RBAC_FEATURE_FLAGS,
	type PlatformPermission,
	type UnifiedRole,
} from "@drenyra/security/rbac";

/**
 * @deprecated Use `PlatformPermission` from `@drenyra/security/rbac` instead.
 */
export type SecurityOperation =
	| "ai:tool-permissions:manage"
	| "ai:tool-permissions:read"
	| "cognitive:stream"
	| "cognitive:state:read"
	| "cognitive:approval:resolve"
	| "cognitive:recover"
	| "documents:query:read"
	| "documents:review:update"
	| "documents:upload:create"
	| "sire:audit:stream"
	| "sire:submit"
	| "audit:trail:read"
	| "audit:trail:export"
	| "observability:runs:read"
	| "observability:runs:events:read"
	| "observability:batches:read"
	| "observability:batches:write"
	| "observability:memory:read";

/**
 * @deprecated Use `UnifiedActor` from `@drenyra/security/rbac` instead.
 */
export interface SecurityActor {
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	role: string;
	companyId: string;
}

// ── Legacy role-permission map (fallback when unified disabled) ──

const ROLE_PERMISSIONS: Record<string, ReadonlySet<SecurityOperation>> = {
	superadmin: new Set([
		"ai:tool-permissions:manage",
		"ai:tool-permissions:read",
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:approval:resolve",
		"cognitive:recover",
		"documents:query:read",
		"documents:review:update",
		"documents:upload:create",
		"sire:audit:stream",
		"sire:submit",
		"audit:trail:read",
		"audit:trail:export",
		"observability:runs:read",
		"observability:runs:events:read",
		"observability:batches:read",
		"observability:batches:write",
		"observability:memory:read",
	]),
	admin: new Set([
		"ai:tool-permissions:manage",
		"ai:tool-permissions:read",
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:approval:resolve",
		"cognitive:recover",
		"documents:query:read",
		"documents:review:update",
		"documents:upload:create",
		"sire:audit:stream",
		"sire:submit",
		"audit:trail:read",
		"audit:trail:export",
		"observability:runs:read",
		"observability:runs:events:read",
		"observability:batches:read",
		"observability:batches:write",
		"observability:memory:read",
	]),
	owner: new Set([
		"ai:tool-permissions:manage",
		"ai:tool-permissions:read",
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:approval:resolve",
		"cognitive:recover",
		"documents:query:read",
		"documents:review:update",
		"documents:upload:create",
		"sire:audit:stream",
		"sire:submit",
		"audit:trail:read",
		"audit:trail:export",
		"observability:runs:read",
		"observability:runs:events:read",
		"observability:batches:read",
		"observability:batches:write",
		"observability:memory:read",
	]),
	senior: new Set([
		"ai:tool-permissions:manage",
		"ai:tool-permissions:read",
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:approval:resolve",
		"cognitive:recover",
		"documents:query:read",
		"documents:review:update",
		"documents:upload:create",
		"sire:audit:stream",
		"sire:submit",
		"audit:trail:read",
		"audit:trail:export",
		"observability:runs:read",
		"observability:runs:events:read",
		"observability:batches:read",
		"observability:batches:write",
		"observability:memory:read",
	]),
	analyst: new Set([
		"ai:tool-permissions:read",
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:recover",
		"documents:query:read",
		"documents:review:update",
		"documents:upload:create",
		"sire:audit:stream",
		"audit:trail:read",
		"observability:runs:read",
		"observability:runs:events:read",
		"observability:batches:read",
		"observability:memory:read",
	]),
	service: new Set([
		"cognitive:stream",
		"cognitive:state:read",
		"cognitive:recover",
		"documents:query:read",
	]),
	auditor: new Set([
		"cognitive:state:read",
		"documents:query:read",
		"audit:trail:read",
		"audit:trail:export",
	]),
	viewer: new Set([
		"cognitive:state:read",
		"documents:query:read",
		"audit:trail:read",
	]),
};

// ── Mapping helpers ──

/**
 * Maps a legacy SecurityOperation to a `platform:`-prefixed PlatformPermission.
 */
function mapLegacyOperation(operation: string): PlatformPermission {
	return `platform:${operation}` as PlatformPermission;
}

// ── Header resolution (unchanged from original) ──

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

/**
 * @deprecated Use `resolveActor()` from `@drenyra/security/rbac` instead.
 *
 * Builds a normalized actor from request headers when the minimum identity
 * context is present.
 */
export function resolveSecurityActor(
	headers: Record<string, unknown>,
): SecurityActor | null {
	const authUserId = readHeader(headers, "x-auth-user-id");
	const legacyUserId = readHeader(headers, "x-user-id");
	const userId = authUserId || legacyUserId;
	const role = readHeader(headers, "x-user-role").toLowerCase();
	const companyId = readHeader(headers, "x-company-id") || "global";

	if (!userId || !role) return null;

	return {
		userId,
		authUserId: authUserId || userId,
		legacyUserId: legacyUserId || null,
		role,
		companyId,
	};
}

/**
 * @deprecated Use `hasPlatformPermission()` from `@drenyra/security/rbac` instead.
 *
 * Checks whether a role can perform a given security operation.
 * When `UNIFIED_RBAC_ENABLED` is true, delegates to the unified guard.
 */
export function hasPermission(
	role: string,
	operation: SecurityOperation,
): boolean {
	if (RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED) {
		return hasPlatformPermission(
			role.toLowerCase() as UnifiedRole,
			mapLegacyOperation(operation),
		);
	}

	// Fallback: original logic
	const rolePermissions = ROLE_PERMISSIONS[role.toLowerCase()];
	if (!rolePermissions) return false;
	return rolePermissions.has(operation);
}
