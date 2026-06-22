import type { Currency } from "@arkelythex/domain";

export interface FiscalDeterministicValidationInput {
	documentType?: "01" | "03" | "07" | "08" | "09";
	series?: string;
	ruc?: string;
	subtotalAmount?: number;
	igvAmount?: number;
	totalAmount?: number;
	currency?: Currency;
	ublInvoice?: {
		ublVersion?: string;
		invoiceId?: string;
		issueDate?: string;
		supplierRuc?: string;
		totalAmount?: number;
	};
	sire?: {
		expectedDigest: string;
		actualDigest: string;
	};
	retentionDetraction?: {
		baseAmount: number;
		retentionAmount?: number;
		detractionAmount?: number;
		retentionRate?: number;
		detractionRate?: number;
	};
}
