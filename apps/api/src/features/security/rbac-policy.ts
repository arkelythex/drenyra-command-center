/**
 * Allowed security operations that can be checked through RBAC.
 *
 * @example
 * ```ts
 * const op: SecurityOperation = 'audit:trail:read';
 * ```
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
 * Identity information required to evaluate RBAC rules for a request.
 *
 * @example
 * ```ts
 * const actor: SecurityActor = { userId: 'usr_1', role: 'admin', companyId: 'cmp_1' };
 * ```
 */
export interface SecurityActor {
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	role: string;
	companyId: string;
}

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

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

/**
 * Builds a normalized actor from request headers when the minimum identity context is present.
 *
 * @param headers - Request headers carrying `x-user-id`, `x-user-role`, and optional tenant scope.
 * @returns The resolved actor or `null` when mandatory headers are missing.
 * @example
 * ```ts
 * const actor = resolveSecurityActor({
 *   'x-user-id': 'usr_1',
 *   'x-user-role': 'admin',
 *   'x-company-id': 'cmp_1',
 * });
 * ```
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
 * Checks whether a role can perform a given security operation.
 *
 * @param role - Caller role to evaluate.
 * @param operation - Operation requested by the caller.
 * @returns `true` when the role has permission for the operation.
 * @example
 * ```ts
 * const allowed = hasPermission('admin', 'audit:trail:export');
 * console.log(allowed); // true
 * ```
 */
export function hasPermission(
	role: string,
	operation: SecurityOperation,
): boolean {
	const rolePermissions = ROLE_PERMISSIONS[role.toLowerCase()];
	if (!rolePermissions) return false;
	return rolePermissions.has(operation);
}
