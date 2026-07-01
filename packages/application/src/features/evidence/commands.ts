import type { EvidenceSource, EvidenceType } from "@arkelythex/domain";

export interface RegisterEvidenceCommand {
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

export interface VerifyEvidenceCommand {
	evidenceId: string;
	validatedBy: string;
	organizationId: number;
}

export interface UpdateClassificationCommand {
	evidenceId: string;
	classification: Record<string, unknown>;
	organizationId: number;
}
