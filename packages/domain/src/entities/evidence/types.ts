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
	companyId?: string | undefined;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	hashChain?: HashChainEntry | undefined;
	evidenceType: string;
	source: string;
	status: string;
	metadata?: Record<string, unknown> | undefined;
	extractedData?: Record<string, unknown> | undefined;
	classifierResult?: Record<string, unknown> | undefined;
	validatedAt?: string | Date | undefined;
	validatedBy?: string | undefined;
	errorMessage?: string | undefined;
	tags?: string[] | undefined;
	createdAt?: string | Date | undefined;
	updatedAt?: string | Date | undefined;
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
