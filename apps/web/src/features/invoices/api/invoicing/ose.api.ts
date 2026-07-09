import { api, getGovernanceAuditHeaders, getTenantHeaders } from "@/lib/api";
import {
	ApiError,
	extractOkDataOrPassthrough,
	unwrap,
} from "@/lib/api-helpers";
import {
	extractResponseErrorMessage,
	isInvoiceOseLifecycle,
	requestBinaryFile,
	resolveApiUrl,
} from "./helpers";

/**
 * Enviar factura a SUNAT via OSE
 *
 * Process:
 * 1. Generate UBL 2.1 XML
 * 2. Sign with XAdES-EPES (SUNAT requirement)
 * 3. Send to OSE (Operador de Servicios Electrónicos)
 * 4. Update status to SENT if successful
 *
 * IMPORTANT: Only DRAFT or SENT invoices can be submitted
 */
export async function invoicingSendOSE(id: string) {
	return unwrap(
		api.api.invoices({ id })["send-ose"].post(undefined, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function invoicingGetOseLifecycleByInvoice(invoiceId: string) {
	const safeInvoiceId = encodeURIComponent(invoiceId);
	const response = await fetch(
		resolveApiUrl(`/electronic-invoicing/lifecycle/invoice/${safeInvoiceId}`),
		{
			method: "GET",
			credentials: "include",
			headers: {
				...getTenantHeaders(),
				...getGovernanceAuditHeaders(),
			},
		},
	);

	if (!response.ok) {
		const message = await extractResponseErrorMessage(response);
		throw new ApiError(
			message ?? `No se pudo cargar la trazabilidad OSE (${response.status})`,
			response.status.toString(),
		);
	}

	const payload: unknown = await response.json();
	const lifecycle = extractOkDataOrPassthrough(
		payload,
		"No se pudo cargar la trazabilidad OSE",
	);

	if (!isInvoiceOseLifecycle(lifecycle)) {
		throw new ApiError("Invalid OSE lifecycle response");
	}

	return lifecycle;
}

export async function invoicingDownloadInvoicePdf(
	invoiceId: string,
	fallbackFilename?: string,
) {
	const safeInvoiceId = encodeURIComponent(invoiceId);
	return requestBinaryFile(
		`/api/pdf/invoice/${safeInvoiceId}`,
		fallbackFilename ?? `Factura_${invoiceId}.pdf`,
		"Error al descargar PDF",
	);
}

export async function invoicingPreviewInvoicePdf(invoiceId: string) {
	const safeInvoiceId = encodeURIComponent(invoiceId);
	return requestBinaryFile(
		`/api/pdf/invoice/${safeInvoiceId}/preview`,
		`Factura_${invoiceId}.pdf`,
		"Error al generar vista previa",
	);
}

export async function invoicingExportInvoicesExcel() {
	const today = new Date().toISOString().split("T")[0];
	return requestBinaryFile(
		"/api/export/invoices/excel",
		`Facturas_${today}.xlsx`,
		"Error al exportar a Excel",
	);
}

export async function invoicingExportInvoicesCsv() {
	const today = new Date().toISOString().split("T")[0];
	return requestBinaryFile(
		"/api/export/invoices/csv",
		`Facturas_${today}.csv`,
		"Error al exportar a CSV",
	);
}
