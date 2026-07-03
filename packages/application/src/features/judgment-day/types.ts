/**
 * Judgment Day — DTO types for frontend consumption.
 *
 * @module application/features/judgment-day
 */

// ─── Domain Enums (mirrored from @arkelythex/domain/entities) ────

export type AuditReviewStatus = string;
export type AuditTargetType = string;
export type FindingCategory = string;
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type FindingStatus = string;

// ─── DTOs ───────────────────────────────────────────────────────

export interface CreateReviewRequest {
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
	reviews: AuditReviewDTO[];
	total: number;
}

export interface AuditReviewDTO {
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
	findings: AuditFindingDTO[];
	createdAt: string;
	updatedAt: string;
}

export interface AuditFindingDTO {
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

export interface AuditRuleDTO {
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

export interface CreateRuleRequest {
	companyId: string;
	name: string;
	category: FindingCategory;
	severity: FindingSeverity;
	condition: Record<string, unknown>;
	createdById?: string;
}

export interface UpdateRuleRequest {
	name?: string;
	category?: FindingCategory;
	severity?: FindingSeverity;
	condition?: Record<string, unknown>;
	enabled?: boolean;
}

export interface ListRulesQuery {
	companyId: string;
	category?: string;
	enabled?: boolean;
}

export interface JudgmentDayDashboard {
	totalReviews: number;
	passRate: number;
	failRate: number;
	needsReviewRate: number;
	openFindingsBySeverity: Record<FindingSeverity, number>;
	recentReviews: AuditReviewDTO[];
}
