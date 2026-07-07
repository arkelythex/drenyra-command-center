import type { AgentContext,
	ApprovalRequest, } from "@drenyra/pi";
import { Elysia, t } from "elysia";
import { fail } from "../shared/api-response";
import {
	approvalMatchesContext,
	approvalNotFound,
	readReviewerRole,
} from "./approval-http";
import {
	drenyraContextFailure,
	resolveAgentContextFromHeaders,
} from "./drenyra-context";

export interface ApprovalGateRoutesDeps {
	approvalGate: {
		approve(
			approvalId: string,
			reviewerId: string,
			reviewerRole: string,
		): Promise<
			| { ok: true; data: ApprovalRequest }
			| { ok: false; error: string; code?: string; details?: unknown }
		>;
		reject(
			approvalId: string,
			reviewerId: string,
			rationale?: string,
		): Promise<
			| { ok: true; data: ApprovalRequest }
			| { ok: false; error: string; code?: string; details?: unknown }
		>;
	};
	approvalStore: {
		get(id: string): ApprovalRequest | undefined;
		listByContext(context: AgentContext): ApprovalRequest[];
	};
}

export function createApprovalGateRoutes({
	approvalGate,
	approvalStore,
}: ApprovalGateRoutesDeps) {
	return new Elysia({ name: "drenyra-approval-gate" })
		.get(
			"/approvals",
			async ({ headers, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraContextFailure(contextResolution);
				}

				const allApprovals = approvalStore.listByContext(
					contextResolution.context,
				);
				return {
					ok: true,
					approvals: allApprovals
						.sort((a, b) => b.proposedAt.getTime() - a.proposedAt.getTime())
						.map((a) => ({
							id: a.id,
							toolName: a.toolName,
							summary:
								a.governanceResult?.reasons?.join(", ") ||
								`Execute ${a.toolName}`,
							module: a.toolName.split("_")[0] || a.toolName,
							approvalLevel: a.approvalLevel,
							state: a.state,
							proposedAt: a.proposedAt.toISOString(),
							decidedAt: a.decidedAt?.toISOString(),
							companyId: a.context.companyId,
							ruc: a.context.ruc,
							reviewerId: a.reviewerId,
							rationale: a.rationale,
							reviewerRole: a.reviewerRole,
						})),
				};
			},
			{ query: t.Optional(t.Object({ companyId: t.Optional(t.String()) })) },
		)
		.post(
			"/approve",
			async ({ body, headers, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraContextFailure(contextResolution);
				}

				const reviewerRole = readReviewerRole(headers);
				if (!reviewerRole) {
					set.status = 400;
					return fail(
						"Drenyra approval decisions require x-user-role",
						"TENANT_CONTEXT_REQUIRED",
						{ details: { missingHeaders: ["x-user-role"] } },
					);
				}

				const approval = approvalStore.get(body.approvalId);
				if (
					!approval ||
					!approvalMatchesContext(approval, contextResolution.context)
				) {
					set.status = 404;
					return approvalNotFound();
				}

				return approvalGate.approve(
					body.approvalId,
					contextResolution.context.userId,
					reviewerRole,
				);
			},
			{
				body: t.Object({
					approvalId: t.String(),
					reviewerId: t.String(),
					role: t.String(),
				}),
			},
		)
		.post(
			"/reject",
			async ({ body, headers, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraContextFailure(contextResolution);
				}

				const approval = approvalStore.get(body.approvalId);
				if (
					!approval ||
					!approvalMatchesContext(approval, contextResolution.context)
				) {
					set.status = 404;
					return approvalNotFound();
				}

				return approvalGate.reject(
					body.approvalId,
					contextResolution.context.userId,
					body.rationale,
				);
			},
			{
				body: t.Object({
					approvalId: t.String(),
					reviewerId: t.String(),
					rationale: t.Optional(t.String()),
				}),
			},
		);
}
