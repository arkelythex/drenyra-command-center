const ORG_ID_HEADERS = [
	"x-organization-id",
	"x-org-id",
	"x-tenant-id",
	"x-company-id",
] as const;

const COMPANY_ID_HEADERS = [
	"x-company-id",
	"x-active-company-id",
	"x-tenant-id",
] as const;

type OrganizationContextSource =
	| "query.orgId"
	| "body.organizationId"
	| (typeof ORG_ID_HEADERS)[number];

interface OrganizationContextValue {
	source: OrganizationContextSource;
	value: number;
}

/**
 * Strict organization context resolution result for AI Swarm request boundaries.
 *
 * @returns Discriminated union containing either a resolved organization or a conflict.
 * @example
 * ```ts
 * const resolution: OrganizationContextResolution = { ok: true, organizationId: 42 };
 * console.log(resolution.ok);
 * ```
 */
export type OrganizationContextResolution =
	| { ok: true; organizationId: number | null }
	| {
			ok: false;
			code: "TENANT_CONTEXT_CONFLICT";
			error: string;
			details: { values: OrganizationContextValue[] };
		};

/**
 * SIRE company tenant validation result.
 *
 * @returns Discriminated union describing whether body.companyId matches request tenant headers.
 * @example
 * ```ts
 * const result: CompanyTenantValidationResult = { ok: true, companyId: "cmp-1" };
 * console.log(result.ok);
 * ```
 */
export type CompanyTenantValidationResult =
	| { ok: true; companyId: string }
	| {
			ok: false;
			code: "TENANT_CONTEXT_REQUIRED" | "TENANT_CONTEXT_CONFLICT";
			error: string;
			details?: Record<string, unknown>;
		};

function parsePositiveInt(value?: string | null): number | null {
	if (!value) return null;
	const trimmed = value.trim();
	if (!/^[1-9]\d*$/.test(trimmed)) return null;
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed)) return null;
	return parsed;
}

function resolveDefaultOrgId(): number | null {
	const envParsed = parsePositiveInt(process.env.AI_SWARM_DEFAULT_ORG_ID);
	return envParsed;
}

function collectOrganizationContextValues(input: {
	queryOrgId?: string;
	bodyOrganizationId?: string | number | null;
	headers: Headers;
}): OrganizationContextValue[] {
	const values: OrganizationContextValue[] = [];
	const queryOrgId = parsePositiveInt(input.queryOrgId);
	if (queryOrgId) {
		values.push({ source: "query.orgId", value: queryOrgId });
	}

	const bodyOrganizationId = parsePositiveInt(
		typeof input.bodyOrganizationId === "number"
			? String(input.bodyOrganizationId)
			: input.bodyOrganizationId,
	);
	if (bodyOrganizationId) {
		values.push({
			source: "body.organizationId",
			value: bodyOrganizationId,
		});
	}

	for (const headerName of ORG_ID_HEADERS) {
		const candidate = parsePositiveInt(input.headers.get(headerName));
		if (candidate) values.push({ source: headerName, value: candidate });
	}

	return values;
}

/**
 * Resolves organization context from query, body, headers, or default environment.
 *
 * @param input - Request context candidates from query, body, and headers.
 * @returns Strict organization resolution or a conflict when explicit candidates disagree.
 * @example
 * ```ts
 * const result = resolveOrganizationContextForRequest({ headers: new Headers({ "x-organization-id": "42" }) });
 * console.log(result.ok);
 * ```
 */
export function resolveOrganizationContextForRequest(input: {
	queryOrgId?: string;
	bodyOrganizationId?: string | number | null;
	headers: Headers;
}): OrganizationContextResolution {
	const values = collectOrganizationContextValues(input);
	const distinctValues = new Set(values.map((entry) => entry.value));

	if (distinctValues.size > 1) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_CONFLICT",
			error:
				"Conflicting organization context between request query, body, and headers",
			details: { values },
		};
	}

	if (values[0]) {
		return { ok: true, organizationId: values[0].value };
	}

	return { ok: true, organizationId: resolveDefaultOrgId() };
}

/**
 * resolveOrganizationIdForAgentStream operation.
 *
 * @param input - Input for input.
 * @returns Result of resolveOrganizationIdForAgentStream.
 * @example
 * ```ts
 * const result = resolveOrganizationIdForAgentStream({});
 * console.log(result);
 * ```
 */
export function resolveOrganizationIdForAgentStream(input: {
	queryOrgId?: string;
	headers: Headers;
}): number | null {
	const resolution = resolveOrganizationContextForRequest(input);
	if (!resolution.ok) {
		const queryOrgId = parsePositiveInt(input.queryOrgId);
		return queryOrgId;
	}
	return resolution.organizationId;
}

function readTrimmedHeader(headers: Headers, name: string): string | null {
	const value = headers.get(name)?.trim();
	return value ? value : null;
}

/**
 * Validates that a SIRE payload company ID matches trusted request tenant headers.
 *
 * @param input - Body company ID and request headers to compare.
 * @returns Validation success or a fail-closed tenant context error.
 * @example
 * ```ts
 * const result = validateCompanyIdMatchesTenant({ bodyCompanyId: "cmp-1", headers: new Headers({ "x-company-id": "cmp-1" }) });
 * console.log(result.ok);
 * ```
 */
export function validateCompanyIdMatchesTenant(input: {
	bodyCompanyId: string;
	headers: Headers;
}): CompanyTenantValidationResult {
	const bodyCompanyId = input.bodyCompanyId.trim();
	const headerValues = COMPANY_ID_HEADERS.flatMap((headerName) => {
		const value = readTrimmedHeader(input.headers, headerName);
		return value ? [{ headerName, value }] : [];
	});

	if (!bodyCompanyId || headerValues.length === 0) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_REQUIRED",
			error:
				"SIRE requests require a request tenant header that matches body.companyId",
			details: { requiredHeaders: COMPANY_ID_HEADERS },
		};
	}

	const distinctHeaderValues = new Set(
		headerValues.map((entry) => entry.value),
	);
	if (distinctHeaderValues.size > 1) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_CONFLICT",
			error: "Conflicting tenant headers on SIRE request",
			details: { headers: headerValues },
		};
	}

	const headerCompanyId = headerValues[0]?.value;
	if (headerCompanyId !== bodyCompanyId) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_CONFLICT",
			error: "SIRE body.companyId does not match request tenant",
			details: { bodyCompanyId, headerCompanyId },
		};
	}

	return { ok: true, companyId: bodyCompanyId };
}
