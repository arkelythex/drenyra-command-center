import type {
	EvidenceSource,
	EvidenceStatus,
	EvidenceType,
} from "@drenyra/domain";

export interface EvidenceListQuery {
	organizationId: string;
	status?: EvidenceStatus;
	evidenceType?: EvidenceType;
	source?: EvidenceSource;
	dateFrom?: string;
	dateTo?: string;
	limit?: number;
	offset?: number;
}

export interface UploadEvidenceBody {
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

export interface ClassifyEvidenceBody {
	evidenceType: EvidenceType;
	classification: Record<string, unknown>;
}
