/**
 * Invoice status types
 */
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

/**
 * Currency types
 */
export type Currency = "PEN" | "USD" | "EUR";

/**
 * Tax types for invoice items
 */
export type TaxType = "GRAVADO" | "EXONERADO" | "INAFECTO";

/**
 * Invoice item for creation/update
 */
export interface InvoiceItem {
	productId?: string;
	description: string;
	quantity: string; // Decimal string (e.g., "10.50")
	unitPrice: string; // Decimal string (e.g., "25.00")
	taxType?: TaxType;
}

/**
 * Payload para crear factura
 *
 * Matches backend schema (apps/api/src/features/invoice/api/routes.ts:95-128)
 */
export interface CreateInvoicePayload {
	companyId: string;
	customerId: string;
	series: string; // F001 or B001 (pattern: ^[FB]\d{3}$)
	issueDate: string; // ISO date
	dueDate: string; // ISO date
	currency: Currency;
	exchangeRate?: number;
	notes?: string;
	items: InvoiceItem[]; // Min 1, Max 50
}

/**
 * Payload para actualizar factura DRAFT
 *
 * Matches backend schema (apps/api/src/features/invoice/api/routes.ts:298-325)
 */
export interface UpdateInvoicePayload {
	customerId: string;
	issueDate: string;
	dueDate: string;
	currency: Currency;
	exchangeRate?: number;
	notes?: string;
	items: InvoiceItem[];
}

/**
 * Filtros para listar facturas
 */
export interface InvoiceListFilters {
	companyId: string;
	status?: InvoiceStatus;
	customerId?: string;
	startDate?: string; // ISO date
	endDate?: string; // ISO date
	minAmount?: string;
	maxAmount?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

/**
 * Payload para aplicar pago
 */
export interface ApplyPaymentPayload {
	amount: string; // Decimal string
	currency: Currency;
}

export interface InvoiceOseLifecycle {
	invoiceId?: string;
	transactionId: string;
	invoiceNumber: string;
	currentStatus: string;
	sunatStatus?: string | null;
	sunatCode?: string | null;
	sunatMessage?: string | null;
	runbook?: {
		id?: string;
		path: string;
		anchor?: string;
	};
	timeline?: Array<{
		stage: string;
		status: string;
		source: "SYSTEM" | "SUNAT";
		message?: string;
		at: string | Date;
	}>;
}

export interface BinaryFilePayload {
	blob: Blob;
	filename: string;
}
