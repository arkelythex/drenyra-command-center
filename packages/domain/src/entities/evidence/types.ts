export type EvidenceStatus =
	| "UPLOADED"
	| "EXTRACTING"
	| "CLASSIFIED"
	| "VALIDATED"
	| "REJECTED"
	| "ERROR";

export type EvidenceType =
	| "INVOICE"
	| "RECEIPT"
	| "CONTRACT"
	| "BANK_STATEMENT"
	| "EMAIL"
	| "OTHER";

export type EvidenceSource = "UPLOAD" | "EMAIL" | "API" | "SYNC";

export interface HashChainEntry {
	hash: string;
	prevHash: string | null;
	timestamp: string;
}

export interface EvidenceProps {
	id: string;
	organizationId: string;
	companyId?: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	hashChain?: HashChainEntry;
	evidenceType: EvidenceType;
	source: EvidenceSource;
	status: EvidenceStatus;
	metadata?: Record<string, unknown>;
	extractedData?: Record<string, unknown>;
	classifierResult?: Record<string, unknown>;
	validatedAt?: Date;
	validatedBy?: string;
	errorMessage?: string;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface EvidenceAuditTrailEntry {
	id: string;
	evidenceId: string;
	action: string;
	previousStatus: EvidenceStatus;
	newStatus: EvidenceStatus;
	hash: string;
	hashChain: HashChainEntry;
	actor: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

export interface EvidencePrimitiveData {
	id: string;
	organizationId: string;
	companyId?: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	hashChain?: HashChainEntry;
	evidenceType: string;
	source: string;
	status: string;
	metadata?: Record<string, unknown>;
	extractedData?: Record<string, unknown>;
	classifierResult?: Record<string, unknown>;
	validatedAt?: string | Date;
	validatedBy?: string;
	errorMessage?: string;
	tags?: string[];
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

export interface EvidenceFilters {
	status?: EvidenceStatus;
	evidenceType?: EvidenceType;
	source?: EvidenceSource;
	organizationId?: string;
	companyId?: string;
	dateFrom?: Date;
	dateTo?: Date;
	limit?: number;
	offset?: number;
}
