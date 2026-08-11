import type {
	AuditReviewStatus,
	FindingCategory,
	FindingSeverity,
} from "@drenyra/application/features/judgment-day";
import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	createReview,
	createRule,
	deleteRule,
	getDashboard,
	getReview,
	listReviews,
	listRules,
	runReview,
	updateFindingStatus,
	updateRule,
} from "./controller";

export const judgmentDayRoutes = new Elysia({ prefix: "/api/v1/judgment" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get("/dashboard", async ({ query, set }) => {
		try {
			const companyId = query.companyId;
			if (!companyId || typeof companyId !== "string") {
				set.status = 400;
				return fail("companyId is required", "VALIDATION_ERROR");
			}
			const result = await getDashboard(companyId);
			return ok(result);
		} catch (error: unknown) {
			set.status = 500;
			return fail(getErrorMessage(error), "INTERNAL_ERROR");
		}
	})
	.post(
		"/reviews",
		async ({ body, set }) => {
			try {
				const review = await createReview({
					companyId: body.companyId,
					targetType: body.targetType as any,
					targetId: body.targetId,
					...(body.createdById !== undefined ? { createdById: body.createdById } : {}),
				});
				set.status = 201;
				return ok(review);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				targetType: t.String({ minLength: 1 }),
				targetId: t.String({ minLength: 1 }),
				createdById: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Judgment Day"],
				summary: "Create audit review",
				description:
					"Creates a new audit review case for a given target (journal entry, accounting PR, etc.)",
			},
		},
	)
	.get(
		"/reviews",
		async ({ query, set }) => {
			try {
				const companyId = query.companyId;
				if (!companyId || typeof companyId !== "string") {
					set.status = 400;
					return fail("companyId is required", "VALIDATION_ERROR");
				}
				const result = await listReviews({
					companyId,
					...(query.status !== undefined
						? { status: query.status as AuditReviewStatus }
						: {}),
					...(query.targetType !== undefined ? { targetType: query.targetType } : {}),
					...(query.limit ? { limit: Number(query.limit) } : {}),
					...(query.offset ? { offset: Number(query.offset) } : {}),
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Judgment Day"],
				summary: "List audit reviews",
				description:
					"Returns paginated audit reviews filtered by company, status, or target type",
			},
		},
	)
	.get(
		"/reviews/:id",
		async ({ params, set }) => {
			try {
				const review = await getReview(params.id);
				if (!review) {
					set.status = 404;
					return fail("Review not found", "NOT_FOUND");
				}
				return ok(review);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Judgment Day"],
				summary: "Get review detail",
				description: "Returns a single review with all its findings",
			},
		},
	)
	.post(
		"/reviews/:id/run",
		async ({ params, set }) => {
			try {
				const review = await runReview(params.id);
				if (!review) {
					set.status = 404;
					return fail("Review not found", "NOT_FOUND");
				}
				return ok(review);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Judgment Day"],
				summary: "Run audit review",
				description:
					"Executes the judgment agent on the review target, runs checks, and updates status",
			},
		},
	)
	.patch(
		"/findings/:id/acknowledge",
		async ({ params, set }) => {
			try {
				const finding = await updateFindingStatus(params.id, "ACKNOWLEDGED");
				if (!finding) {
					set.status = 404;
					return fail("Finding not found", "NOT_FOUND");
				}
				return ok(finding);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Judgment Day"],
				summary: "Acknowledge finding",
				description: "Marks a finding as acknowledged",
			},
		},
	)
	.patch(
		"/findings/:id/resolve",
		async ({ params, body, set }) => {
			try {
				const finding = await updateFindingStatus(
					params.id,
					"RESOLVED",
					body.resolvedById,
					body.resolutionComment,
				);
				if (!finding) {
					set.status = 404;
					return fail("Finding not found", "NOT_FOUND");
				}
				return ok(finding);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				resolvedById: t.Optional(t.String()),
				resolutionComment: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Judgment Day"],
				summary: "Resolve finding",
				description: "Marks a finding as resolved with an optional comment",
			},
		},
	)
	.patch(
		"/findings/:id/waive",
		async ({ params, body, set }) => {
			try {
				const finding = await updateFindingStatus(
					params.id,
					"WAIVED",
					body.resolvedById,
					body.resolutionComment,
				);
				if (!finding) {
					set.status = 404;
					return fail("Finding not found", "NOT_FOUND");
				}
				return ok(finding);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				resolvedById: t.Optional(t.String()),
				resolutionComment: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Judgment Day"],
				summary: "Waive finding",
				description: "Marks a finding as waived with a required justification",
			},
		},
	)
	.post(
		"/rules",
		async ({ body, set }) => {
			try {
				const rule = await createRule({
					companyId: body.companyId,
					name: body.name,
					category: body.category as FindingCategory,
					severity: body.severity as FindingSeverity,
					condition: body.condition as Record<string, unknown>,
					...(body.createdById !== undefined ? { createdById: body.createdById } : {}),
				});
				set.status = 201;
				return ok(rule);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				name: t.String({ minLength: 1 }),
				category: t.String({ minLength: 1 }),
				severity: t.String({ minLength: 1 }),
				condition: t.Any(),
				createdById: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Judgment Day"],
				summary: "Create audit rule",
				description: "Creates a custom audit rule for a company",
			},
		},
	)
	.get(
		"/rules",
		async ({ query, set }) => {
			try {
				const companyId = query.companyId;
				if (!companyId || typeof companyId !== "string") {
					set.status = 400;
					return fail("companyId is required", "VALIDATION_ERROR");
				}
				const rules = await listRules({
					companyId,
					...(query.category !== undefined ? { category: query.category } : {}),
					...(query.enabled !== undefined ? { enabled: query.enabled === "true" } : {}),
				});
				return ok(rules);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Judgment Day"],
				summary: "List audit rules",
				description:
					"Returns audit rules for a company, optionally filtered by category",
			},
		},
	)
	.patch(
		"/rules/:id",
		async ({ params, body, set }) => {
			try {
				const rule = await updateRule(params.id, {
					...(body.name !== undefined ? { name: body.name } : {}),
					...(body.category !== undefined
						? { category: body.category as FindingCategory }
						: {}),
					...(body.severity !== undefined
						? { severity: body.severity as FindingSeverity }
						: {}),
					...(body.condition !== undefined
						? { condition: body.condition as Record<string, unknown> }
						: {}),
					...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
				});
				if (!rule) {
					set.status = 404;
					return fail("Rule not found", "NOT_FOUND");
				}
				return ok(rule);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				name: t.Optional(t.String()),
				category: t.Optional(t.String()),
				severity: t.Optional(t.String()),
				condition: t.Optional(t.Any()),
				enabled: t.Optional(t.Boolean()),
			}),
			detail: {
				tags: ["Judgment Day"],
				summary: "Update audit rule",
				description: "Updates an existing audit rule",
			},
		},
	)
	.delete(
		"/rules/:id",
		async ({ params, set }) => {
			try {
				const deleted = await deleteRule(params.id);
				if (!deleted) {
					set.status = 404;
					return fail("Rule not found", "NOT_FOUND");
				}
				return ok({ deleted: true });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Judgment Day"],
				summary: "Delete audit rule",
				description: "Deletes an audit rule by ID",
			},
		},
	);
