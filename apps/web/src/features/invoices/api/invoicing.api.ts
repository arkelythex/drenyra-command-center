/**
 * Invoicing API — barrel
 *
 * Re-exports everything from the split modules for backward compatibility.
 * Previously a 476-line monolith, now split into:
 *   - invoicing/types.ts       — type definitions
 *   - invoicing/helpers.ts     — utility/helper functions
 *   - invoicing/invoice.api.ts — invoice CRUD endpoints
 *   - invoicing/ose.api.ts     — OSE lifecycle, PDF, and export endpoints
 */

// Re-export helper functions
export { downloadBlobFile, normalizeInvoicingError } from "./invoicing/helpers";
// Re-export all types
export type {
	ApplyPaymentPayload,
	BinaryFilePayload,
	CreateInvoicePayload,
	Currency,
	InvoiceItem,
	InvoiceListFilters,
	InvoiceOseLifecycle,
	InvoiceStatus,
	TaxType,
	UpdateInvoicePayload,
} from "./invoicing/types";

// Compose the full invoicingApi from sub-modules
import {
	invoicingCreate,
	invoicingDelete,
	invoicingGetById,
	invoicingList,
	invoicingPay,
	invoicingUpdate,
	invoicingUpdateStatus,
} from "./invoicing/invoice.api";

import {
	invoicingDownloadInvoicePdf,
	invoicingExportInvoicesCsv,
	invoicingExportInvoicesExcel,
	invoicingGetOseLifecycleByInvoice,
	invoicingPreviewInvoicePdf,
	invoicingSendOSE,
} from "./invoicing/ose.api";

/**
 * Invoices API client (Type-safe)
 *
 * Leverages Eden Treaty + ok()/fail() pattern for full type inference.
 * Includes SUNAT OSE integration for electronic invoicing (UBL 2.1, XAdES-EPES).
 */
export const invoicingApi = {
	create: invoicingCreate,
	list: invoicingList,
	getById: invoicingGetById,
	update: invoicingUpdate,
	updateStatus: invoicingUpdateStatus,
	delete: invoicingDelete,
	pay: invoicingPay,
	sendOSE: invoicingSendOSE,
	getOseLifecycleByInvoice: invoicingGetOseLifecycleByInvoice,
	downloadInvoicePdf: invoicingDownloadInvoicePdf,
	previewInvoicePdf: invoicingPreviewInvoicePdf,
	exportInvoicesExcel: invoicingExportInvoicesExcel,
	exportInvoicesCsv: invoicingExportInvoicesCsv,
};
