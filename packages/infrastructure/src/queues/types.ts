export const QUEUE_NAMES = {
	OCR_PROCESSING: "ocr-processing",
	AI_ANALYSIS: "ai-analysis",
	SUNAT_SUBMISSION: "sunat-submission",
	EMAIL_NOTIFICATION: "email-notification",
	REPORT_GENERATION: "report-generation",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface OCRJobData {
	documentId: string;
	fileUrl: string;
	organizationId: string;
	userId: string;
	mode: "standard" | "forensic";
}

export interface AIAnalysisJobData {
	documentId: string;
	analysisType:
		| "classification"
		| "validation"
		| "fraud_detection"
		| "antigravity";
	context?: Record<string, unknown>;
}

export interface SUNATSubmissionJobData {
	invoiceId: string;
	documentType: "factura" | "boleta" | "nota_credito" | "nota_debito";
	retryCount?: number;
}

export interface EmailJobData {
	to: string;
	template: string;
	data: Record<string, unknown>;
}

export interface ReportJobData {
	reportType: "balance" | "income" | "ledger" | "trial_balance";
	organizationId: string;
	dateFrom: string;
	dateTo: string;
	format: "pdf" | "excel" | "csv";
}
