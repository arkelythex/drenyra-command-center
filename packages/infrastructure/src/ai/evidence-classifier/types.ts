export interface ClassificationRequest {
	evidenceId: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	contentHash: string;
	metadata?: Record<string, unknown>;
}

export interface ClassificationResult {
	evidenceType: string;
	confidence: number;
	labels: string[];
	summary: string;
	extractedFields?: Record<string, unknown>;
	processingTimeMs: number;
}

export interface ClassifierError {
	evidenceId: string;
	error: string;
	code: "UNSUPPORTED_TYPE" | "SERVICE_UNAVAILABLE" | "CLASSIFICATION_FAILED";
}
