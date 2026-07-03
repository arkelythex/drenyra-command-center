/**
 * Reconciliation Learning Port — storage for match history and patterns.
 */

export interface MatchHistoryRecord {
	bankTransactionId: string;
	bankDescription: string;
	bankAmount: string;
	bankDate: Date;
	matchedDocumentId: string;
	matchedDocumentType: "INVOICE" | "BILL";
	matchCriteria: string;
	matchScore: number;
	userApproved: boolean | null;
	userCorrectedDocumentId?: string;
	userCorrectedAt?: Date;
	createdAt: Date;
}

export interface VendorPattern {
	vendorName: string;
	vendorId: string;
	descriptionPatterns: string[];
	matchCount: number;
	approvalRate: number;
	lastMatchedAt: Date;
}

export interface LearningMatchResult {
	documentId: string;
	documentType: "INVOICE" | "BILL";
	score: number;
	source: "LEARNED_PATTERN" | "STRATEGY_CHAIN";
	confidence: number;
	autoApprovable: boolean;
}
