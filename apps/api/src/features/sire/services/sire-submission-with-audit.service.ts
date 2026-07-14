/**
 * SIRE Submission Service with Audit Trail
 *
 * Wrapper around SireSubmissionService that adds:
 * - Database audit trail (all submissions logged)
 * - Idempotency checking (prevent duplicate submissions)
 * - Retry tracking (failed submissions marked for retry)
 *
 * **Usage:**
 * ```ts
 * // Use this instead of direct SireSubmissionService
 * import { submitWithAudit } from './services/sire-submission-with-audit.service';
 *
 * const result = await submitWithAudit({
 *   companyId: 'cmp_123',
 *   period: '2026-02',
 *   ledgerType: 'ventas',
 *   payloadFormat: 'txt',
 *   payloadBase64: 'dGVzdA==',
 *   idempotencyKey: 'unique-key-123', // Required for idempotency
 * });
 * ```
 */

import { randomBytes } from "node:crypto";
import { sireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
import { createLogger } from "../../../lib/logger";
import {
	type SireSubmissionResult,
	SireSubmissionService,
	type SubmitSireInput,
} from "../sire-submission.service";
import type { SireSubmissionConfig, TenantSunatContext } from "../types";
import { buildSireConfig } from "./sire-config.service";
import {
	resolveTenantSunatContext,
	TenantSunatContextError,
} from "./tenant-sunat-context.service";

interface SireAuditOptions {
	createdBy?: string;
	governanceTrace?: unknown;
}

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

type SunatAuditTrace = {
	companyId: string;
	resolvedRuc?: string;
	credentialFingerprint?: string;
	decision: "allowed" | "refused";
	outcome?: string;
	reason?: string;
	suppliedRuc?: string;
	comparedRuc?: string;
};

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

/**
 * Submit SIRE with full audit trail
 *
 * **Idempotency:**
 * - If `idempotencyKey` provided and submission exists → returns existing result
 * - If `idempotencyKey` not provided → generates UUID
 * - Prevents duplicate submissions to SUNAT
 *
 * **Audit Trail:**
 * - BEFORE submission: Creates DB record (status: PENDING)
 * - AFTER submission: Updates DB record with SUNAT response
 * - ON ERROR: Marks as FAILED with error details and next retry time
 * @param input - Input for input.
 * @param options - Input for options.
 * @returns Result of submitWithAudit.
 * @throws Error when submitWithAudit cannot complete successfully.
 * @example
 * ```ts
 * const result = await submitWithAudit({} as SubmitSireInput, {} as SireAuditOptions);
 * console.log(result);
 * ```
 */

export const submitWithAudit = async (
	input: SubmitSireInput,
	options?: SireAuditOptions,
): Promise<SireSubmissionResult> => {
	// Generate idempotency key if not provided
	const idempotencyKey = buildIdempotencyKey(input);

	// Check for existing submission (idempotency)
	const existingSubmission =
		await sireSubmissionRepository.findByIdempotencyKey(idempotencyKey, {
			companyId: input.companyId,
		});

	if (existingSubmission) {
		logger.info(
			{
				idempotencyKey,
				submissionId: existingSubmission.id,
				status: existingSubmission.status,
			},
			"Idempotent SIRE submission detected",
		);

		// Return cached result if already completed
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

		// If failed or pending, continue with retry (will be updated)
	}

	// Determine provider based on config
	const provider = resolveProvider();

	// Create (or reuse) audit trail record BEFORE submission
	let auditRecord = existingSubmission ?? null;
	if (auditRecord) {
		try {
			auditRecord = await sireSubmissionRepository.incrementAttempt(
				auditRecord.id,
				input.companyId,
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
				warnings: options?.governanceTrace
					? { governance: options.governanceTrace }
					: undefined,
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
			// If DB insert fails, continue anyway (audit is best-effort)
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

	// Perform actual submission
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

		// Update audit trail with successful result
		if (auditRecord) {
			await sireSubmissionRepository.update(
				auditRecord.id,
				{
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
				},
				{ companyId: input.companyId },
			);

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

		logger.error(
			{
				error,
				companyId: input.companyId,
				period: input.period,
				ledgerType: input.ledgerType,
				idempotencyKey,
			},
			"SIRE submission failed",
		);

		// Update audit trail with error
		if (auditRecord) {
			// Calculate next retry time (exponential backoff: 2, 4, 8 minutes)
			const attemptNumber = auditRecord.attemptNumber ?? 1;
			const nextRetryMinutes = 2 ** attemptNumber; // 2^1 = 2, 2^2 = 4, 2^3 = 8
			const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60 * 1000);

			await sireSubmissionRepository.update(
				auditRecord.id,
				{
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
				},
				{ companyId: input.companyId },
			);

			logger.warn(
				{
					submissionId: auditRecord.id,
					nextRetryAt: nextRetryAt.toISOString(),
					errorMessage,
				},
				"Marked SIRE audit record as failed",
			);
		}

		// Re-throw error
		throw error;
	}
};

/**
 * logBlockedSubmissionAttempt operation.
 *
 * @param input - Input for input.
 * @param governanceTrace - Input for governanceTrace.
 * @param message - Input for message.
 * @param options - Input for options.
 * @returns Result of logBlockedSubmissionAttempt.
 * @example
 * ```ts
 * const result = await logBlockedSubmissionAttempt({} as SubmitSireInput, undefined, "", {});
 * console.log(result);
 * ```
 */
export const logBlockedSubmissionAttempt = async (
	input: SubmitSireInput,
	governanceTrace: unknown,
	message: string,
	options?: { createdBy?: string },
): Promise<void> => {
	const idempotencyKey = buildIdempotencyKey(input);
	const provider = resolveProvider();

	let submission = await sireSubmissionRepository.findByIdempotencyKey(
		idempotencyKey,
		{ companyId: input.companyId },
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

	await sireSubmissionRepository.update(
		submission.id,
		{
			status: "BLOCKED_POLICY",
			sunatMessage: message,
			errors: {
				governance: governanceTrace,
				reason: message,
			},
			processedAt: new Date(),
		},
		{ companyId: input.companyId },
	);
};
