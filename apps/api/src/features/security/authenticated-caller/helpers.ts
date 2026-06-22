import { createHmac, timingSafeEqual } from "node:crypto";
import type { HeaderContainer } from "../../auth/handlers/session-identity";
import { readHeaderValue } from "../tenant-assertions";
import {
	AUTHENTICATED_CALLER_KIND,
	type AuthenticatedCallerResult,
	type TrustedMachineCallerAllowlistInput,
} from "./types";

interface SignedMachineCaller {
	serviceId: string;
	role: string;
	companyId: string | null;
	authUserId: string;
}

function normalizeRole(value: string): string {
	return value.trim().toLowerCase();
}

function normalizeMachineIdentity(value: string): string {
	return value.trim().toLowerCase();
}

function parseMachineCallerAllowlist(raw: string): string[] {
	return raw
		.split(",")
		.map((serviceId) => normalizeMachineIdentity(serviceId))
		.filter((serviceId) => serviceId.length > 0);
}

export function resolveTrustedMachineCallerAllowlist(
	input?: TrustedMachineCallerAllowlistInput,
): readonly string[] {
	const fromInput = (input?.allowlist ?? [])
		.map((serviceId) => normalizeMachineIdentity(serviceId))
		.filter((serviceId) => serviceId.length > 0);
	if (fromInput.length > 0) return fromInput;

	const envVarName = input?.envVarName?.trim() || "ARKELYTHEX_MACHINE_CALLER_ALLOWLIST";
	return parseMachineCallerAllowlist(process.env[envVarName] ?? "");
}

function resolveMachineCallerAllowlist(
	inputAllowlist?: readonly string[],
): ReadonlySet<string> {
	return new Set(
		resolveTrustedMachineCallerAllowlist({
			allowlist: inputAllowlist,
			envVarName: "ARKELYTHEX_MACHINE_CALLER_ALLOWLIST",
		}),
	);
}

function shouldRequireSession(requireSessionOverride?: boolean): boolean {
	if (typeof requireSessionOverride === "boolean") return requireSessionOverride;

	const env = (process.env.NODE_ENV ?? "").toLowerCase();
	if (env !== "test") return true;

	const enforceInTests = (
		process.env.SECURITY_ENFORCE_TEST_SESSION ?? ""
	).toLowerCase();
	return enforceInTests === "1" || enforceInTests === "true";
}

function validateTenantScope(
	callerCompanyId: string | null,
	assertedCompanyId: string | null,
	requestedCompanyId: string | undefined,
	requireTenant: boolean,
): AuthenticatedCallerResult | null {
	if (
		assertedCompanyId &&
		callerCompanyId &&
		assertedCompanyId !== callerCompanyId
	) {
		return {
			ok: false,
			status: 403,
			code: "AUTH_CONTEXT_MISMATCH",
			error: "Authenticated tenant does not match the tenant assertion headers",
		};
	}

	if (
		requestedCompanyId &&
		callerCompanyId &&
		requestedCompanyId !== callerCompanyId
	) {
		return {
			ok: false,
			status: 403,
			code: "TENANT_SCOPE_VIOLATION",
			error: "Requested companyId does not match caller tenant scope",
		};
	}

	if ((requestedCompanyId || assertedCompanyId) && !callerCompanyId) {
		return {
			ok: false,
			status: 403,
			code: "TENANT_SCOPE_VIOLATION",
			error: "Authenticated caller does not have a tenant scope",
		};
	}

	if (requireTenant && !callerCompanyId) {
		return {
			ok: false,
			status: 401,
			code: "TENANT_REQUIRED",
			error: "Active tenant context is required for this operation",
		};
	}

	return null;
}

function validateRoleRequirement(
	role: string,
	requireRole: boolean,
): AuthenticatedCallerResult | null {
	if (requireRole && role.length === 0) {
		return {
			ok: false,
			status: 401,
			code: "AUTH_REQUIRED",
			error: "Missing auth context headers: x-user-role",
		};
	}

	return null;
}

function resolveMachineSignaturePayload(headers: HeaderContainer): SignedMachineCaller | null {
	const serviceId = readHeaderValue(headers, "x-ark-service-id");
	const role = normalizeRole(
		readHeaderValue(headers, "x-ark-service-role") || "service",
	);
	const companyId =
		readHeaderValue(headers, "x-ark-service-company-id") || null;

	if (!serviceId) return null;

	return {
		serviceId,
		role,
		companyId,
		authUserId: `service:${serviceId}`,
	};
}

function resolveSignedMachineCaller(
	headers: HeaderContainer,
	machineCallerAllowlist: ReadonlySet<string>,
): AuthenticatedCallerResult | null {
	const machineCaller = resolveMachineSignaturePayload(headers);
	if (!machineCaller) return null;

	if (machineCallerAllowlist.size === 0) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_CALLER_DISABLED",
			error:
				"Signed machine callers require an explicit allowlist for this route",
		};
	}

	if (
		!machineCallerAllowlist.has(
			normalizeMachineIdentity(machineCaller.serviceId),
		)
	) {
		return {
			ok: false,
			status: 403,
			code: "MACHINE_CALLER_FORBIDDEN",
			error: "Machine caller is not allowlisted for this route",
		};
	}

	const secret = (process.env.ARKELYTHEX_MACHINE_CALLER_SECRET ?? "").trim();
	if (!secret) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_CALLER_DISABLED",
			error: "Signed machine callers are not enabled for this environment",
		};
	}

	const timestamp = readHeaderValue(headers, "x-ark-service-timestamp");
	const signature = readHeaderValue(headers, "x-ark-service-signature");
	if (!timestamp || !signature) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_AUTH_REQUIRED",
			error: "Signed machine caller headers are incomplete",
		};
	}

	const timestampMs = Number.parseInt(timestamp, 10);
	if (!Number.isFinite(timestampMs)) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_AUTH_INVALID",
			error: "Machine caller timestamp is invalid",
		};
	}

	const maxSkewMs = 5 * 60 * 1000;
	if (Math.abs(Date.now() - timestampMs) > maxSkewMs) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_AUTH_EXPIRED",
			error: "Machine caller signature has expired",
		};
	}

	const payload = [
		machineCaller.serviceId,
		timestamp,
		machineCaller.companyId ?? "",
		machineCaller.role,
	].join(".");
	const expected = createHmac("sha256", secret).update(payload).digest("hex");

	const provided = signature.startsWith("sha256=")
		? signature.slice("sha256=".length)
		: signature;

	const expectedBuffer = Buffer.from(expected, "utf8");
	const providedBuffer = Buffer.from(provided, "utf8");
	if (
		expectedBuffer.length !== providedBuffer.length ||
		!timingSafeEqual(expectedBuffer, providedBuffer)
	) {
		return {
			ok: false,
			status: 401,
			code: "MACHINE_AUTH_INVALID",
			error: "Machine caller signature is invalid",
		};
	}

	return {
		ok: true,
		caller: {
			kind: AUTHENTICATED_CALLER_KIND.MACHINE,
			userId: machineCaller.authUserId,
			authUserId: machineCaller.authUserId,
			legacyUserId: null,
			role: machineCaller.role,
			companyId: machineCaller.companyId,
			sessionId: null,
			serviceId: machineCaller.serviceId,
		},
	};
}

function hasSpoofableHeaderContext(headers: HeaderContainer): boolean {
	const candidateHeaders = [
		"x-auth-user-id",
		"x-user-id",
		"x-user-role",
		"x-company-id",
		"x-active-company-id",
	];

	return candidateHeaders.some(
		(headerName) => readHeaderValue(headers, headerName).length > 0,
	);
}

function resolveHeaderFallbackCaller(
	headers: HeaderContainer,
	companyId: string | null,
	requireRole: boolean,
): AuthenticatedCallerResult {
	const authUserId = readHeaderValue(headers, "x-auth-user-id");
	const legacyUserId = readHeaderValue(headers, "x-user-id") || null;
	const role = normalizeRole(readHeaderValue(headers, "x-user-role"));
	const userId = authUserId || legacyUserId || "";

	if (!userId || (requireRole && role.length === 0)) {
		return {
			ok: false,
			status: 401,
			code: "AUTH_REQUIRED",
			error:
				"Missing auth context headers: x-user-id, x-auth-user-id, x-user-role, x-company-id or x-active-company-id",
		};
	}

	return {
		ok: true,
		caller: {
			kind: AUTHENTICATED_CALLER_KIND.HEADER_FALLBACK,
			userId,
			authUserId: authUserId || userId,
			legacyUserId,
			role,
			companyId,
			sessionId: null,
			serviceId: null,
		},
	};
}

export {
	AUTHENTICATED_CALLER_KIND,
	normalizeRole,
	normalizeMachineIdentity,
	parseMachineCallerAllowlist,
	resolveMachineCallerAllowlist,
	shouldRequireSession,
	validateTenantScope,
	validateRoleRequirement,
	resolveMachineSignaturePayload,
	resolveSignedMachineCaller,
	hasSpoofableHeaderContext,
	resolveHeaderFallbackCaller,
};
