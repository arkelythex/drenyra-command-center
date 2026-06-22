/**
 * CPE (Comprobante de Pago Electrónico) domain types.
 * Pure type definitions with zero dependencies.
 */

/** Raw electronic invoice input data from external systems */
export interface ElectronicInvoiceData {
	companyId: string;
	transactionId: string;
	xmlContent: string;
	invoiceNumber: string;
	invoiceType: "01" | "03"; // 01=Factura, 03=Boleta
}

/** Result of electronic invoice processing */
export interface ElectronicInvoiceResult {
	success: boolean;
	transactionId: string;
	status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "OBSERVED" | "ANNULLED";
	cdrContent?: string;
	sunatCode?: string;
	sunatMessage?: string;
	error?: string;
	processingTime: number;
	runbook?: RunbookReference;
}

/** Complete lifecycle snapshot for CPE traceability */
export interface CpeLifecycleSnapshot {
	invoiceId?: string;
	transactionId: string;
	invoiceNumber: string;
	currentStatus: string;
	sunatStatus: string | null;
	sunatCode: string | null;
	sunatMessage: string | null;
	createdAt: Date;
	updatedAt: Date;
	runbook?: RunbookReference;
	evidence: {
		invoiceLinked: boolean;
		oseSubmissionRecorded: boolean;
		sunatResponseCaptured: boolean;
		cdrEvidenceStored: boolean;
		statusTransitionRecorded: boolean;
		latestProviderReference: string | null;
		lastEventAt: Date | null;
	};
	traceability: {
		traceable: boolean;
		finalStateReached: boolean;
		missing: string[];
	};
	timeline: Array<{
		stage: string;
		status: string;
		at: Date;
		source: "SYSTEM" | "SUNAT";
		message?: string;
		metadata?: Record<string, unknown>;
	}>;
}

/** Async CDR webhook payload from OSE provider */
export interface CdrWebhookPayload {
	transactionId?: string;
	invoiceNumber: string;
	cdrStatus: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
	sunatCode?: string;
	sunatDescription?: string;
	cdrContent?: string;
	providerReference?: string;
	occurredAt?: string;
}

/** Result of CDR webhook processing */
export interface CdrWebhookResult {
	success: boolean;
	transactionId?: string;
	invoiceNumber: string;
	status?: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "OBSERVED" | "ANNULLED";
	message: string;
}

/** Internal trail event for lifecycle tracking */
export interface ElectronicInvoicingTrailEvent {
	stage: string;
	status: string;
	source: "SYSTEM" | "SUNAT";
	message: string;
	at: string;
	metadata?: Record<string, unknown>;
}

/** Validated XML invoice data extracted from UBL 2.1 */
export interface ValidatedXmlInvoiceData {
	ruc?: string;
	totalAmount: number;
	invoice: Record<string, unknown>;
}

/** Transaction record for consistency checks */
export interface TransactionConsistencyRecord {
	totalAmount: string;
	partnerId: string | null;
}

/** Compliance metrics for dashboard display */
export interface ComplianceMetrics {
	totalSent: number;
	accepted: number;
	rejected: number;
	observed: number;
	acceptanceRate: number;
	recentErrors: Array<{
		invoiceNumber: string;
		error: string;
		date: Date;
	}>;
}

/** Runbook reference for compliance incident resolution */
export interface RunbookReference {
	id: string;
	title: string;
	path?: string;
}
