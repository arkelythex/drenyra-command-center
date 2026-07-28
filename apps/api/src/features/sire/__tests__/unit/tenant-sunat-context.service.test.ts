import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	resolveTenantSunatContext,
	type SunatCredentialProvider,
	type TenantSunatCompanyLookup,
	TenantSunatContextError,
} from "../../services/tenant-sunat-context.service";

const companyId = "cmp-tenant-a";
const tenantRuc = "20123456786";
const otherRuc = "20492928373";

const createCompanyLookup = (ruc: string | null): TenantSunatCompanyLookup =>
	vi.fn(async () => (ruc === null ? null : { ruc }));

const createCredentialProvider = (): SunatCredentialProvider => ({
	resolve: vi.fn(async ({ ruc, scope }) => ({
		clientId: `client-${ruc}`,
		fingerprint: `fingerprint-${ruc}`,
		ruc,
		scope,
	})),
});

describe("resolveTenantSunatContext", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("resolves company RUC and returns no-secret tenant SUNAT context", async () => {
		const credentialProvider = createCredentialProvider();
		const context = await resolveTenantSunatContext(
			{
				companyId,
				scope: "sire.submit",
			},
			{
				lookupCompany: createCompanyLookup(tenantRuc),
				credentialProvider,
			},
		);

		expect(context).toEqual({
			companyId,
			ruc: tenantRuc,
			credential: {
				clientId: `client-${tenantRuc}`,
				fingerprint: `fingerprint-${tenantRuc}`,
				ruc: tenantRuc,
				scope: "sire.submit",
			},
		});
		expect(JSON.stringify(context)).not.toContain("secret");
		expect(credentialProvider.resolve).toHaveBeenCalledWith({
			ruc: tenantRuc,
			scope: "sire.submit",
		});
	});

	it("does not require deprecated COMPANY_RUC when tenant RUC has credentials", async () => {
		const context = await resolveTenantSunatContext(
			{
				companyId,
				scope: "sire.submit",
				deprecatedEnvRuc: null,
			},
			{
				lookupCompany: createCompanyLookup(tenantRuc),
				credentialProvider: createCredentialProvider(),
			},
		);

		expect(context.ruc).toBe(tenantRuc);
	});

	it("fails closed when company RUC is missing or invalid", async () => {
		await expect(
			resolveTenantSunatContext(
				{ companyId, scope: "sire.submit" },
				{
					lookupCompany: createCompanyLookup(null),
					credentialProvider: createCredentialProvider(),
				},
			),
		).rejects.toMatchObject({
			code: "TENANT_RUC_MISSING",
			publicMessage: "SUNAT tenant RUC is not configured",
		});

		await expect(
			resolveTenantSunatContext(
				{ companyId, scope: "sire.submit" },
				{
					lookupCompany: createCompanyLookup("20123456789"),
					credentialProvider: createCredentialProvider(),
				},
			),
		).rejects.toMatchObject({
			code: "TENANT_RUC_INVALID",
			publicMessage: "SUNAT tenant RUC is invalid",
		});
	});

	it("fails closed before credential lookup when deprecated env RUC mismatches", async () => {
		const credentialProvider = createCredentialProvider();

		await expect(
			resolveTenantSunatContext(
				{
					companyId,
					scope: "sire.submit",
					deprecatedEnvRuc: otherRuc,
				},
				{
					lookupCompany: createCompanyLookup(tenantRuc),
					credentialProvider,
				},
			),
		).rejects.toBeInstanceOf(TenantSunatContextError);
		expect(credentialProvider.resolve).not.toHaveBeenCalled();
	});

	it("fails closed before credential lookup when supplied payload RUC mismatches", async () => {
		const credentialProvider = createCredentialProvider();

		await expect(
			resolveTenantSunatContext(
				{
					companyId,
					scope: "sire.submit",
					suppliedRuc: otherRuc,
				},
				{
					lookupCompany: createCompanyLookup(tenantRuc),
					credentialProvider,
				},
			),
		).rejects.toMatchObject({
			code: "SUPPLIED_RUC_MISMATCH",
			publicMessage: "SUNAT supplied RUC does not match authenticated company",
		});
		expect(credentialProvider.resolve).not.toHaveBeenCalled();
	});

	it("fails closed when credentials are missing or bound to another RUC", async () => {
		await expect(
			resolveTenantSunatContext(
				{ companyId, scope: "sire.submit" },
				{
					lookupCompany: createCompanyLookup(tenantRuc),
					credentialProvider: { resolve: vi.fn(async () => null) },
				},
			),
		).rejects.toMatchObject({ code: "SUNAT_CREDENTIAL_MISSING" });

		await expect(
			resolveTenantSunatContext(
				{ companyId, scope: "sire.submit" },
				{
					lookupCompany: createCompanyLookup(tenantRuc),
					credentialProvider: {
						resolve: vi.fn(async ({ scope }) => ({
							clientId: "client-other",
							fingerprint: "fingerprint-other",
							ruc: otherRuc,
							scope,
						})),
					},
				},
			),
		).rejects.toMatchObject({ code: "SUNAT_CREDENTIAL_RUC_MISMATCH" });
	});

	// --- REQ-A-001: fiscalPeriodId in TenantSunatContext ---

	it("attaches fiscalPeriodId to context when provided in input", async () => {
		const fiscalPeriodId = "fp-uuid-abc-123";

		const context = await resolveTenantSunatContext(
			{
				companyId,
				scope: "sire.submit",
				fiscalPeriodId,
			},
			{
				lookupCompany: createCompanyLookup(tenantRuc),
				credentialProvider: createCredentialProvider(),
			},
		);

		expect(context.fiscalPeriodId).toBe(fiscalPeriodId);
		expect(context.companyId).toBe(companyId);
		expect(context.ruc).toBe(tenantRuc);
		expect(context.credential).toBeDefined();
	});

	it("does not include fiscalPeriodId in context when not provided", async () => {
		const context = await resolveTenantSunatContext(
			{ companyId, scope: "sire.submit" },
			{
				lookupCompany: createCompanyLookup(tenantRuc),
				credentialProvider: createCredentialProvider(),
			},
		);

		expect(context.fiscalPeriodId).toBeUndefined();
	});

	it("credential resolution is unchanged when fiscalPeriodId is present", async () => {
		const credentialProvider = createCredentialProvider();
		const fiscalPeriodId = "fp-uuid-abc-123";

		const context = await resolveTenantSunatContext(
			{
				companyId,
				scope: "sire.submit",
				fiscalPeriodId,
			},
			{
				lookupCompany: createCompanyLookup(tenantRuc),
				credentialProvider,
			},
		);

		// Credential resolution must still work by companyId and scope
		expect(credentialProvider.resolve).toHaveBeenCalledWith({
			ruc: tenantRuc,
			scope: "sire.submit",
		});
		expect(context.credential).toEqual({
			clientId: `client-${tenantRuc}`,
			fingerprint: `fingerprint-${tenantRuc}`,
			ruc: tenantRuc,
			scope: "sire.submit",
		});
	});
});
