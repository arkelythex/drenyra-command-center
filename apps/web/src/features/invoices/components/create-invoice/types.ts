import type { CreateInvoicePayload as ApiCreateInvoicePayload } from "../../api/invoicing.api";
import type { InvoiceItem } from "./hooks/useInvoiceCalculations";

export type InvoiceCurrency = "PEN" | "USD";

export interface InvoiceCustomerOption {
	id: string;
	legalName: string;
	taxId: string;
}

export interface CreateInvoicePayload
	extends Omit<ApiCreateInvoicePayload, "currency" | "items"> {
	currency: InvoiceCurrency;
	notes?: string;
	items: Array<{
		productId?: string;
		description: string;
		quantity: string;
		unitPrice: string;
		taxType?: InvoiceItem["taxType"];
	}>;
}
