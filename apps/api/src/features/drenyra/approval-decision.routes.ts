/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type { DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import { commandCenterError } from "./drenyra-command-center-http";
import {
	drenyraActorContextFailure,
	resolveDrenyraActorContext,
} from "./drenyra-context";

export interface ApprovalDecisionRoutesDeps {
	commandCenter: DrenyraFiscalCommandCenterService;
}

function statusForApprovalDecisionError(error: unknown): 404 | 409 {
	return error instanceof Error && error.message === "APPROVAL_ALREADY_DECIDED"
		? 409
		: 404;
}

export function createApprovalDecisionRoutes({
	commandCenter,
}: ApprovalDecisionRoutesDeps) {
	return new Elysia({ name: "drenyra-approval-decisions" })
		.post(
			"/approvals/:id/approve",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					return ok(
						await commandCenter.approveApprovalRequest(
							contextResolution.context,
							params.id,
							body,
						),
					);
				} catch (error) {
					set.status = statusForApprovalDecisionError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({ decisionReason: t.Optional(t.String()) }),
				detail: {
					tags: ["Drenyra"],
					summary: "Approve Drenyra approval request",
				},
			},
		)
		.post(
			"/approvals/:id/reject",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					return ok(
						await commandCenter.rejectApprovalRequest(
							contextResolution.context,
							params.id,
							body,
						),
					);
				} catch (error) {
					set.status = statusForApprovalDecisionError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({ decisionReason: t.Optional(t.String()) }),
				detail: { tags: ["Drenyra"], summary: "Reject Drenyra approval request" },
			},
		);
}
