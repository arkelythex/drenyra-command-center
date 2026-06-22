import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../lib/compliance-runbooks";
import { logger } from "../../../lib/logger";
import { ElectronicInvoicingService } from "../../../services/electronic-invoicing.service";
import type { CompanyContext } from "../../../shared/plugins";
import { fail, getErrorMessage, ok } from "../../shared/api-response";

type HandlerSet = {
	status?: number | string;
};

/**
 * Returns lifecycle details for one electronic invoicing transaction.
 *
 * @param transactionId - Electronic invoicing transaction identifier
 * @param companyContext - Company-scoped context resolved by the guard
 * @param set - Elysia mutable response status container
 * @returns Lifecycle payload or normalized API error envelope
 * @example
 * ```ts
 * const result = await handleGetTransactionLifecycle("tx_1", {} as CompanyContext, {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleGetTransactionLifecycle(
	transactionId: string,
	companyContext: CompanyContext | undefined,
	set: HandlerSet,
): Promise<unknown> {
	if (!companyContext) {
		set.status = 401;
		return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
	}
	try {
		const lifecycle = await ElectronicInvoicingService.getTransactionLifecycle(
			transactionId,
			companyContext.companyId,
		);
		if (!lifecycle) {
			set.status = 404;
			return fail("Transacción no encontrada", "NOT_FOUND");
		}

		if (lifecycle.runbook) {
			logger.warn(
				{
					feature: "electronic-invoicing",
					route: "/electronic-invoicing/lifecycle/:transactionId",
					transactionId,
					currentStatus: lifecycle.currentStatus,
					runbookId: lifecycle.runbook.id,
					runbookPath: lifecycle.runbook.path,
				},
				"Lifecycle indicates compliance incident",
			);
		}

		return ok(lifecycle);
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

/**
 * Returns lifecycle details using invoice id lookup.
 *
 * @param invoiceId - Invoice identifier
 * @param companyContext - Company-scoped context resolved by the guard
 * @param set - Elysia mutable response status container
 * @returns Lifecycle payload or normalized API error envelope
 * @example
 * ```ts
 * const result = await handleGetInvoiceLifecycle("inv_1", {} as CompanyContext, {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleGetInvoiceLifecycle(
	invoiceId: string,
	companyContext: CompanyContext | undefined,
	set: HandlerSet,
): Promise<unknown> {
	if (!companyContext) {
		set.status = 401;
		return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
	}
	try {
		const lifecycle = await ElectronicInvoicingService.getLifecycleByInvoiceId(
			invoiceId,
			companyContext.companyId,
		);
		if (!lifecycle) {
			set.status = 404;
			return fail(
				"Factura no encontrada o sin transacción asociada",
				"NOT_FOUND",
			);
		}

		if (lifecycle.runbook) {
			logger.warn(
				{
					feature: "electronic-invoicing",
					route: "/electronic-invoicing/lifecycle/invoice/:invoiceId",
					invoiceId,
					transactionId: lifecycle.transactionId,
					currentStatus: lifecycle.currentStatus,
					runbookId: lifecycle.runbook.id,
					runbookPath: lifecycle.runbook.path,
				},
				"Invoice lifecycle indicates compliance incident",
			);
		}

		return ok(lifecycle);
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
