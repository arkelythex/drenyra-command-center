import type { CompanyContext } from "../../../../../shared/plugins";
import { getInvoice } from "../../application/queries/get-invoice.query";
import type { Invoice } from "../../domain/invoice.entity";

/**
 * Tenant-scoped invoice lookup result envelope.
 *
 * @example
 * ```ts
 * const result: ScopedInvoiceLoadResult = await loadScopedInvoice("inv_1", {} as CompanyContext);
 * ```
 */
export type ScopedInvoiceLoadResult =
	| {
			ok: true;
			companyId: string;
			invoice: Invoice;
	  }
	| {
			ok: false;
			error: string;
			code: string;
			status: 400 | 403 | 404;
	  };

/**
 * Loads an invoice and validates tenant scope from provided company context.
 *
 * @param invoiceId - Invoice identifier
 * @param companyContext - Company-scoped context resolved by the guard
 * @returns Scoped invoice result with tenant-safe status information
 * @example
 * ```ts
 * const scoped = await loadScopedInvoice("inv_1", { companyId: "cmp_1" } as CompanyContext);
 * ```
 */
export async function loadScopedInvoice(
	invoiceId: string,
	companyContext: CompanyContext | undefined,
): Promise<ScopedInvoiceLoadResult> {
	if (!companyContext) {
		return {
			ok: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
			status: 400,
		};
	}
	const invoice = await getInvoice({ id: invoiceId });
	if (!invoice) {
		return {
			ok: false,
			error: "Invoice not found",
			code: "INVOICE_NOT_FOUND_ERROR",
			status: 404,
		};
	}

	if (invoice.companyId !== companyContext.companyId) {
		return {
			ok: false,
			error: "Requested companyId does not match caller tenant scope",
			code: "TENANT_SCOPE_VIOLATION",
			status: 403,
		};
	}

	return {
		ok: true,
		companyId: companyContext.companyId,
		invoice,
	};
}
