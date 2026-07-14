import { createLogger } from "../../../../lib/logger";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";
import { enforceGovernancePolicy } from "../../../shared/governance";
import {
	logBlockedSubmissionAttempt,
	submitWithAudit,
} from "../../services/sire-submission-with-audit.service";

const logger = createLogger({ module: "sire/submit-command" });

/**
 * Submit SIRE with verified tenant context.
 *
 * Wave 3A: `verifiedCompanyId` MUST come from the authenticated TenantContext,
 * NOT from the request body. The body's `companyId` is treated only as a
 * client-side selection hint and MUST match the verified context.
 *
 * @param body - Request body (may contain companyId for client-side routing)
 * @param set - Elysia response setter
 * @param verifiedCompanyId - Verified company ID from tenantAuth middleware
 */
export async function submitSire(
	// biome-ignore lint/suspicious/noExplicitAny: Elysia body is untyped at command boundary
	body: any,
	// biome-ignore lint/suspicious/noExplicitAny: Elysia set is untyped at command boundary
	set: any,
	verifiedCompanyId?: string,
) {
	// Wave 3A: Override body.companyId with verified context
	const resolvedCompanyId = verifiedCompanyId ?? body.companyId;

	const governance = await enforceGovernancePolicy({
		action: "sire_submit",
		priority: body.dryRun ? "medium" : "high",
		governance: body.governance,
		fallbackObjective: `sire_submission_${body.ledgerType}`,
		set,
		// biome-ignore lint/suspicious/noExplicitAny: governance policy decision is untyped
		onBlocked: async (decision: any) => {
			try {
				await logBlockedSubmissionAttempt(
					body,
					decision.trace,
					decision.message ?? "Execution blocked by autonomy policy",
				);
			} catch (auditError: unknown) {
				logger.warn(
					{
						auditError,
						companyId: resolvedCompanyId,
						dryRun: body.dryRun,
						ledgerType: body.ledgerType,
						period: body.period,
					},
					"Failed to persist blocked SIRE submission trace",
				);
			}
		},
	});

	if (!governance.allowed) {
		return governance.response;
	}

	try {
		const result = await submitWithAudit(
			{ ...body, companyId: resolvedCompanyId },
			{ governanceTrace: governance.trace },
		);
		set.status = 202;
		return ok({
			...result,
			governance: governance.trace,
		});
	} catch (error: unknown) {
		const message = getErrorMessage(error, "SIRE submission failed");
		const normalized = message.toLowerCase();

		if (normalized.includes("rate limit")) {
			return fail(message, "SIRE_RATE_LIMIT_EXCEEDED");
		}

		if (normalized.includes("invalid") || normalized.includes("required")) {
			set.status = 400;
		} else if (
			normalized.includes("401") ||
			normalized.includes("403") ||
			normalized.includes("unauthorized") ||
			normalized.includes("forbidden")
		) {
			set.status = 401;
		} else if (normalized.includes("timeout")) {
			set.status = 504;
		} else {
			set.status = 502;
		}

		return fail(message, "SIRE_SUBMISSION_ERROR");
	}
}
