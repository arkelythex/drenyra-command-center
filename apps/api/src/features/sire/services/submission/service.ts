import { randomBytes } from "node:crypto";
import type { TenantScope } from "@drenyra/domain/scope";
import { sireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
import { createLogger } from "../../../../lib/logger";
import { SireTimeoutError } from "../../sire-errors";
import {
	type SireSubmissionResult,
	SireSubmissionService,
	type SubmitSireInput,
} from "../../sire-submission.service";
import type { SireSubmissionConfig, TenantSunatContext } from "../../types";
import { buildSireConfig } from "../sire-config.service";
import {
	resolveTenantSunatContext,
	TenantSunatContextError,
} from "../tenant-sunat-context.service";
import type { SireAuditOptions, SunatAuditTrace } from "./types";

const logger = createLogger({ module: "sire-submission-audit" });

function buildIdempotencyKey(input: SubmitSireInput): string {
	return (
		input.idempotencyKey ||
		`${input.companyId}-${input.period}-${input.ledgerType}-${randomBytes(8).toString("hex")}`
	);
}

function resolveProvider(): "sunat-api" | "simulation" {
	return process.env.SIRE_SUBMISSION_MODE?.toLowerCase() === "api"
		? "sunat-api"
		: "simulation";
}

function hasExternalApiCredentials(config: SireSubmissionConfig): boolean {
	return Boolean(
		config.apiToken ||
			(config.oauth.clientId &&
				config.oauth.clientSecret &&
				config.oauth.solUsername &&
				config.oauth.solPassword),
	);
}

async function resolveSubmissionTenantContext(
	input: SubmitSireInput,
): Promise<TenantSunatContext | undefined> {
	const config = buildSireConfig();
	if (config.mode !== "api" || !hasExternalApiCredentials(config)) {
		return undefined;
	}

	return resolveTenantSunatContext({
		companyId: input.companyId,
		scope: "sire.submit",
		deprecatedEnvRuc: config.deprecatedCompanyRuc,
		suppliedRuc: input.ruc,
	});
}

function buildSunatAuditTrace(input: {
	companyId: string;
	tenantSunatContext?: TenantSunatContext;
	decision: SunatAuditTrace["decision"];
	outcome?: string;
	reason?: string;
	suppliedRuc?: string;
	comparedRuc?: string;
}): SunatAuditTrace {
	return {
		companyId: input.companyId,
		resolvedRuc: input.tenantSunatContext?.ruc,
		credentialFingerprint: input.tenantSunatContext?.credential.fingerprint,
		decision: input.decision,
		outcome: input.outcome,
		reason: input.reason,
		suppliedRuc: input.suppliedRuc,
		comparedRuc: input.comparedRuc,
	};
}

function getTenantContextErrorTrace(
	error: unknown,
): Pick<SunatAuditTrace, "resolvedRuc" | "comparedRuc"> {
	if (!(error instanceof TenantSunatContextError)) {
		return {};
	}

	return {
		resolvedRuc: error.details.tenantRuc,
		comparedRuc: error.details.comparedRuc,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeAuditWarnings(
	existingWarnings: unknown,
	governanceTrace: unknown,
	sunatTenant: SunatAuditTrace,
): Record<string, unknown> {
	return {
		...(isRecord(existingWarnings) ? existingWarnings : {}),
		...(governanceTrace === undefined ? {} : { governance: governanceTrace }),
		sunatTenant,
	};
}

function buildProposalRecordWarnings(
	input: SubmitSireInput,
	existingWarnings?: unknown,
): Record<string, unknown> {
	return {
		...(isRecord(existingWarnings) ? existingWarnings : {}),
		proposalRecords: {
			payloadBase64: input.payloadBase64,
			ledgerType: input.ledgerType,
			payloadFormat: input.payloadFormat,
		},
	};
}

export const submitWithAudit = async (
	input: SubmitSireInput,
	options?: SireAuditOptions,
): Promise<SireSubmissionResult> => {
	const idempotencyKey = buildIdempotencyKey(input);

	const scope: TenantScope = { organizationId: "", companyId: input.companyId };

	const existingSubmission =
		await sireSubmissionRepository.findByIdempotencyKey(scope, idempotencyKey);

	if (existingSubmission) {
		logger.info(
			{
				idempotencyKey,
				submissionId: existingSubmission.id,
				status: existingSubmission.status,
			},
			"Idempotent SIRE submission detected",
		);

		if (
			existingSubmission.status === "ACCEPTED" ||
			existingSubmission.status === "SIMULATED"
		) {
			return {
				submissionId: existingSubmission.submissionId || existingSubmission.id,
				status: existingSubmission.status as "ACCEPTED" | "SIMULATED",
				provider: existingSubmission.provider as "sunat-api" | "simulation",
				submittedAt:
					existingSubmission.submittedAt?.toISOString() ||
					existingSubmission.createdAt?.toISOString() ||
					new Date().toISOString(),
				period: existingSubmission.period,
				ledgerType: existingSubmission.ledgerType as "ventas" | "compras",
				dryRun: existingSubmission.dryRun ?? false,
				message:
					existingSubmission.sunatMessage ||
					"Previously submitted (idempotent response)",
				trackingId: existingSubmission.trackingId || undefined,
				sunatTicket: existingSubmission.sunatTicket || undefined,
			};
		}
	}

	const provider = resolveProvider();

	let auditRecord = existingSubmission ?? null;
	if (auditRecord) {
		try {
			auditRecord = await sireSubmissionRepository.incrementAttempt(
				auditRecord.id,
			);
			logger.info(
				{
					idempotencyKey,
					submissionId: auditRecord.id,
					attemptNumber: auditRecord.attemptNumber,
				},
				"Reused existing SIRE audit record",
			);
		} catch (error: unknown) {
			logger.warn(
				{
					error,
					idempotencyKey,
					submissionId: auditRecord.id,
				},
				"Failed to increment attempt for existing SIRE audit record",
			);
		}
	} else {
		try {
			auditRecord = await sireSubmissionRepository.create({
				companyId: input.companyId,
				period: input.period,
				ledgerType: input.ledgerType,
				payloadFormat: input.payloadFormat,
				idempotencyKey,
				provider,
				dryRun: input.dryRun ?? false,
				createdBy: options?.createdBy,
				payloadBase64: input.payloadBase64,
				warnings: buildProposalRecordWarnings(
					input,
					options?.governanceTrace
						? { governance: options.governanceTrace }
						: undefined,
				),
			});

			logger.info(
				{
					idempotencyKey,
					submissionId: auditRecord.id,
					companyId: input.companyId,
					period: input.period,
					ledgerType: input.ledgerType,
				},
				"Created SIRE audit record",
			);
		} catch (error: unknown) {
			logger.warn(
				{
					error,
					idempotencyKey,
					companyId: input.companyId,
					period: input.period,
					ledgerType: input.ledgerType,
				},
				"Failed to create SIRE audit record",
			);
		}
	}

	let failureReason = "SUNAT_CONTEXT_RESOLUTION_FAILED";
	let tenantSunatContext: TenantSunatContext | undefined;
	try {
		tenantSunatContext = await resolveSubmissionTenantContext(input);
		failureReason = "SIRE_SUBMISSION_FAILED";
		const result = await SireSubmissionService.submit(
			{
				...input,
				idempotencyKey,
			},
			tenantSunatContext ? { tenantSunatContext } : undefined,
		);

		if (auditRecord) {
			await sireSubmissionRepository.update(scope, auditRecord.id, {
				status:
					result.status === "ACCEPTED" || result.status === "SIMULATED"
						? "ACCEPTED"
						: result.status === "REJECTED"
							? "REJECTED"
							: "SUBMITTED",
				submissionId: result.submissionId,
				sunatTicket: result.sunatTicket,
				trackingId: result.trackingId,
				sunatMessage: result.message,
				warnings: mergeAuditWarnings(
					auditRecord.warnings,
					options?.governanceTrace,
					buildSunatAuditTrace({
						companyId: input.companyId,
						tenantSunatContext,
						decision: "allowed",
						outcome: result.status,
						suppliedRuc: input.ruc,
					}),
				),
				submittedAt: new Date(result.submittedAt),
				processedAt: new Date(),
			});

			logger.info(
				{
					submissionId: auditRecord.id,
					resultStatus: result.status,
					provider: result.provider,
					trackingId: result.trackingId,
					sunatTicket: result.sunatTicket,
				},
				"Updated SIRE audit record after submission",
			);
		}

		return result;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const isTimeout = error instanceof SireTimeoutError;

		logger.error(
			{
				error,
				companyId: input.companyId,
				period: input.period,
				ledgerType: input.ledgerType,
				idempotencyKey,
				isTimeout,
			},
			"SIRE submission failed",
		);

		if (auditRecord) {
			if (isTimeout) {
				// REQ-D-001: Timeout → UNKNOWN (not FAILED)
				await sireSubmissionRepository.update(scope, auditRecord.id, {
					status: "UNKNOWN",
					sunatStatus: null,
					sunatMessage: errorMessage,
					errors: {
						reason: failureReason,
						message: errorMessage,
						sunatTenant: {
							...buildSunatAuditTrace({
								companyId: input.companyId,
								tenantSunatContext,
								decision: "refused",
								reason: failureReason,
								suppliedRuc: input.ruc,
							}),
							...getTenantContextErrorTrace(error),
						},
					},
					processedAt: new Date(),
				});

				logger.warn(
					{
						submissionId: auditRecord.id,
						errorMessage,
					},
					"Marked SIRE audit record as UNKNOWN (timeout)",
				);
			} else {
				const attemptNumber = auditRecord.attemptNumber ?? 1;
				const nextRetryMinutes = 2 ** attemptNumber;
				const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60 * 1000);

				await sireSubmissionRepository.update(scope, auditRecord.id, {
					status: "FAILED",
					sunatMessage: errorMessage,
					errors: {
						reason: failureReason,
						message: errorMessage,
						sunatTenant: {
							...buildSunatAuditTrace({
								companyId: input.companyId,
								tenantSunatContext,
								decision: "refused",
								reason: failureReason,
								suppliedRuc: input.ruc,
							}),
							...getTenantContextErrorTrace(error),
						},
					},
					processedAt: new Date(),
					nextRetryAt,
				});

				logger.warn(
					{
						submissionId: auditRecord.id,
						nextRetryAt: nextRetryAt.toISOString(),
						errorMessage,
					},
					"Marked SIRE audit record as failed",
				);
			}
		}

		throw error;
	}
};

export const logBlockedSubmissionAttempt = async (
	input: SubmitSireInput,
	governanceTrace: unknown,
	message: string,
	options?: { createdBy?: string },
): Promise<void> => {
	const idempotencyKey = buildIdempotencyKey(input);
	const provider = resolveProvider();

	const blockedScope: TenantScope = {
		organizationId: "",
		companyId: input.companyId,
	};

	let submission = await sireSubmissionRepository.findByIdempotencyKey(
		blockedScope,
		idempotencyKey,
	);

	if (!submission) {
		submission = await sireSubmissionRepository.create({
			companyId: input.companyId,
			period: input.period,
			ledgerType: input.ledgerType,
			payloadFormat: input.payloadFormat,
			idempotencyKey,
			provider,
			dryRun: input.dryRun ?? false,
			createdBy: options?.createdBy,
			warnings: {
				governance: governanceTrace,
			},
		});
	}

	await sireSubmissionRepository.update(blockedScope, submission.id, {
		status: "BLOCKED_POLICY",
		sunatMessage: message,
		errors: {
			governance: governanceTrace,
			reason: message,
		},
		processedAt: new Date(),
	});
};
