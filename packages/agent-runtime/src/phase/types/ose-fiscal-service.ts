// ─── OSE Fiscal Document Service Interface ──────────────────────
// Abstraction for SUNAT document submission and declaration filing.
// The phase layer depends on this interface; the adapter lives in apps/api.

/** Input for submitting a single CPE to SUNAT via OSE */
export interface CpeSubmitInput {
	ruc: string;
	invoiceId: string;
	invoiceType: string; // "01"=Invoice, "03"=Receipt, "07"=Credit Note, "08"=Debit Note
	serie: string;
	correlativo: string;
	monto: number;
	xmlBase64?: string; // base64-encoded signed ZIP
}

/** Result from submitting a CPE via OSE */
export interface CpeSubmitResult {
	success: boolean;
	cdrId?: string;
	cdrStatus?: "ACEPTADO" | "OBSERVADO" | "RECHAZADO";
	cdrDescription?: string;
	ticketNumber?: string;
	error?: string;
}

/** Input for a period-level declaration (SIRE / PDT) */
export interface PeriodDeclarationInput {
	ruc: string;
	periodo: string; // YYYY-MM
	tipoDeclaracion: "SIRE" | "PDT621" | "PLAME";
	/** Company UUID from the API session context */
	companyId?: string;
	/** Signed XML manifest content */
	xmlContent?: string;
	/** Summary stats for the declaration */
	summary: {
		totalInvoiceCount: number;
		totalSalesAmount: number;
		totalPurchaseAmount: number;
		totalIgv: number;
	};
}

/** Result of a period-level declaration */
export interface PeriodDeclarationResult {
	success: boolean;
	ticketNumber?: string;
	cdrId?: string;
	cdrStatus?: "ACEPTADO" | "OBSERVADO" | "RECHAZADO" | "PENDIENTE";
	error?: string;
	acceptedAt?: string; // ISO date
}

/** Full interface for the fiscal document service */
export interface FiscalDocumentService {
	/** Submit a single CPE (invoice, receipt, credit/debit note) */
	submitCpe(input: CpeSubmitInput): Promise<CpeSubmitResult>;
	/** Check the status of a previously submitted ticket */
	checkTicket(
		ticketNumber: string,
		ruc: string,
	): Promise<{
		status: "PENDIENTE" | "PROCESADO" | "ERROR";
		cdr?: { id: string; status: string; description: string };
	}>;
	/** Submit a period-level declaration (SIRE/PDT/PLAME) */
	submitPeriodDeclaration(
		input: PeriodDeclarationInput,
	): Promise<PeriodDeclarationResult>;
}
