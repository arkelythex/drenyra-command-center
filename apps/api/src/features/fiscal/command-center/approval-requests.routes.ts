import { Elysia } from "elysia";
import { fail, ok } from "../../shared/api-response";
import { resolveFiscalCmdContext } from "./context";
import {
	type CreateApprovalRequestInput,
	CreateApprovalRequestSchema,
	type SubmitVoteInput,
	SubmitVoteSchema,
} from "./schemas";
import { approvalRequestService } from "./services/approval-requests.service";

type ApprovalRequestService = typeof approvalRequestService;

/**
 * createApprovalRequestsRoutes operation.
 *
 * @param service - Input for service.
 * @returns Result of createApprovalRequestsRoutes.
 * @example
 * ```ts
 * const result = createApprovalRequestsRoutes({} as ApprovalRequestService);
 * console.log(result);
 * ```
 */
export function createApprovalRequestsRoutes(
	service: ApprovalRequestService = approvalRequestService,
) {
	return new Elysia({ prefix: "/approvals" })
		.get(
			"/",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.list(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const request = await service.getById(params.id, resolved.context);
				if (!request) {
					set.status = 404;
					return fail("Approval request not found", "NOT_FOUND");
				}
				return ok(request);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.post(
			"/",
			async ({ headers, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(
					await service.create(
						body as CreateApprovalRequestInput,
						resolved.context,
					),
				);
			},
			{
				body: CreateApprovalRequestSchema,
				detail: { tags: ["Fiscal Command Center"] },
			},
		)
		.get(
			"/:id/diffs",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const diffs = await service.getDiffs(params.id, resolved.context);
				if (!diffs) {
					set.status = 404;
					return fail("Approval request not found", "NOT_FOUND");
				}
				return ok(diffs);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id/votes",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const votes = await service.getVotes(params.id, resolved.context);
				if (!votes) {
					set.status = 404;
					return fail("Approval request not found", "NOT_FOUND");
				}
				return ok(votes);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.post(
			"/:id/votes",
			async ({ headers, params, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const vote = await service.submitVote(
					params.id,
					body as SubmitVoteInput,
					resolved.context,
				);
				if (!vote) {
					set.status = 404;
					return fail("Approval request not found", "NOT_FOUND");
				}
				return ok(vote);
			},
			{ body: SubmitVoteSchema, detail: { tags: ["Fiscal Command Center"] } },
		);
}

/**
 * approvalRequestsRoutes const.
 *
 * @example
 * ```ts
 * console.log(approvalRequestsRoutes);
 * ```
 */
export const approvalRequestsRoutes = createApprovalRequestsRoutes();
