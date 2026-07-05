import { Elysia } from "elysia";
import { AppError } from "../../lib/errors";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	BatchApproveBody,
	DiffParams,
	ListDiffsQuery,
	ListQueueQuery,
	RejectBody,
	RequestInfoBody,
} from "./diffs.schemas";
import { diffsService } from "./diffs.service";

// Elysia's set type is complex; this helper casts it for our use
function s(set: { status?: number | string }): { status: number } {
	return set as unknown as { status: number };
}

function handleError(error: unknown, set: { status: number }) {
	if (error instanceof AppError) {
		set.status = error.statusCode;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

function assertCompanyId(
	companyContext: { companyId: string } | undefined | null,
	set: { status: number },
): string | null {
	const companyId = companyContext?.companyId;
	if (!companyId) {
		set.status = 401;
		fail("No autorizado", "UNAUTHORIZED");
		return null;
	}
	return companyId;
}

export const diffsRoutes = new Elysia({ prefix: "/api/diffs", name: "diffs" })
	.use(companyScopeGuard())

	.get(
		"/",
		async ({ query, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.listDiffs(companyId, {
					status: query.status,
					type: query.type,
					priority: query.priority,
				});
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			query: ListDiffsQuery,
			detail: { tags: ["Diffs"], summary: "List accounting diffs" },
		},
	)

	.get(
		"/:id",
		async ({ params, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.getDiff(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: DiffParams,
			detail: { tags: ["Diffs"], summary: "Get diff detail" },
		},
	)

	.post(
		"/:id/approve",
		async ({ params, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.approveDiff(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: DiffParams,
			detail: { tags: ["Diffs"], summary: "Approve diff" },
		},
	)

	.post(
		"/:id/reject",
		async ({ params, body, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.rejectDiff(
					companyId,
					params.id,
					body.reason,
				);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: DiffParams,
			body: RejectBody,
			detail: { tags: ["Diffs"], summary: "Reject diff" },
		},
	)

	.post(
		"/:id/request-info",
		async ({ params, body, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.requestInfo(
					companyId,
					params.id,
					body.question,
				);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: DiffParams,
			body: RequestInfoBody,
			detail: { tags: ["Diffs"], summary: "Request info on diff" },
		},
	);

export const reviewQueueRoutes = new Elysia({
	prefix: "/api/review-queue",
	name: "review-queue",
})
	.use(companyScopeGuard())

	.get(
		"/",
		async ({ query, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.listQueue(
					companyId,
					query as Record<string, string>,
				);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			query: ListQueueQuery,
			detail: { tags: ["Review Queue"], summary: "List review queue" },
		},
	)

	.get(
		"/stats",
		async ({ set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.getQueueStats(companyId);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{ detail: { tags: ["Review Queue"], summary: "Get queue stats" } },
	)

	.post(
		"/batch-approve",
		async ({ body, set, companyContext }) => {
			try {
				const ms = s(set);
				const companyId = assertCompanyId(companyContext, ms);
				if (!companyId) return;
				const result = diffsService.batchApprove(companyId, body.ids);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: BatchApproveBody,
			detail: { tags: ["Review Queue"], summary: "Batch approve diffs" },
		},
	);
