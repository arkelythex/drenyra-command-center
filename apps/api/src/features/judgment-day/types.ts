/**
 * Judgment Day — API types.
 *
 * Re-exported from canonical @drenyra/application/features/judgment-day.
 *
 * @module features/judgment-day/types
 */

import type {
	AuditFindingDTO,
	AuditReviewDTO,
	AuditRuleDTO,
	CreateReviewRequest,
	CreateRuleRequest,
	JudgmentDayDashboardDTO,
	ListReviewsQuery as AppListReviewsQuery,
	ListRulesQuery as AppListRulesQuery,
	PaginatedReviews as AppPaginatedReviews,
	UpdateRuleRequest,
} from "@drenyra/application/features/judgment-day";

export type CreateReviewInput = CreateReviewRequest;
export type CreateRuleInput = CreateRuleRequest;
export type UpdateRuleInput = UpdateRuleRequest;
export type ListReviewsQuery = AppListReviewsQuery;
export type ListRulesQuery = AppListRulesQuery;
export type PaginatedReviews = AppPaginatedReviews;
export type AuditReview = AuditReviewDTO;
export type AuditFinding = AuditFindingDTO;
export type AuditRule = AuditRuleDTO;
export type JudgmentDayDashboard = JudgmentDayDashboardDTO;
