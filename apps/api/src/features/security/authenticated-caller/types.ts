import type { HeaderContainer } from "../../auth/handlers/session-identity";

export const AUTHENTICATED_CALLER_KIND = {
	SESSION: "session",
	MACHINE: "machine",
	HEADER_FALLBACK: "header-fallback",
} as const;

export type AuthenticatedCallerKind =
	(typeof AUTHENTICATED_CALLER_KIND)[keyof typeof AUTHENTICATED_CALLER_KIND];

export interface AuthenticatedCaller {
	kind: AuthenticatedCallerKind;
	userId: string;
	authUserId: string;
	legacyUserId: string | null;
	role: string;
	companyId: string | null;
	sessionId: string | null;
	serviceId: string | null;
}

export type AuthenticatedCallerResult =
	| {
			ok: true;
			caller: AuthenticatedCaller;
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  };

export interface ResolveAuthenticatedCallerInput {
	headers: HeaderContainer;
	requestedCompanyId?: string;
	requireSession?: boolean;
	allowHeaderFallback?: boolean;
	allowMachineCaller?: boolean;
	machineCallerAllowlist?: readonly string[];
	requireTenant?: boolean;
	requireRole?: boolean;
}

export interface TrustedMachineCallerAllowlistInput {
	allowlist?: readonly string[];
	envVarName?: string;
}
