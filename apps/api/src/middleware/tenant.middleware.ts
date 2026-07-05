/**
 * Multi-Tenant Middleware
 *
 * Extracts and validates organization context from requests.
 * Protected API routes fail closed when tenant context is missing or invalid.
 * Public exceptions must be explicit and tested.
 *
 * @since Phase 7 - Enterprise Features
 */

import { Elysia } from "elysia";

export type TenantContext = {
	organizationId: string;
	userId: string | null;
	plan: "free" | "pro" | "enterprise";
	companyType: "persona" | "mype" | "pyme" | "empresa" | "corporacion";
};

type TenantFailureCode = "TENANT_REQUIRED" | "INVALID_COMPANY_TYPE";

class TenantContextError extends Error {
	readonly status: 400 | 403;
	readonly code: TenantFailureCode;

	constructor(message: string, code: TenantFailureCode, status: 400 | 403) {
		super(message);
		this.name = "TenantContextError";
		this.code = code;
		this.status = status;
	}
}

const DEFAULT_COMPANY_TYPE: TenantContext["companyType"] = "mype";
const ALLOWED_COMPANY_TYPES = [
	"persona",
	"mype",
	"pyme",
	"empresa",
	"corporacion",
] as const satisfies readonly TenantContext["companyType"][];

function isCompanyType(value: string): value is TenantContext["companyType"] {
	return ALLOWED_COMPANY_TYPES.some((companyType) => companyType === value);
}

const PUBLIC_TENANT_EXEMPT_PREFIXES = [
	"/health",
	"/api/v2/health",
	"/swagger",
] as const;

function isTenantExemptPath(path: string): boolean {
	return PUBLIC_TENANT_EXEMPT_PREFIXES.some((prefix) =>
		path.startsWith(prefix),
	);
}

function tenantFailureResponse(error: TenantContextError): {
	success: false;
	error: string;
	code: TenantFailureCode;
} {
	return {
		success: false,
		error: error.message,
		code: error.code,
	};
}

function parseCompanyType(value: string | null): TenantContext["companyType"] {
	if (!value || value.trim() === "") return DEFAULT_COMPANY_TYPE;

	const normalized = value.trim().toLowerCase();
	if (isCompanyType(normalized)) return normalized;

	throw new TenantContextError(
		"Invalid X-Company-Type header",
		"INVALID_COMPANY_TYPE",
		400,
	);
}

function resolveTenantContext(headers: Headers): TenantContext {
	const orgId = headers.get("X-Organization-Id")?.trim();
	if (!orgId) {
		throw new TenantContextError(
			"Tenant context is required",
			"TENANT_REQUIRED",
			403,
		);
	}

	// In production, fetch plan from database.
	// For now, default to "pro" while preserving explicit tenant identity.
	const plan: TenantContext["plan"] = "pro";

	return {
		organizationId: orgId,
		userId: null,
		plan,
		companyType: parseCompanyType(headers.get("X-Company-Type")),
	};
}

/**
 * Tenant Middleware - Extracts organization context from headers.
 *
 * Required headers on protected routes:
 * - X-Organization-Id: tenant identifier header
 *
 * Optional headers:
 * - X-Company-Type: `persona | mype | pyme | empresa | corporacion`
 */
export const tenantMiddleware = new Elysia({ name: "tenant" })
	.onBeforeHandle(({ path, request, set }) => {
		if (isTenantExemptPath(path)) return;

		try {
			resolveTenantContext(request.headers);
		} catch (error: unknown) {
			if (error instanceof TenantContextError) {
				set.status = error.status;
				return tenantFailureResponse(error);
			}
			throw error;
		}
	})
	.derive(({ request }) => {
		try {
			return { tenant: resolveTenantContext(request.headers) };
		} catch {
			return {
				tenant: {
					organizationId: "",
					userId: null,
					plan: "pro",
					companyType: DEFAULT_COMPANY_TYPE,
				} satisfies TenantContext,
			};
		}
	})
	.as("global");

/**
 * Helper function to extract tenant from request headers.
 */
export function getTenantFromHeaders(request: Request): TenantContext {
	return resolveTenantContext(request.headers);
}
