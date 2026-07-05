/**
 * SUNAT Types and Interfaces
 * Type definitions for SUNAT services
 */

export interface RucValidationResult {
	valid: boolean;
	ruc: string;
	razonSocial?: string;
	estado?: string;
	condicion?: string;
	direccion?: string;
	ubigeo?: string;
	message: string;
}

export interface InvoiceXMLData {
	invoiceNumber: string;
	series: string;
	correlative: number;
	issueDate: Date;
	dueDate: Date;
	currency: string;
	company: {
		ruc: string;
		businessName: string;
		address: string;
	};
	customer: {
		taxId: string;
		legalName: string;
		address?: string;
	};
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
		taxType: string;
		igvRate: number;
		subtotal: number;
		igvAmount: number;
		totalAmount: number;
	}>;
	subtotal: number;
	igvAmount: number;
	totalAmount: number;
}

export interface QRCodeData {
	companyRuc: string;
	invoiceType: string;
	series: string;
	correlative: number;
	igvAmount: number;
	totalAmount: number;
	issueDate: Date;
	customerDocType: string;
	customerDocNumber: string;
}

export interface ExchangeRateResult {
	date: string;
	purchase: number;
	sale: number;
	source: string;
}

export interface InvoiceNumberingValidation {
	valid: boolean;
	message: string;
	series?: string;
	correlative?: number;
}

export type RucType =
	| "PERSONA_NATURAL"
	| "EMPRESA"
	| "ENTIDAD_PUBLICA"
	| "INVALID";
