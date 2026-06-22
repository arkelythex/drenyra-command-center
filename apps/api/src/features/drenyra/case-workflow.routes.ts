/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type { DrenyraFiscalCommandCenterService } from "@arkelythex/application/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import {
	autonomyLevelSchema,
	commandCenterError,
	drenyraAgentTypeSchema,
	evidenceTypeSchema,
	metadataSchema,
	readIdempotencyKey,
} from "./drenyra-command-center-http";
import {
	drenyraActorContextFailure,
	resolveDrenyraActorContext,
} from "./drenyra-context";

export interface CaseWorkflowRoutesDeps {
	commandCenter: DrenyraFiscalCommandCenterService;
}

export function createCaseWorkflowRoutes({ commandCenter }: CaseWorkflowRoutesDeps) {
	return new Elysia({ name: "drenyra-case-workflow" })
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
						{ ...body, idempotencyKey: readIdempotencyKey(headers, body) },
					);
					set.status = 201;
					return ok(evidence);
				} catch (error) {
					set.status = error instanceof Error && error.message.endsWith("_NOT_FOUND") ? 404 : 400;
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
					idempotencyKey: t.Optional(t.String({ minLength: 8, maxLength: 160 })),
				}),
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
						readIdempotencyKey(headers, body),
					);
					set.status = 201;
					return ok(run);
				} catch (error) {
					set.status = error instanceof Error && error.message.endsWith("_NOT_FOUND") ? 404 : 400;
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({
					agentType: drenyraAgentTypeSchema,
					idempotencyKey: t.Optional(t.String({ minLength: 8, maxLength: 160 })),
				}),
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
					return ok(await commandCenter.listAgentRuns(contextResolution.context, params.id));
				} catch (error) {
					set.status = 404;
					return commandCenterError(error);
				}
			},
			{ params: t.Object({ id: t.String({ minLength: 1 }) }) },
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
						{ ...body, idempotencyKey: readIdempotencyKey(headers, body) },
					);
					set.status = 201;
					return ok(approval);
				} catch (error) {
					set.status = error instanceof Error && error.message.endsWith("_NOT_FOUND") ? 404 : 400;
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
					idempotencyKey: t.Optional(t.String({ minLength: 8, maxLength: 160 })),
				}),
			},
		);
}
