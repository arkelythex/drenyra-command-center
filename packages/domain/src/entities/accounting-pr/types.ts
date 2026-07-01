export type AccountingPrStatus =
	| "DRAFT"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "POSTED";

export interface PrSignature {
	signerId: string;
	signedAt: string;
	comment?: string;
}

export interface AccountingPrProps {
	id: string;
	companyId: string;
	prNumber: number;
	title: string;
	description?: string;
	status: AccountingPrStatus;
	entries: string[];
	evidenceIds: string[];
	totalDebitCents: number;
	totalCreditCents: number;
	reviewerId?: string;
	reviewedAt?: Date;
	reviewComment?: string;
	approveSignerIds: string[];
	approveSignatures: PrSignature[];
	createdById?: string;
	createdAt: Date;
	updatedAt: Date;
}
