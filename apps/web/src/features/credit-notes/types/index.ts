export interface CreditNoteRecord {
	id: string;
	referenceInvoiceId: string;
	creditNoteType: "ANULACION" | "DESCUENTO" | "DEVOLUCION" | "OTROS";
	reason: string;
	fullNumber: string;
	series: string;
	number: number;
	totalAmount: string;
	baseAmount: string;
	igvAmount: string;
	currency: string;
	status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
	issueDate: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreditNoteListFilters {
	companyId: string;
	referenceInvoiceId?: string;
	creditNoteType?: string;
	status?: string;
	startDate?: string;
	endDate?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface CreateCreditNotePayload {
	companyId: string;
	referenceInvoiceId: string;
	creditNoteType: string;
	reason: string;
	series: string;
	issueDate: string;
	currency: "PEN" | "USD" | "EUR";
	baseAmount: string;
	igvAmount: string;
}
