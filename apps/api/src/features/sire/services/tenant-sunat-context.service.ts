import { createHash } from "node:crypto";
import { isValidRUC } from "@arkelythex/shared/validation/ruc";
import { eq } from "@arkelythex/persistence/query";
import { db, schema } from "../../../lib/db";
import type {
	SunatCredentialIdentity,
	SunatCredentialScope,
	TenantSunatContext,
} from "../types";

export type TenantSunatContextErrorCode =
	| "TENANT_RUC_MISSING"
	| "TENANT_RUC_INVALID"
	| "DEPRECATED_ENV_RUC_MISMATCH"
	| "SUPPLIED_RUC_MISMATCH"
	| "SUNAT_CREDENTIAL_MISSING"
	| "SUNAT_CREDENTIAL_RUC_MISMATCH";

export interface TenantSunatContextErrorDetails {
	companyId: string;
	tenantRuc?: string;
	comparedRuc?: string;
	source: "company" | "deprecated-env" | "supplied" | "credential";
}

/**
 * Fail-closed tenant SUNAT context error with no secret material.
 * @example
 * ```ts
 * throw new TenantSunatContextError("TENANT_RUC_MISSING", "Missing", details);
 * ```
 * @example error.publicMessage
 */
export class TenantSunatContextError extends Error {
	readonly code: TenantSunatContextErrorCode;
	readonly publicMessage: string;
	readonly details: TenantSunatContextErrorDetails;

	constructor(
		code: TenantSunatContextErrorCode,
		publicMessage: string,
		details: TenantSunatContextErrorDetails,
	) {
		super(publicMessage);
		this.name = "TenantSunatContextError";
		this.code = code;
		this.publicMessage = publicMessage;
		this.details = details;
	}
}

/**
 * Company lookup dependency for tenant SUNAT context resolution.
 * @param companyId - Authenticated company identifier.
 * @returns Company RUC row or null when unavailable.
 * @example
 * ```ts
 * const lookup: TenantSunatCompanyLookup = async () => ({ ruc: "20123456786" });
 * ```
 */
export type TenantSunatCompanyLookup = (
	companyId: string,
) => Promise<{ ruc: string | null } | null>;

/**
 * No-secret SUNAT credential provider boundary.
 * @param input - Tenant RUC and requested SUNAT scope.
 * @returns Credential identity without secret material or null when unavailable.
 * @example
 * ```ts
 * const provider: SunatCredentialProvider = { resolve: async ({ ruc, scope }) => ({ clientId: "id", fingerprint: "fp", ruc, scope }) };
 * ```
 */
export interface SunatCredentialProvider {
	resolve(input: {
		ruc: string;
		scope: SunatCredentialScope;
	}): Promise<SunatCredentialIdentity | null>;
}

/**
 * Resolver inputs that can affect tenant SUNAT boundaries.
 * @example
 * ```ts
 * const input: ResolveTenantSunatContextInput = { companyId: "cmp", scope: "sire.submit" };
 * ```
 * @example input.suppliedRuc
 */
export interface ResolveTenantSunatContextInput {
	companyId: string;
	scope: SunatCredentialScope;
	deprecatedEnvRuc?: string | null;
	suppliedRuc?: string | null;
}

/**
 * Resolver dependencies for tests and runtime adapters.
 * @example
 * ```ts
 * const deps: ResolveTenantSunatContextDeps = { lookupCompany, credentialProvider };
 * ```
 * @example deps.credentialProvider
 */
export interface ResolveTenantSunatContextDeps {
	lookupCompany?: TenantSunatCompanyLookup;
	credentialProvider?: SunatCredentialProvider;
}

/**
 * Resolves a no-secret tenant SUNAT context from authenticated company scope.
 * @param input - Authenticated company, requested SUNAT scope, and optional RUC boundaries.
 * @param deps - Optional lookup/provider dependencies for tests or adapters.
 * @returns Tenant SUNAT context with RUC and no-secret credential identity.
 * @throws TenantSunatContextError when RUC or credential scoping is unsafe.
 * @example
 * ```ts
 * const context = await resolveTenantSunatContext({ companyId: "cmp", scope: "sire.submit" });
 * ```
 */
export const resolveTenantSunatContext = async (
	input: ResolveTenantSunatContextInput,
	deps: ResolveTenantSunatContextDeps = {},
): Promise<TenantSunatContext> => {
	const lookupCompany = deps.lookupCompany ?? lookupCompanyRuc;
	const credentialProvider =
		deps.credentialProvider ?? createEnvSunatCredentialProvider();
	const company = await lookupCompany(input.companyId);
	const tenantRuc = normalizeRuc(company?.ruc ?? null);

	if (!tenantRuc) {
		throw new TenantSunatContextError(
			"TENANT_RUC_MISSING",
			"SUNAT tenant RUC is not configured",
			{ companyId: input.companyId, source: "company" },
		);
	}

	if (!isValidRUC(tenantRuc)) {
		throw new TenantSunatContextError(
			"TENANT_RUC_INVALID",
			"SUNAT tenant RUC is invalid",
			{ companyId: input.companyId, tenantRuc, source: "company" },
		);
	}

	assertOptionalRucMatch({
		candidate: input.deprecatedEnvRuc,
		tenantRuc,
		companyId: input.companyId,
		code: "DEPRECATED_ENV_RUC_MISMATCH",
		publicMessage: "SUNAT deprecated environment RUC does not match tenant",
		source: "deprecated-env",
	});
	assertOptionalRucMatch({
		candidate: input.suppliedRuc,
		tenantRuc,
		companyId: input.companyId,
		code: "SUPPLIED_RUC_MISMATCH",
		publicMessage: "SUNAT supplied RUC does not match authenticated company",
		source: "supplied",
	});

	const credential = await credentialProvider.resolve({
		ruc: tenantRuc,
		scope: input.scope,
	});

	if (!credential) {
		throw new TenantSunatContextError(
			"SUNAT_CREDENTIAL_MISSING",
			"SUNAT credentials are not configured for tenant RUC",
			{ companyId: input.companyId, tenantRuc, source: "credential" },
		);
	}

	if (credential.ruc !== tenantRuc || credential.scope !== input.scope) {
		throw new TenantSunatContextError(
			"SUNAT_CREDENTIAL_RUC_MISMATCH",
			"SUNAT credentials do not match tenant RUC or scope",
			{
				companyId: input.companyId,
				tenantRuc,
				comparedRuc: credential.ruc,
				source: "credential",
			},
		);
	}

	return {
		companyId: input.companyId,
		ruc: tenantRuc,
		credential,
	};
};

const lookupCompanyRuc: TenantSunatCompanyLookup = async (companyId) => {
	const rows = await db
		.select({ ruc: schema.companies.ruc })
		.from(schema.companies)
		.where(eq(schema.companies.id, companyId))
		.limit(1);

	return rows[0] ?? null;
};

const createEnvSunatCredentialProvider = (): SunatCredentialProvider => ({
	resolve: async ({ ruc, scope }) => {
		const clientId = normalizeEnv(process.env.SUNAT_CLIENT_ID);
		const credentialRuc = normalizeRuc(
			process.env.SUNAT_CREDENTIAL_RUC ?? null,
		);

		if (!clientId || credentialRuc !== ruc) {
			return null;
		}

		return {
			clientId,
			fingerprint: fingerprintCredential({ clientId, ruc, scope }),
			ruc,
			scope,
		};
	},
});

const normalizeEnv = (value: string | undefined): string | null => {
	const trimmed = value?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : null;
};

const normalizeRuc = (value: string | null | undefined): string | null => {
	const trimmed = value?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : null;
};

const assertOptionalRucMatch = (input: {
	candidate: string | null | undefined;
	tenantRuc: string;
	companyId: string;
	code: Extract<
		TenantSunatContextErrorCode,
		"DEPRECATED_ENV_RUC_MISMATCH" | "SUPPLIED_RUC_MISMATCH"
	>;
	publicMessage: string;
	source: "deprecated-env" | "supplied";
}): void => {
	const candidate = normalizeRuc(input.candidate);
	if (!candidate || candidate === input.tenantRuc) {
		return;
	}

	throw new TenantSunatContextError(input.code, input.publicMessage, {
		companyId: input.companyId,
		tenantRuc: input.tenantRuc,
		comparedRuc: candidate,
		source: input.source,
	});
};

const fingerprintCredential = (input: {
	clientId: string;
	ruc: string;
	scope: SunatCredentialScope;
}): string =>
	`sha256:${createHash("sha256")
		.update(`${input.clientId}:${input.ruc}:${input.scope}`)
		.digest("hex")}`;
