/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { fail, ok } from "../shared/api-response";
import {
	autonomyLevelSchema,
	commandCenterError,
	drenyraActorContextFailure,
	fiscalCaseTypeSchema,
	fiscalRiskLevelSchema,
	manualFiscalCaseStatusSchema,
	metadataSchema,
	type ResolveDrenyraActorContext,
	statusForStatusMutationError,
} from "./command-center.shared";

export function createDrenyraCommandCenterCaseRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-command-center-case-routes" })
		.get(
			"/cases",
			async ({ headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				const cases = await commandCenter.listFiscalCases(contextResolution.context);
				return ok(cases);
			},
			{ detail: { tags: ["Drenyra"], summary: "List Drenyra fiscal cases" } },
		)
		.post(
			"/cases",
			async ({ body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const idempotencyKey = headers["x-idempotency-key"]?.trim();
					const fiscalCase = await commandCenter.createFiscalCase(
						contextResolution.context,
						idempotencyKey ? { ...body, idempotencyKey } : body,
					);
					set.status = 201;
					return ok(fiscalCase);
				} catch (error) {
					set.status = 400;
					return commandCenterError(error);
				}
			},
			{
				body: t.Object({
					type: fiscalCaseTypeSchema,
					title: t.String({ minLength: 3 }),
					description: t.String({ minLength: 3 }),
					riskLevel: t.Optional(fiscalRiskLevelSchema),
					riskScore: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
					autonomyLevel: t.Optional(autonomyLevelSchema),
					metadata: metadataSchema,
				}),
				detail: { tags: ["Drenyra"], summary: "Create Drenyra fiscal case" },
			},
		)
		.post(
			"/missions/from-document",
			async ({ body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const mission = await commandCenter.bootstrapDocumentMission(
						contextResolution.context,
						body,
					);
					set.status = 201;
					return ok(mission);
				} catch (error) {
					set.status = 400;
					return commandCenterError(error);
				}
			},
			{
				body: t.Object({
					documentId: t.String({ minLength: 3 }),
					filename: t.String({ minLength: 1 }),
					mimeType: t.Optional(t.String({ minLength: 3 })),
				}),
				detail: {
					tags: ["Drenyra"],
					summary: "Bootstrap fiscal mission from uploaded document",
				},
			},
		)
		.get(
			"/cases/:id",
			async ({ params, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				const details = await commandCenter.getFiscalCaseDetails(
					contextResolution.context,
					params.id,
				);
				if (!details) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(details);
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				detail: {
					tags: ["Drenyra"],
					summary: "Get Drenyra fiscal case details",
				},
			},
		)
		.patch(
			"/cases/:id/status",
			async ({ params, body, headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				try {
					const fiscalCase = await commandCenter.updateFiscalCaseStatus(
						contextResolution.context,
						params.id,
						body,
					);
					return ok(fiscalCase);
				} catch (error) {
					set.status = statusForStatusMutationError(error);
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({
					status: manualFiscalCaseStatusSchema,
					reason: t.Optional(t.String({ maxLength: 500 })),
				}),
				detail: {
					tags: ["Drenyra"],
					summary: "Update Drenyra fiscal case status",
				},
			},
		);
}
