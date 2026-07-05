import { DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import {
	autonomyLevelSchema,
	commandCenterError,
	drenyraActorContextFailure,
	drenyraAgentTypeSchema,
	evidenceTypeSchema,
	metadataSchema,
	type ResolveDrenyraActorContext,
	statusForCaseMutationError,
} from "./command-center.shared";

export function createDrenyraCommandCenterWorkflowRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-command-center-workflow-routes" })
		.post(
			"/cases/:id/evidence",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const evidence = await commandCenter.addEvidenceItem(
						contextResolution.context,
						params.id,
						body,
					);
					set.status = 201;
					return ok(evidence);
				} catch (error) {
					set.status = statusForCaseMutationError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({
					type: evidenceTypeSchema,
					title: t.String({ minLength: 2 }),
					summary: t.String({ minLength: 2 }),
					source: t.String({ minLength: 2 }),
					sourceRef: t.Optional(t.String()),
					contentHash: t.Optional(t.String()),
					metadata: metadataSchema,
				}),
				detail: {
					tags: ["Drenyra"],
					summary: "Add evidence to Drenyra fiscal case",
				},
			},
		)
		.post(
			"/cases/:id/agent-runs",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const run = await commandCenter.startAndCompleteMockAgentRun(
						contextResolution.context,
						params.id,
						body.agentType,
					);
					set.status = 201;
					return ok(run);
				} catch (error) {
					set.status = statusForCaseMutationError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({ agentType: drenyraAgentTypeSchema }),
				detail: {
					tags: ["Drenyra"],
					summary: "Start deterministic mock Drenyra agent run",
				},
			},
		)
		.get(
			"/cases/:id/agent-runs",
			async ({ params, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const runs = await commandCenter.listAgentRuns(
						contextResolution.context,
						params.id,
					);
					return ok(runs);
				} catch (error) {
					set.status = 404;
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				detail: { tags: ["Drenyra"], summary: "List Drenyra agent runs" },
			},
		)
		.post(
			"/cases/:id/approvals",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const approval = await commandCenter.requestApproval(
						contextResolution.context,
						params.id,
						body,
					);
					set.status = 201;
					return ok(approval);
				} catch (error) {
					set.status = statusForCaseMutationError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({
					title: t.String({ minLength: 2 }),
					description: t.String({ minLength: 2 }),
					autonomyLevel: t.Optional(autonomyLevelSchema),
					diff: t.Object({
						before: t.Record(t.String(), t.Unknown()),
						after: t.Record(t.String(), t.Unknown()),
						summary: t.String({ minLength: 2 }),
					}),
					metadata: metadataSchema,
				}),
				detail: { tags: ["Drenyra"], summary: "Request Drenyra approval" },
			},
		);
}
