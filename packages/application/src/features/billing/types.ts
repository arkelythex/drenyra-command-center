/**
 * Billing — DTO types for frontend consumption (Invoices + Bills).
 *
 * @module @drenyra/application/billing
 */

import type { CurrencyCode } from "../banking/types";

// ─── Invoice DTOs ────────────────────────────────────────────────

export type InvoiceStatus =
	| "DRAFT"
	| "SENT"
	| "PAID"
	| "PARTIAL"
	| "OVERDUE"
	| "CANCELLED";

export interface InvoiceItemDTO {
	id: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: string;
	taxType: string;
	igvRate: string;
	subtotal: string;
	igvAmount: string;
	totalAmount: string;
}

export interface InvoiceDTO {
	id: string;
	companyId: string;
	customerId: string;
	invoiceNumber: string;
	series: string;
	correlative: number;
	issueDate: string;
	dueDate: string;
	currency: CurrencyCode;
	exchangeRate: string;
	subtotal: string;
	igvAmount: string;
	totalAmount: string;
	balanceDue: string;
	paidAmount: string;
	status: InvoiceStatus;
	sunatCdr?: string;
	sunatTicket?: string;
	sunatStatus?: string;
	notes?: string;
	items: InvoiceItemDTO[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateInvoiceRequest {
	customerId: string;
	series: string;
	issueDate: string;
	dueDate: string;
	currency: CurrencyCode;
	exchangeRate?: number;
	notes?: string;
	items: Array<{
		productId?: string;
		description: string;
		quantity: number;
		unitPrice: number;
		taxType?: string;
	}>;
}

export interface InvoiceListFilters {
	status?: InvoiceStatus;
	customerId?: string;
	startDate?: string;
	endDate?: string;
	minAmount?: number;
	maxAmount?: number;
	search?: string;
	limit?: number;
	offset?: number;
}

// ─── Bill DTOs ───────────────────────────────────────────────────

export type BillStatus =
	| "DRAFT"
	| "SENT"
	| "PAID"
	| "PARTIAL"
	| "OVERDUE"
	| "CANCELLED";

export interface BillItemDTO {
	id?: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: string;
	total: string;
}

export interface BillDTO {
	id: string;
	companyId: string;
	vendorId: string;
	billNumber: string;
	issueDate: string;
	dueDate: string;
	currency: CurrencyCode;
	exchangeRate: number;
	subtotal: string;
	igvAmount: string;
	totalAmount: string;
	balanceDue: string;
	status: BillStatus;
	notes?: string;
	tags?: string[];
	items: BillItemDTO[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateBillRequest {
	vendorId: string;
	billNumber: string;
	issueDate: string;
	dueDate: string;
	currency: CurrencyCode;
	exchangeRate?: number;
	notes?: string;
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
	}>;
}
