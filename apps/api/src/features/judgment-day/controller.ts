import { runJudgeAgent } from "@arkelythex/ai/agents/judgment-day";
import { db } from "@arkelythex/persistence";
import {
	auditFindings,
	auditReviews,
	auditRules,
} from "@arkelythex/persistence/schema";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import type {
	AuditFinding,
	AuditReview,
	AuditRule,
	CreateReviewInput,
	CreateRuleInput,
	JudgmentDayDashboard,
	ListReviewsQuery,
	ListRulesQuery,
	UpdateRuleInput,
} from "./types";

function toAuditReview(
	row: typeof auditReviews.$inferSelect,
	findings: AuditFinding[] = [],
): AuditReview {
	return {
		id: row.id,
		companyId: row.companyId,
		targetType: row.targetType,
		targetId: row.targetId,
		status: row.status as AuditReview["status"],
		riskScore: row.riskScore,
		startedAt: row.startedAt?.toISOString() ?? null,
		completedAt: row.completedAt?.toISOString() ?? null,
		reviewedById: row.reviewedById ?? null,
		notes: row.notes ?? null,
		createdById: row.createdById ?? null,
		findings,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function toAuditFinding(row: typeof auditFindings.$inferSelect): AuditFinding {
	return {
		id: row.id,
		reviewId: row.reviewId,
		severity: row.severity as AuditFinding["severity"],
		category: row.category as AuditFinding["category"],
		description: row.description,
		details: (row.details ?? {}) as Record<string, unknown>,
		ruleId: row.ruleId ?? null,
		automated: row.automated === 1,
		status: row.status as AuditFinding["status"],
		resolvedById: row.resolvedById ?? null,
		resolvedAt: row.resolvedAt?.toISOString() ?? null,
		resolutionComment: row.resolutionComment ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function toAuditRule(row: typeof auditRules.$inferSelect): AuditRule {
	return {
		id: row.id,
		companyId: row.companyId,
		name: row.name,
		category: row.category as AuditRule["category"],
		severity: row.severity as AuditRule["severity"],
		condition: (row.condition ?? {}) as Record<string, unknown>,
		enabled: row.enabled === 1,
		createdById: row.createdById ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export async function createReview(
	input: CreateReviewInput,
): Promise<AuditReview> {
	const [row] = await db
		.insert(auditReviews)
		.values({
			companyId: input.companyId,
			targetType: input.targetType,
			targetId: input.targetId,
			status: "PENDING",
			createdById: input.createdById,
		})
		.returning();

	return toAuditReview(row);
}

export async function listReviews(query: ListReviewsQuery): Promise<{
	reviews: AuditReview[];
	total: number;
}> {
	const conditions = [eq(auditReviews.companyId, query.companyId)];
	if (query.status) conditions.push(eq(auditReviews.status, query.status));
	if (query.targetType)
		conditions.push(eq(auditReviews.targetType, query.targetType));

	const limit = query.limit ?? 20;
	const offset = query.offset ?? 0;

	const [totalResult] = await db
		.select({ total: count() })
		.from(auditReviews)
		.where(and(...conditions));

	const rows = await db
		.select()
		.from(auditReviews)
		.where(and(...conditions))
		.orderBy(desc(auditReviews.createdAt))
		.limit(limit)
		.offset(offset);

	const reviewIds = rows.map((r) => r.id);
	const findingsMap = new Map<string, AuditFinding[]>();

	if (reviewIds.length > 0) {
		const findingsRows = await db
			.select()
			.from(auditFindings)
			.where(inArray(auditFindings.reviewId, reviewIds));

		for (const f of findingsRows) {
			const list = findingsMap.get(f.reviewId) ?? [];
			list.push(toAuditFinding(f));
			findingsMap.set(f.reviewId, list);
		}
	}

	const reviews = rows.map((r) =>
		toAuditReview(r, findingsMap.get(r.id) ?? []),
	);

	return { reviews, total: totalResult?.total ?? 0 };
}

export async function getReview(id: string): Promise<AuditReview | null> {
	const [row] = await db
		.select()
		.from(auditReviews)
		.where(eq(auditReviews.id, id))
		.limit(1);

	if (!row) return null;

	const findingsRows = await db
		.select()
		.from(auditFindings)
		.where(eq(auditFindings.reviewId, id));

	return toAuditReview(row, findingsRows.map(toAuditFinding));
}

export async function runReview(id: string): Promise<AuditReview | null> {
	const [row] = await db
		.select()
		.from(auditReviews)
		.where(eq(auditReviews.id, id))
		.limit(1);

	if (!row) return null;

	await db
		.update(auditReviews)
		.set({ status: "IN_PROGRESS", startedAt: new Date() })
		.where(eq(auditReviews.id, id));

	const result = runJudgeAgent({
		companyId: row.companyId,
		targetType: row.targetType,
		targetId: row.targetId,
		debitCents: 0,
		creditCents: 0,
	});

	if (result.findings.length > 0) {
		await db.insert(auditFindings).values(
			result.findings.map((f) => ({
				reviewId: id,
				severity: f.severity,
				category: f.category,
				description: f.description,
				details: f.details,
				ruleId: f.ruleId,
				automated: f.automated ? 1 : 0,
			})),
		);
	}

	await db
		.update(auditReviews)
		.set({
			status: result.status as (typeof auditReviews.$inferSelect)["status"],
			riskScore: result.riskScore,
			completedAt: new Date(),
		})
		.where(eq(auditReviews.id, id));

	return getReview(id);
}

export async function updateFindingStatus(
	id: string,
	status: AuditFinding["status"],
	resolvedById?: string,
	resolutionComment?: string,
): Promise<AuditFinding | null> {
	const now = new Date();
	const shouldSetResolved = status === "RESOLVED" || status === "WAIVED";

	const [row] = await db
		.update(auditFindings)
		.set({
			status,
			resolvedById: resolvedById ?? null,
			resolvedAt: shouldSetResolved ? now : undefined,
			resolutionComment: resolutionComment ?? null,
			updatedAt: now,
		})
		.where(eq(auditFindings.id, id))
		.returning();

	if (!row) return null;
	return toAuditFinding(row);
}

export async function getDashboard(
	companyId: string,
): Promise<JudgmentDayDashboard> {
	const [totalResult] = await db
		.select({ total: count() })
		.from(auditReviews)
		.where(eq(auditReviews.companyId, companyId));

	const totalReviews = totalResult?.total ?? 0;

	const statusCounts = await db
		.select({
			status: auditReviews.status,
			count: count(),
		})
		.from(auditReviews)
		.where(eq(auditReviews.companyId, companyId))
		.groupBy(auditReviews.status);

	const statusMap = new Map(statusCounts.map((s) => [s.status, s.count]));
	const passed = statusMap.get("PASSED") ?? 0;
	const failed = statusMap.get("FAILED") ?? 0;
	const needsReview = statusMap.get("NEEDS_REVIEW") ?? 0;

	const severityCounts = await db
		.select({
			severity: auditFindings.severity,
			count: count(),
		})
		.from(auditFindings)
		.innerJoin(auditReviews, eq(auditFindings.reviewId, auditReviews.id))
		.where(
			and(
				eq(auditReviews.companyId, companyId),
				eq(auditFindings.status, "OPEN"),
			),
		)
		.groupBy(auditFindings.severity);

	const openFindingsBySeverity: Record<string, number> = {
		CRITICAL: 0,
		HIGH: 0,
		MEDIUM: 0,
		LOW: 0,
		INFO: 0,
	};
	for (const sc of severityCounts) {
		if (sc.severity in openFindingsBySeverity) {
			openFindingsBySeverity[sc.severity] = sc.count;
		}
	}

	const recentRows = await db
		.select()
		.from(auditReviews)
		.where(eq(auditReviews.companyId, companyId))
		.orderBy(desc(auditReviews.createdAt))
		.limit(10);

	return {
		totalReviews,
		passRate: totalReviews > 0 ? passed / totalReviews : 0,
		failRate: totalReviews > 0 ? failed / totalReviews : 0,
		needsReviewRate: totalReviews > 0 ? needsReview / totalReviews : 0,
		openFindingsBySeverity:
			openFindingsBySeverity as JudgmentDayDashboard["openFindingsBySeverity"],
		recentReviews: recentRows.map((r) => toAuditReview(r)),
	};
}

export async function createRule(input: CreateRuleInput): Promise<AuditRule> {
	const [row] = await db
		.insert(auditRules)
		.values({
			companyId: input.companyId,
			name: input.name,
			category: input.category,
			severity: input.severity,
			condition: input.condition,
			createdById: input.createdById,
		})
		.returning();

	return toAuditRule(row);
}

export async function listRules(query: ListRulesQuery): Promise<AuditRule[]> {
	const conditions = [eq(auditRules.companyId, query.companyId)];
	if (query.category)
		conditions.push(eq(auditRules.category, query.category as any));
	if (query.enabled !== undefined)
		conditions.push(eq(auditRules.enabled, query.enabled ? 1 : 0));

	const rows = await db
		.select()
		.from(auditRules)
		.where(and(...conditions))
		.orderBy(desc(auditRules.createdAt));

	return rows.map(toAuditRule);
}

export async function updateRule(
	id: string,
	input: UpdateRuleInput,
): Promise<AuditRule | null> {
	const values: Record<string, unknown> = { updatedAt: new Date() };
	if (input.name !== undefined) values.name = input.name;
	if (input.category !== undefined) values.category = input.category;
	if (input.severity !== undefined) values.severity = input.severity;
	if (input.condition !== undefined) values.condition = input.condition;
	if (input.enabled !== undefined) values.enabled = input.enabled ? 1 : 0;

	const [row] = await db
		.update(auditRules)
		.set(values)
		.where(eq(auditRules.id, id))
		.returning();

	if (!row) return null;
	return toAuditRule(row);
}

export async function deleteRule(id: string): Promise<boolean> {
	const result = await db
		.delete(auditRules)
		.where(eq(auditRules.id, id))
		.returning({ id: auditRules.id });

	return result.length > 0;
}
