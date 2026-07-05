import { CPE_COMPLIANCE_INCIDENT_RUNBOOK } from "../../../lib/compliance-runbooks";
import { ElectronicInvoicingService } from "../../../services/electronic-invoicing.service";
import { OSEService } from "../../../services/ose.service";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { readCompanyIdFromHeaders } from "../../shared/company-scope";
import type { CdrWebhookBody } from "../schemas";

type HandlerSet = {
	status?: number | string;
};

type HeaderBag = Record<string, unknown>;

/**
 * handleProcessCdrWebhook operation.
 *
 * @param body - Input for body.
 * @param headers - Input for headers.
 * @param set - Input for set.
 * @returns Result of handleProcessCdrWebhook.
 * @example
 * ```ts
 * const result = await handleProcessCdrWebhook({} as CdrWebhookBody, {} as HeaderBag, {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleProcessCdrWebhook(
	body: CdrWebhookBody,
	headers: HeaderBag,
	set: HandlerSet,
): Promise<unknown> {
	try {
		const signature = readSignature(headers);
		const isValid = OSEService.verifyWebhookSignature(
			JSON.stringify(body),
			signature,
		);

		if (!isValid) {
			set.status = 401;
			return fail("Firma de webhook inválida", "INVALID_WEBHOOK_SIGNATURE");
		}

		const result = await ElectronicInvoicingService.processCdrWebhook(
			body,
			readCompanyIdFromHeaders(headers) ?? undefined,
		);
		if (!result.success) {
			set.status = 404;
			return fail(result.message, "TRANSACTION_NOT_FOUND");
		}

		return ok(result);
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

function readSignature(headers: HeaderBag): string | undefined {
	const preferred = headers["x-ose-signature"];
	if (typeof preferred === "string") return preferred;

	const fallback = headers["x-signature"];
	if (typeof fallback === "string") return fallback;

	return undefined;
}
