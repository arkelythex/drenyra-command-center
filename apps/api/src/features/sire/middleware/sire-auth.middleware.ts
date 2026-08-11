import { createHmac, timingSafeEqual } from "node:crypto";
import { Elysia } from "elysia";
import { fail } from "../../shared/api-response";
import { resolveCompanyIdFromLegacyOrganizationClaim } from "./company-scope-resolver";
import { resolveSireCompanyId } from "./request-company-id";

interface JwtHeader {
	alg?: string;
	typ?: string;
}

interface SireJwtClaims {
	sub?: string;
	exp?: number;
	scope?: string | string[];
	companyId?: string | number;
	organizationId?: string | number;
	orgId?: string | number;
}

function getJwtSecret(): string {
	return (
		process.env.SIRE_JWT_SECRET ??
		process.env.ARKELYTHEX_JWT_SECRET ??
		process.env.BETTER_AUTH_SECRET ??
		""
	).trim();
}

function decodeBase64Url(value: string): Buffer {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padding = (4 - (normalized.length % 4 || 4)) % 4;
	return Buffer.from(normalized + "=".repeat(padding), "base64");
}

function parseJson<T>(segment: string): T {
	const decoded = decodeBase64Url(segment).toString("utf8");
	return JSON.parse(decoded) as T;
}

function verifyHs256(token: string, secret: string): SireJwtClaims {
	const segments = token.split(".");
	if (segments.length !== 3) {
		throw new Error("JWT malformed");
	}

    	const [encodedHeader, encodedPayload, encodedSignature] = segments;
    	if (!encodedHeader || !encodedPayload || !encodedSignature) {
    		throw new Error("JWT malformed");
    	}
    	const header = parseJson<JwtHeader>(encodedHeader);

	if (header.alg !== "HS256") {
		throw new Error("JWT must use HS256");
	}

	const signingInput = `${encodedHeader}.${encodedPayload}`;
	const expectedSignature = createHmac("sha256", secret)
		.update(signingInput)
		.digest();
	const receivedSignature = decodeBase64Url(encodedSignature);

	if (
		expectedSignature.length !== receivedSignature.length ||
		!timingSafeEqual(expectedSignature, receivedSignature)
	) {
		throw new Error("JWT signature is invalid");
	}

	const claims = parseJson<SireJwtClaims>(encodedPayload);
	if (typeof claims.exp === "number") {
		const now = Math.floor(Date.now() / 1000);
		if (claims.exp <= now) {
			throw new Error("JWT expired");
		}
	}

	return claims;
}

async function resolveCompanyIdFromClaims(
	claims: SireJwtClaims,
): Promise<string | null> {
	if (typeof claims.companyId === "string") {
		const normalized = claims.companyId.trim();
		if (normalized.length > 0) {
			return normalized;
		}
	}

	const legacyCandidate =
		typeof claims.companyId === "number" && Number.isFinite(claims.companyId)
			? claims.companyId
			: (claims.organizationId ?? claims.orgId);

	return await resolveCompanyIdFromLegacyOrganizationClaim(legacyCandidate);
}

/**
 * enforceSireAuth operation.
 *
 * @returns Result of enforceSireAuth.
 * @example
 * ```ts
 * const result = enforceSireAuth(undefined);
 * console.log(result);
 * ```
 */
export async function enforceSireAuth({
	body,
	query,
	request,
	set,
}: {
	body: unknown;
	query: unknown;
	request: Request;
	set: { status: number };
}): Promise<ReturnType<typeof fail> | undefined> {
	const authorization = request.headers.get("authorization") ?? "";
	if (!authorization.startsWith("Bearer ")) {
		set.status = 401;
		return fail(
			"Missing Authorization bearer token for SIRE route",
			"SIRE_AUTH_REQUIRED",
		);
	}

	const secret = getJwtSecret();
	if (!secret) {
		set.status = 503;
		return fail(
			"SIRE JWT secret is not configured",
			"SIRE_AUTH_NOT_CONFIGURED",
		);
	}

	const token = authorization.slice("Bearer ".length).trim();
	let claims: SireJwtClaims;

	try {
		claims = verifyHs256(token, secret);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "JWT validation failed";
		set.status = 401;
		return fail(message, "SIRE_AUTH_INVALID");
	}

	const requestCompanyId = resolveSireCompanyId({ body, query, request });
	if (!requestCompanyId) {
		set.status = 400;
		return fail(
			"companyId (or X-Company-Id) is required for SIRE routes",
			"SIRE_COMPANY_CONTEXT_REQUIRED",
		);
	}

	const headerCompanyId = request.headers.get("x-company-id")?.trim();
	if (headerCompanyId && headerCompanyId !== requestCompanyId) {
		set.status = 403;
		return fail(
			"X-Company-Id does not match the SIRE request company",
			"SIRE_COMPANY_HEADER_MISMATCH",
		);
	}

	const tokenCompanyId = await resolveCompanyIdFromClaims(claims);
	if (!tokenCompanyId) {
		set.status = 401;
		return fail(
			"JWT is missing companyId/organizationId claim",
			"SIRE_AUTH_COMPANY_CLAIM_REQUIRED",
		);
	}

	if (tokenCompanyId !== requestCompanyId) {
		set.status = 403;
		return fail(
			"JWT company scope does not match the requested SIRE company",
			"SIRE_COMPANY_FORBIDDEN",
		);
	}

	return undefined;
}

/** Minimal context shape accepted by the auth middleware function */
type SireAuthMiddlewareContext = {
	body: unknown;
	query: unknown;
	request: Request;
	set: { status: number };
};

/**
 * Elysia plugin that enforces SIRE API-key authentication on every request.
 * Returns HTTP 401 when the `x-sire-api-key` header is missing or invalid.
 *
 * @example
 * ```ts
 * app.use(sireAuthMiddleware);
 * ```
 */
export const sireAuthMiddleware = new Elysia({
	name: "sire-auth",
}).onBeforeHandle(async (context) => {
	return await enforceSireAuth(context as unknown as SireAuthMiddlewareContext);
});
