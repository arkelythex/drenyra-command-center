export type AuditReviewStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "PASSED"
	| "FAILED"
	| "NEEDS_REVIEW";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type FindingCategory =
	| "COMPLIANCE"
	| "DUPLICATE"
	| "AMOUNT_MISMATCH"
	| "MISSING_EVIDENCE"
	| "TIMING"
	| "CLASSIFICATION";

export type FindingStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "WAIVED";

export type AuditTargetType =
	| "journal_entry"
	| "accounting_pr"
	| "close_checklist"
	| "evidence";

export interface AuditReviewProps {
	id: string;
	companyId: string;
	targetType: AuditTargetType;
	targetId: string;
	status: AuditReviewStatus;
	riskScore: number;
	startedAt?: Date;
	completedAt?: Date;
	reviewedById?: string;
	notes?: string;
	createdById?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuditFindingProps {
	id: string;
	reviewId: string;
	severity: FindingSeverity;
	category: FindingCategory;
	description: string;
	details: Record<string, unknown>;
	ruleId?: string;
	automated: boolean;
	status: FindingStatus;
	resolvedById?: string;
	resolvedAt?: Date;
	resolutionComment?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuditRuleProps {
	id: string;
	companyId: string;
	name: string;
	category: FindingCategory;
	severity: FindingSeverity;
	condition: Record<string, unknown>;
	enabled: boolean;
	createdById?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuditFinding {
	id: string;
	reviewId: string;
	severity: FindingSeverity;
	category: FindingCategory;
	description: string;
	details: Record<string, unknown>;
	ruleId?: string;
	automated: boolean;
	status: FindingStatus;
	resolvedById?: string;
	resolvedAt?: string | null;
	resolutionComment?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AuditReview {
	id: string;
	companyId: string;
	targetType: AuditTargetType;
	targetId: string;
	status: AuditReviewStatus;
	riskScore: number;
	startedAt: string | null;
	completedAt: string | null;
	reviewedById: string | null;
	notes: string | null;
	createdById: string | null;
	findings: AuditFinding[];
	createdAt: string;
	updatedAt: string;
}

export interface AuditRule {
	id: string;
	companyId: string;
	name: string;
	category: FindingCategory;
	severity: FindingSeverity;
	condition: Record<string, unknown>;
	enabled: boolean;
	createdById?: string;
	createdAt: string;
	updatedAt: string;
}

export interface JudgmentDayDashboard {
	totalReviews: number;
	passRate: number;
	failRate: number;
	needsReviewRate: number;
	openFindingsBySeverity: Record<FindingSeverity, number>;
	recentReviews: AuditReview[];
}

export interface RiskScoreInput {
	debitCents: number;
	creditCents: number;
	hasEvidence: boolean;
	periodLocked: boolean;
	duplicateEntries: number;
	amountMismatch: boolean;
}

export interface JudgmentDayResult {
	reviewId: string;
	status: AuditReviewStatus;
	riskScore: number;
	findings: AuditFinding[];
	execution: {
		durationMs: number;
		checksRun: number;
	};
}
