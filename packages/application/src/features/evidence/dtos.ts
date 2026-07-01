import type {
	EvidenceSource,
	EvidenceStatus,
	EvidenceType,
} from "@arkelythex/domain";

export interface EvidenceDTO {
	id: string;
	organizationId: string;
	companyId?: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	evidenceType: EvidenceType;
	source: EvidenceSource;
	status: EvidenceStatus;
	metadata?: Record<string, unknown>;
	extractedData?: Record<string, unknown>;
	classifierResult?: Record<string, unknown>;
	validatedAt?: string;
	validatedBy?: string;
	errorMessage?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface EvidenceListResponse {
	items: EvidenceDTO[];
	total: number;
}

export interface UploadEvidenceRequest {
	organizationId: string;
	companyId?: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	evidenceType: EvidenceType;
	source: EvidenceSource;
	metadata?: Record<string, unknown>;
	tags?: string[];
}

export interface VerifyEvidenceRequest {
	evidenceId: string;
	validatedBy: string;
}
