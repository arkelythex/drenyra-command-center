import type {
	AuditReviewStatus,
	AuditTargetType,
	FindingCategory,
	FindingSeverity,
	FindingStatus,
} from "@drenyra/domain/entities";

export interface CreateReviewInput {
	companyId: string;
	targetType: AuditTargetType;
	targetId: string;
	createdById?: string;
}

export interface ListReviewsQuery {
	companyId: string;
	status?: AuditReviewStatus;
	targetType?: string;
	limit?: number;
	offset?: number;
}

export interface PaginatedReviews {
	reviews: AuditReview[];
	total: number;
}

export interface ListRulesQuery {
	companyId: string;
	category?: string;
	enabled?: boolean;
}

export interface CreateRuleInput {
	companyId: string;
	name: string;
	category: FindingCategory;
	severity: FindingSeverity;
	condition: Record<string, unknown>;
	createdById?: string;
}

export interface UpdateRuleInput {
	name?: string;
	category?: FindingCategory;
	severity?: FindingSeverity;
	condition?: Record<string, unknown>;
	enabled?: boolean;
}

export interface AuditReview {
	id: string;
	companyId: string;
	targetType: string;
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

export interface AuditFinding {
	id: string;
	reviewId: string;
	severity: FindingSeverity;
	category: FindingCategory;
	description: string;
	details: Record<string, unknown>;
	ruleId: string | null;
	automated: boolean;
	status: FindingStatus;
	resolvedById: string | null;
	resolvedAt: string | null;
	resolutionComment: string | null;
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
	createdById: string | null;
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
