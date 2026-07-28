import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SireTimeoutError } from "../../sire-errors";

vi.mock("@drenyra/persistence/repositories/sire-submission.repository", () => ({
	sireSubmissionRepository: {
		findByIdempotencyKey: vi.fn(),
		incrementAttempt: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("../../sire-submission.service", () => ({
	SireSubmissionService: {
		submit: vi.fn(),
	},
}));

vi.mock(
	"../../services/tenant-sunat-context.service",
	async (importOriginal) => {
		const actual =
			await importOriginal<
				typeof import("../../services/tenant-sunat-context.service")
			>();
		return {
			...actual,
			resolveTenantSunatContext: vi.fn(),
		};
	},
);

import { sireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
import {
	logBlockedSubmissionAttempt,
	submitWithAudit,
} from "../../services/sire-submission-with-audit.service";
import {
	resolveTenantSunatContext,
	TenantSunatContextError,
} from "../../services/tenant-sunat-context.service";
import { SireSubmissionService } from "../../sire-submission.service";
import type { TenantSunatContext } from "../../types";

const baseInput = {
	companyId: "cmp-requesting",
	period: "2026-02",
	ledgerType: "ventas" as const,
	payloadFormat: "txt" as const,
	payloadBase64: "dGVzdA==",
	idempotencyKey: "shared-client-key",
};

const tenantSunatContext: TenantSunatContext = {
	companyId: baseInput.companyId,
	ruc: "20123456786",
	credential: {
		clientId: "client-tenant",
		fingerprint: "sha256:tenant",
		ruc: "20123456786",
		scope: "sire.submit",
	},
};

const auditRecord = {
	id: "sub-audit-1",
	companyId: baseInput.companyId,
	status: "PENDING",
	attemptNumber: 1,
	warnings: {
		previous: "preserve-me",
	},
};

const crossCompanySubmission = {
	id: "sub-existing-other-company",
	companyId: "cmp-other",
	status: "ACCEPTED",
	submissionId: "SIM-OTHER",
	provider: "simulation",
	submittedAt: new Date("2026-02-13T00:00:00.000Z"),
	createdAt: new Date("2026-02-13T00:00:00.000Z"),
	period: "2026-02",
	ledgerType: "ventas",
	dryRun: false,
	sunatMessage: "Previously submitted by another company",
	trackingId: null,
	sunatTicket: null,
};

describe("SIRE submission audit idempotency scope", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
		delete process.env.SIRE_SUBMISSION_MODE;
		delete process.env.SIRE_API_TOKEN;
		delete process.env.COMPANY_RUC;
		delete process.env.SUNAT_CLIENT_ID;
		delete process.env.SUNAT_CLIENT_SECRET;
		delete process.env.SUNAT_SOL_USERNAME;
		delete process.env.SUNAT_SOL_PASSWORD;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("rejects submitWithAudit when an idempotency key belongs to another company", async () => {
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			crossCompanySubmission as never,
		);

		await expect(submitWithAudit(baseInput)).rejects.toThrow(
			"Forbidden SIRE idempotency key belongs to another company",
		);

		expect(sireSubmissionRepository.findByIdempotencyKey).toHaveBeenCalledWith(
			"shared-client-key",
		);
		expect(sireSubmissionRepository.incrementAttempt).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.create).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).not.toHaveBeenCalled();
		expect(SireSubmissionService.submit).not.toHaveBeenCalled();
	});

	it("does not update another company submission when logging a blocked attempt", async () => {
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			crossCompanySubmission as never,
		);

		await expect(
			logBlockedSubmissionAttempt(
				baseInput,
				{ policy: "sire-governance" },
				"Execution blocked by autonomy policy",
			),
		).rejects.toThrow(
			"Forbidden SIRE idempotency key belongs to another company",
		);

		expect(sireSubmissionRepository.findByIdempotencyKey).toHaveBeenCalledWith(
			"shared-client-key",
		);
		expect(sireSubmissionRepository.create).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).not.toHaveBeenCalled();
	});

	it("resolves tenant SUNAT context before API submission and passes it to submission service", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "api-token";
		process.env.COMPANY_RUC = "20123456786";
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			null,
		);
		vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
			auditRecord as never,
		);
		vi.mocked(resolveTenantSunatContext).mockResolvedValue(tenantSunatContext);
		vi.mocked(SireSubmissionService.submit).mockResolvedValue({
			submissionId: "SUB-1",
			status: "ACCEPTED",
			provider: "sunat-api",
			submittedAt: "2026-02-13T00:00:00.000Z",
			period: baseInput.period,
			ledgerType: baseInput.ledgerType,
			dryRun: false,
			message: "Accepted",
		});

		const result = await submitWithAudit(baseInput);

		expect(result.provider).toBe("sunat-api");
		expect(resolveTenantSunatContext).toHaveBeenCalledWith({
			companyId: baseInput.companyId,
			scope: "sire.submit",
			deprecatedEnvRuc: "20123456786",
			suppliedRuc: undefined,
		});
		expect(SireSubmissionService.submit).toHaveBeenCalledWith(
			expect.objectContaining({ idempotencyKey: baseInput.idempotencyKey }),
			{ tenantSunatContext },
		);
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			auditRecord.id,
			expect.objectContaining({
				warnings: {
					previous: "preserve-me",
					sunatTenant: expect.objectContaining({
						companyId: baseInput.companyId,
						resolvedRuc: tenantSunatContext.ruc,
						credentialFingerprint: tenantSunatContext.credential.fingerprint,
						decision: "allowed",
						outcome: "ACCEPTED",
					}),
				},
			}),
		);
	});

	it("fails closed and records safe audit metadata when tenant context cannot be resolved", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "api-token";
		process.env.COMPANY_RUC = "20999999999";
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			null,
		);
		vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
			auditRecord as never,
		);
		vi.mocked(resolveTenantSunatContext).mockRejectedValue(
			new Error("SUNAT credentials are not configured for tenant RUC"),
		);

		await expect(submitWithAudit(baseInput)).rejects.toThrow(
			"SUNAT credentials are not configured for tenant RUC",
		);

		expect(SireSubmissionService.submit).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			auditRecord.id,
			expect.objectContaining({
				status: "FAILED",
				sunatMessage: "SUNAT credentials are not configured for tenant RUC",
				errors: expect.objectContaining({
					reason: "SUNAT_CONTEXT_RESOLUTION_FAILED",
					sunatTenant: expect.objectContaining({
						companyId: baseInput.companyId,
						decision: "refused",
						reason: "SUNAT_CONTEXT_RESOLUTION_FAILED",
					}),
				}),
			}),
		);
		expect(
			JSON.stringify(vi.mocked(sireSubmissionRepository.update).mock.calls),
		).not.toContain("api-token");
	});

	it("resolves tenant context for API dry-run submissions when credentials are configured", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "api-token";
		process.env.COMPANY_RUC = "20123456786";
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			null,
		);
		vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
			auditRecord as never,
		);
		vi.mocked(resolveTenantSunatContext).mockResolvedValue(tenantSunatContext);
		vi.mocked(SireSubmissionService.submit).mockResolvedValue({
			submissionId: "SUB-DRY-1",
			status: "SIMULATED",
			provider: "simulation",
			submittedAt: "2026-02-13T00:00:00.000Z",
			period: baseInput.period,
			ledgerType: baseInput.ledgerType,
			dryRun: true,
			message: "Dry run simulated",
		});

		await submitWithAudit({ ...baseInput, dryRun: true });

		expect(resolveTenantSunatContext).toHaveBeenCalledWith({
			companyId: baseInput.companyId,
			scope: "sire.submit",
			deprecatedEnvRuc: "20123456786",
			suppliedRuc: undefined,
		});
		expect(SireSubmissionService.submit).toHaveBeenCalledWith(
			expect.objectContaining({ dryRun: true }),
			{ tenantSunatContext },
		);
	});

	it("fails closed on submitted payload RUC mismatch before submission service call", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "api-token";
		process.env.COMPANY_RUC = "20123456786";
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			null,
		);
		vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
			auditRecord as never,
		);
		vi.mocked(resolveTenantSunatContext).mockRejectedValue(
			new TenantSunatContextError(
				"SUPPLIED_RUC_MISMATCH",
				"SUNAT supplied RUC does not match authenticated company",
				{
					companyId: baseInput.companyId,
					tenantRuc: tenantSunatContext.ruc,
					comparedRuc: "20492928373",
					source: "supplied",
				},
			),
		);

		await expect(
			submitWithAudit({ ...baseInput, ruc: "20492928373" }),
		).rejects.toThrow(
			"SUNAT supplied RUC does not match authenticated company",
		);

		expect(resolveTenantSunatContext).toHaveBeenCalledWith({
			companyId: baseInput.companyId,
			scope: "sire.submit",
			deprecatedEnvRuc: "20123456786",
			suppliedRuc: "20492928373",
		});
		expect(SireSubmissionService.submit).not.toHaveBeenCalled();
		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			auditRecord.id,
			expect.objectContaining({
				status: "FAILED",
				errors: expect.objectContaining({
					reason: "SUNAT_CONTEXT_RESOLUTION_FAILED",
					sunatTenant: expect.objectContaining({
						companyId: baseInput.companyId,
						resolvedRuc: tenantSunatContext.ruc,
						comparedRuc: "20492928373",
						suppliedRuc: "20492928373",
						decision: "refused",
					}),
				}),
			}),
		);
		const persistedAuditPayload = JSON.stringify(
			vi.mocked(sireSubmissionRepository.update).mock.calls,
		);
		expect(persistedAuditPayload).not.toContain("api-token");
		expect(persistedAuditPayload).not.toContain("client-secret");
		expect(persistedAuditPayload).not.toContain("sol-pass");
	});

	it("records generic submission failure metadata after tenant context resolution succeeds", async () => {
		process.env.SIRE_SUBMISSION_MODE = "api";
		process.env.SIRE_API_TOKEN = "api-token";
		process.env.COMPANY_RUC = "20123456786";
		vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
			null,
		);
		vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
			auditRecord as never,
		);
		vi.mocked(resolveTenantSunatContext).mockResolvedValue(tenantSunatContext);
		vi.mocked(SireSubmissionService.submit).mockRejectedValue(
			new Error("SIRE API request failed (401): Unauthorized"),
		);

		await expect(submitWithAudit(baseInput)).rejects.toThrow(
			"SIRE API request failed (401): Unauthorized",
		);

		expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
			auditRecord.id,
			expect.objectContaining({
				status: "FAILED",
				sunatMessage: "SIRE API request failed (401): Unauthorized",
				errors: expect.objectContaining({
					reason: "SIRE_SUBMISSION_FAILED",
					sunatTenant: expect.objectContaining({
						companyId: baseInput.companyId,
						resolvedRuc: tenantSunatContext.ruc,
						credentialFingerprint: tenantSunatContext.credential.fingerprint,
						decision: "refused",
						reason: "SIRE_SUBMISSION_FAILED",
					}),
				}),
			}),
		);
	});

	describe("Phase D — Durable Execution", () => {
		// D.2.1 RED: timeout → UNKNOWN
		it("transitions submission to UNKNOWN when SUNAT API times out (not FAILED)", async () => {
			process.env.SIRE_SUBMISSION_MODE = "api";
			process.env.SIRE_API_TOKEN = "api-token";
			process.env.COMPANY_RUC = "20123456786";
			vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
				null,
			);
			vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
				auditRecord as never,
			);
			vi.mocked(resolveTenantSunatContext).mockResolvedValue(tenantSunatContext);
			vi.mocked(SireSubmissionService.submit).mockRejectedValue(
				new SireTimeoutError("SIRE API timeout after 30000ms"),
			);

			await expect(submitWithAudit(baseInput)).rejects.toThrow(SireTimeoutError);

			expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
				auditRecord.id,
				expect.objectContaining({
					status: "UNKNOWN",
					sunatStatus: null,
					sunatMessage: "SIRE API timeout after 30000ms",
				}),
			);

			// Verify NOT marked as FAILED
			const updateCall = vi.mocked(sireSubmissionRepository.update).mock.calls[0][1];
			expect(updateCall).not.toHaveProperty("nextRetryAt");
		});

		// D.2.4 RED: non-timeout error → FAILED
		it("still transitions to FAILED for non-timeout SUNAT errors", async () => {
			process.env.SIRE_SUBMISSION_MODE = "api";
			process.env.SIRE_API_TOKEN = "api-token";
			process.env.COMPANY_RUC = "20123456786";
			vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
				null,
			);
			vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
				auditRecord as never,
			);
			vi.mocked(resolveTenantSunatContext).mockResolvedValue(tenantSunatContext);
			vi.mocked(SireSubmissionService.submit).mockRejectedValue(
				new Error("SIRE API request failed (500): Internal Server Error"),
			);

			await expect(submitWithAudit(baseInput)).rejects.toThrow(
				"SIRE API request failed (500)",
			);

			expect(sireSubmissionRepository.update).toHaveBeenCalledWith(
				auditRecord.id,
				expect.objectContaining({
					status: "FAILED",
				}),
			);
		});

		// payload_base64 stored on audit record creation
		it("stores payloadBase64 on initial submission audit record creation", async () => {
			process.env.SIRE_SUBMISSION_MODE = "simulation";
			vi.mocked(sireSubmissionRepository.findByIdempotencyKey).mockResolvedValue(
				null,
			);
			vi.mocked(sireSubmissionRepository.create).mockResolvedValue(
				auditRecord as never,
			);

			await submitWithAudit(baseInput);

			expect(sireSubmissionRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					payloadBase64: baseInput.payloadBase64,
				}),
			);
		});
	});
});
