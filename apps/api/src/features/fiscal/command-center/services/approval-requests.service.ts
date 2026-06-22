import type { CreateApprovalRequestInput, SubmitVoteInput } from "../schemas";
import type {
	ApprovalDiffRecord,
	ApprovalRequestRecord,
	ApprovalVoteRecord,
	FiscalCommandCenterContext,
} from "../types";

function sameRequestScope(
	row: Pick<
		ApprovalRequestRecord,
		"organizationId" | "companyId" | "companyRuc" | "period"
	>,
	ctx: FiscalCommandCenterContext,
): boolean {
	return (
		row.organizationId === ctx.organizationId &&
		row.companyId === ctx.companyId &&
		row.companyRuc === ctx.companyRuc &&
		row.period === ctx.period
	);
}

function byCreatedDesc(a: { createdAt: Date }, b: { createdAt: Date }): number {
	return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * createApprovalRequestService operation.
 *
 * @param seed - Input for seed.
 * @returns Result of createApprovalRequestService.
 * @example
 * ```ts
 * const result = createApprovalRequestService({});
 * console.log(result);
 * ```
 */
export function createApprovalRequestService(
	seed: {
		requests?: ApprovalRequestRecord[];
		diffs?: ApprovalDiffRecord[];
		votes?: ApprovalVoteRecord[];
	} = {},
) {
	const requests = [...(seed.requests ?? [])];
	const diffs = [...(seed.diffs ?? [])];
	const votes = [...(seed.votes ?? [])];

	async function getById(id: string, ctx: FiscalCommandCenterContext) {
		return (
			requests.find(
				(request) => request.id === id && sameRequestScope(request, ctx),
			) ?? null
		);
	}

	return {
		async list(ctx: FiscalCommandCenterContext) {
			return requests
				.filter((request) => sameRequestScope(request, ctx))
				.sort(byCreatedDesc);
		},

		getById,

		async create(
			input: CreateApprovalRequestInput,
			ctx: FiscalCommandCenterContext,
		) {
			const now = new Date();
			const created: ApprovalRequestRecord = {
				id: crypto.randomUUID(),
				caseId: input.caseId ?? null,
				organizationId: ctx.organizationId,
				companyId: ctx.companyId,
				companyRuc: ctx.companyRuc,
				period: ctx.period,
				requestType: input.requestType,
				status: "pending",
				priority: input.priority ?? "medium",
				title: input.title,
				description: input.description ?? null,
				requestedBy: ctx.userId,
				metadata: input.metadata ?? {},
				createdAt: now,
				updatedAt: now,
			};
			requests.push(created);
			return created;
		},

		async getDiffs(requestId: string, ctx: FiscalCommandCenterContext) {
			const request = await getById(requestId, ctx);
			if (!request) return null;
			return diffs
				.filter(
					(diff) =>
						diff.requestId === requestId && diff.companyId === ctx.companyId,
				)
				.sort(byCreatedDesc);
		},

		async getVotes(requestId: string, ctx: FiscalCommandCenterContext) {
			const request = await getById(requestId, ctx);
			if (!request) return null;
			return votes
				.filter(
					(vote) =>
						vote.requestId === requestId && vote.companyId === ctx.companyId,
				)
				.sort(byCreatedDesc);
		},

		async submitVote(
			requestId: string,
			input: SubmitVoteInput,
			ctx: FiscalCommandCenterContext,
		) {
			const request = await getById(requestId, ctx);
			if (!request) return null;
			const created: ApprovalVoteRecord = {
				id: crypto.randomUUID(),
				requestId,
				companyId: ctx.companyId,
				userId: ctx.userId,
				vote: input.vote,
				comment: input.comment ?? null,
				createdAt: new Date(),
			};
			votes.push(created);
			return created;
		},
	};
}

/**
 * approvalRequestService const.
 *
 * @example
 * ```ts
 * console.log(approvalRequestService);
 * ```
 */
export const approvalRequestService = createApprovalRequestService();
