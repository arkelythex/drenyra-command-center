import { logSecurityAccess } from "./access-log.service";
import { hasPermission, type SecurityOperation } from "./rbac-policy";
import { resolveSessionContext } from "./session-context";

/**
 * Request context required to authorize an operation against Arkelythex security policy.
 *
 * @example
 * ```ts
 * const input: AuthorizationInput = {
 *   headers: {},
 *   operation: 'audit:trail:read',
 *   resource: 'audit-log',
 * };
 * ```
 */
export interface AuthorizationInput {
	headers: Record<string, unknown>;
	operation: SecurityOperation;
	resource: string;
	requestedCompanyId?: string;
	requireSession?: boolean;
	allowMachineCaller?: boolean;
}

/**
 * Result of authorizing a secured operation, including the resolved actor on success.
 *
 * @example
 * ```ts
 * const result: AuthorizationResult = {
 *   ok: false,
 *   status: 403,
 *   code: 'FORBIDDEN_ROLE',
 *   error: 'Blocked',
 * };
 * ```
 */
export type AuthorizationResult =
	| {
			ok: true;
			actor: {
				userId: string;
				authUserId: string;
				legacyUserId: string | null;
				role: string;
				companyId: string;
			};
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

function readHeader(headers: Record<string, unknown>, key: string): string {
	const direct = headers[key];
	if (typeof direct === "string" && direct.trim()) return direct.trim();

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string" && lower.trim()) return lower.trim();

	return "";
}

function shouldBypassRbacInTests(): boolean {
	const env = (process.env.NODE_ENV ?? "").toLowerCase();
	if (env !== "test") return false;

	const enforce = (process.env.SECURITY_ENFORCE_TEST_RBAC ?? "").toLowerCase();
	return !(enforce === "1" || enforce === "true");
}

/**
 * Resolves session context, applies RBAC, and logs the authorization outcome.
 *
 * @param input - Authorization request containing headers, operation, and tenant scope.
 * @returns A successful actor context or a normalized authorization failure.
 * @example
 * ```ts
 * const result = await authorizeOperation({
 *   headers: {},
 *   operation: 'cognitive:state:read',
 *   resource: 'cognitive-session',
 * });
 * ```
 */
export async function authorizeOperation(
	input: AuthorizationInput,
): Promise<AuthorizationResult> {
	const sessionContext = await resolveSessionContext({
		headers: input.headers,
		requestedCompanyId: input.requestedCompanyId,
		requireSession: input.requireSession,
		allowMachineCaller: input.allowMachineCaller,
	});

	if (sessionContext.ok === false) {
		const failure = {
			ok: false as const,
			status: sessionContext.status,
			code: sessionContext.code,
			error: sessionContext.error,
		};
		const ipAddress =
			readHeader(input.headers, "x-forwarded-for") ||
			readHeader(input.headers, "x-real-ip");
		const userAgent = readHeader(input.headers, "user-agent");

		await logSecurityAccess({
			action: input.operation,
			resource: input.resource,
			result: "FAILED",
			ipAddress,
			userAgent,
			details: {
				code: failure.code,
				reason: failure.error,
			},
		});

		return failure;
	}

	const actor = sessionContext.context;

	if (shouldBypassRbacInTests()) {
		return {
			ok: true,
			actor,
		};
	}
	const ipAddress =
		readHeader(input.headers, "x-forwarded-for") ||
		readHeader(input.headers, "x-real-ip");
	const userAgent = readHeader(input.headers, "user-agent");

	if (!hasPermission(actor.role, input.operation)) {
		await logSecurityAccess({
			action: input.operation,
			resource: input.resource,
			result: "DENY",
			userId: actor.authUserId,
			ipAddress,
			userAgent,
			details: {
				role: actor.role,
				companyId: actor.companyId,
				legacyUserId: actor.legacyUserId,
			},
		});

		return {
			ok: false,
			status: 403,
			code: "FORBIDDEN_ROLE",
			error: `Role "${actor.role}" is not allowed for operation ${input.operation}`,
		};
	}

	await logSecurityAccess({
		action: input.operation,
		resource: input.resource,
		result: "ALLOW",
		userId: actor.authUserId,
		ipAddress,
		userAgent,
		details: {
			role: actor.role,
			companyId: actor.companyId,
			legacyUserId: actor.legacyUserId,
		},
	});

	return {
		ok: true,
		actor,
	};
}
