import type { DrenyraFiscalConsoleService } from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import {
	consoleError,
	drenyraActorContextFailure,
	type ResolveDrenyraActorContext,
	statusForApprovalDecisionError,
} from "./console.shared";

export function createDrenyraConsoleApprovalRoutes(
	consoleService: DrenyraFiscalConsoleService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-console-approval-routes" })
		.post(
			"/approvals/:id/approve",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const approval = await consoleService.approveApprovalRequest(
						contextResolution.context,
						params.id,
						body,
					);
					return ok(approval);
				} catch (error) {
					set.status = statusForApprovalDecisionError(error);
					return consoleError(error);
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
					const approval = await consoleService.rejectApprovalRequest(
						contextResolution.context,
						params.id,
						body,
					);
					return ok(approval);
				} catch (error) {
					set.status = statusForApprovalDecisionError(error);
					return consoleError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({ decisionReason: t.Optional(t.String()) }),
				detail: {
					tags: ["Drenyra"],
					summary: "Reject Drenyra approval request",
				},
			},
		);
}
