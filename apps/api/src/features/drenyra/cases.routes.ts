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
import { fail, ok } from "../shared/api-response";
import {
	commandCenterError,
	autonomyLevelSchema,
	fiscalCaseTypeSchema,
	fiscalRiskLevelSchema,
	manualFiscalCaseStatusSchema,
	metadataSchema,
	readIdempotencyKey,
} from "./drenyra-command-center-http";
import {
	drenyraActorContextFailure,
	resolveDrenyraActorContext,
} from "./drenyra-context";

export interface CasesRoutesDeps {
	commandCenter: DrenyraFiscalCommandCenterService;
}

export function createCasesRoutes({ commandCenter }: CasesRoutesDeps) {
	return new Elysia({ name: "drenyra-cases" })
		.get(
			"/cases",
			async ({ headers, set }) => {
				const contextResolution = resolveDrenyraActorContext(headers);
				if (!contextResolution.ok) {
					set.status = 400;
					return drenyraActorContextFailure(contextResolution.missingHeaders);
				}
				return ok(await commandCenter.listFiscalCases(contextResolution.context));
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
					const fiscalCase = await commandCenter.createFiscalCase(
						contextResolution.context,
						{ ...body, idempotencyKey: readIdempotencyKey(headers, body) },
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
					idempotencyKey: t.Optional(t.String({ minLength: 8, maxLength: 160 })),
				}),
				detail: { tags: ["Drenyra"], summary: "Create Drenyra fiscal case" },
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
				const details = await commandCenter.getFiscalCaseDetails(contextResolution.context, params.id);
				if (!details) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(details);
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				detail: { tags: ["Drenyra"], summary: "Get Drenyra fiscal case details" },
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
					return ok(await commandCenter.updateFiscalCaseStatus(contextResolution.context, params.id, body));
				} catch (error) {
					set.status = error instanceof Error && error.message.endsWith("_NOT_FOUND") ? 404 : error instanceof Error && error.message === "FISCAL_CASE_STATUS_UNCHANGED" ? 409 : 400;
					return commandCenterError(error);
				}
			},
			{
				params: t.Object({ id: t.String({ minLength: 1 }) }),
				body: t.Object({
					status: manualFiscalCaseStatusSchema,
					reason: t.Optional(t.String({ maxLength: 500 })),
				}),
				detail: { tags: ["Drenyra"], summary: "Update Drenyra fiscal case status" },
			},
		);
}
