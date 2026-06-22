import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../lib/compliance-runbooks";
import { logger } from "../../../lib/logger";
import { ElectronicInvoicingService } from "../../../services/electronic-invoicing.service";
import type { CompanyContext } from "../../../shared/plugins";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { enforceGovernancePolicy } from "../../shared/governance";
import type { SendElectronicInvoiceBody } from "../schemas";

type HandlerSet = {
	status?: number | string;
};

/**
 * Sends one electronic invoice through the compliance pipeline.
 *
 * @param body - Request payload with transaction and invoice metadata
 * @param companyContext - Company-scoped context resolved by the guard
 * @param set - Elysia mutable response status container
 * @returns Processing result payload with governance trace or normalized API error
 * @example
 * ```ts
 * const result = await handleSendElectronicInvoice({} as SendElectronicInvoiceBody, {} as CompanyContext, {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleSendElectronicInvoice(
	body: SendElectronicInvoiceBody,
	companyContext: CompanyContext | undefined,
	set: HandlerSet,
): Promise<unknown> {
	if (!companyContext) {
		set.status = 401;
		return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
	}

	const governance = await enforceGovernancePolicy({
		action: "electronic_invoice_send",
		priority: body.priority ?? "high",
		governance: body.governance,
		fallbackObjective: `electronic_invoicing_${body.invoiceType}`,
		set,
		onBlocked: async (decision) => {
			await persistGovernanceDecision(body.transactionId, decision.trace);
		},
	});

	if (!governance.allowed) {
		return governance.response;
	}

	await persistGovernanceDecision(body.transactionId, governance.trace);

	try {
		const result = await ElectronicInvoicingService.processElectronicInvoice({
			...body,
			companyId: companyContext.companyId,
		});
		if (!result.success && result.runbook) {
			logger.warn(
				{
					feature: "electronic-invoicing",
					route: "/electronic-invoicing/send",
					transactionId: result.transactionId,
					status: result.status,
					runbookId: result.runbook.id,
					runbookPath: result.runbook.path,
				},
				"Electronic invoicing incident detected",
			);
		}

		return ok({
			...result,
			governance: governance.trace,
		});
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

async function persistGovernanceDecision(
	transactionId: string,
	trace: unknown,
): Promise<void> {
	try {
		await ElectronicInvoicingService.recordGovernanceDecision(
			transactionId,
			trace,
		);
	} catch (error: unknown) {
		const traceRecord =
			trace && typeof trace === "object"
				? (trace as Record<string, unknown>)
				: {};

		logger.warn(
			{
				feature: "electronic-invoicing",
				route: "/electronic-invoicing/send",
				transactionId,
				governanceDecision:
					typeof traceRecord.decision === "string"
						? traceRecord.decision
						: "UNKNOWN",
				governanceError: getErrorMessage(error),
			},
			"Unable to persist governance trace for electronic invoicing",
		);
	}
}
