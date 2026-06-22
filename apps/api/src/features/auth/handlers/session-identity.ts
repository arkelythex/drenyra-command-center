import { createLogger } from "../../../lib/logger";
import { auth } from "../auth.config";

const logger = createLogger({ feature: "auth", handler: "session-identity" });

interface SessionCompanyLike {
	companyId?: string;
}

interface BetterAuthSessionUserLike {
	id?: string;
	legacyUserId?: string;
	role?: string;
	companyId?: string;
	activeCompanyId?: string;
	availableCompanies?: SessionCompanyLike[];
}

interface BetterAuthSessionPayload {
	session?: {
		id?: string;
	} | null;
	user?: BetterAuthSessionUserLike | null;
}

export interface ResolvedSessionIdentity {
	authUserId: string;
	legacyUserId: string | null;
	role: string | null;
	companyId: string | null;
	activeCompanyId: string | null;
	availableCompanyIds: string[];
	sessionId: string | null;
}

export type HeaderContainer = Headers | Record<string, unknown>;

function normalizeSessionString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function resolveAvailableCompanyIds(value: unknown): string[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((company) => {
			if (!company || typeof company !== "object") return "";
			return normalizeSessionString((company as SessionCompanyLike).companyId);
		})
		.filter((companyId) => companyId.length > 0);
}

function emptyResolvedSessionIdentity(): ResolvedSessionIdentity {
	return {
		authUserId: "",
		legacyUserId: null,
		role: null,
		companyId: null,
		activeCompanyId: null,
		availableCompanyIds: [],
		sessionId: null,
	};
}

export function buildForwardedAuthHeaders(
	headers: HeaderContainer,
): Record<string, string> {
	const normalized: Record<string, string> = {};
	const forwardList = [
		"cookie",
		"authorization",
		"host",
		"origin",
		"x-forwarded-host",
		"x-forwarded-proto",
	];

	for (const headerName of forwardList) {
		const value =
			headers instanceof Headers
				? (headers.get(headerName) ??
					headers.get(headerName.toLowerCase()) ??
					undefined)
				: (headers[headerName] ?? headers[headerName.toLowerCase()]);

		if (typeof value === "string" && value.trim()) {
			normalized[headerName] = value.trim();
			continue;
		}

		if (
			Array.isArray(value) &&
			typeof value[0] === "string" &&
			value[0].trim()
		) {
			normalized[headerName] = value[0].trim();
		}
	}

	return normalized;
}

export function hasSessionTransportHeaders(headers: HeaderContainer): boolean {
	const forwarded = buildForwardedAuthHeaders(headers);
	return Boolean(forwarded.cookie || forwarded.authorization);
}

export async function resolveSessionIdentityFromHeaders(
	headers: HeaderContainer,
): Promise<ResolvedSessionIdentity> {
	if (!hasSessionTransportHeaders(headers)) {
		return emptyResolvedSessionIdentity();
	}

	try {
		const payload = (await auth.api.getSession({
			headers: new Headers(buildForwardedAuthHeaders(headers)),
		})) as BetterAuthSessionPayload | null;

		const authUserId = normalizeSessionString(payload?.user?.id);
		const legacyUserId = normalizeSessionString(payload?.user?.legacyUserId);
		const role = normalizeSessionString(payload?.user?.role);
		const activeCompanyId = normalizeSessionString(
			payload?.user?.activeCompanyId,
		);
		const companyId = normalizeSessionString(payload?.user?.companyId);
		const availableCompanyIds = resolveAvailableCompanyIds(
			payload?.user?.availableCompanies,
		);

		const effectiveCompanyId =
			activeCompanyId || companyId || availableCompanyIds[0] || null;

		return {
			authUserId,
			legacyUserId: legacyUserId || null,
			role: role || null,
			companyId: companyId || effectiveCompanyId,
			activeCompanyId: activeCompanyId || effectiveCompanyId,
			availableCompanyIds,
			sessionId: normalizeSessionString(payload?.session?.id) || null,
		};
	} catch (error) {
		logger.warn({ error }, "Failed to resolve Better Auth session identity");
		return emptyResolvedSessionIdentity();
	}
}
