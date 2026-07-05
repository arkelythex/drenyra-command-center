import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../lib/compliance-runbooks";
import { ElectronicInvoicingService } from "../../../services/electronic-invoicing.service";
import { fail, getErrorMessage, ok } from "../../shared/api-response";

type HandlerSet = {
	status?: number | string;
};

/**
 * handleGetComplianceMetrics operation.
 *
 * @param companyId - Input for companyId.
 * @param set - Input for set.
 * @returns Result of handleGetComplianceMetrics.
 * @example
 * ```ts
 * const result = await handleGetComplianceMetrics("", {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleGetComplianceMetrics(
	companyId: string,
	set: HandlerSet,
): Promise<unknown> {
	try {
		const metrics =
			await ElectronicInvoicingService.getComplianceMetrics(companyId);
		return ok(metrics);
	} catch (error: unknown) {
		set.status = 500;
		return fail(
			getErrorMessage(error, "Error interno del servidor"),
			"INTERNAL_ERROR",
			{
				runbook: CPE_COMPLIANCE_INCIDENT_RUNBOOK,
			},
		);
	}
}
