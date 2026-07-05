/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type { DrenyraFiscalWorkInspectService } from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import {
	drenyraActorContextFailure,
	resolveDrenyraActorContext,
} from "./drenyra-context";

export interface FiscalWorkInspectRoutesDeps {
	fiscalWorkInspect: DrenyraFiscalWorkInspectService;
}

function readGrantedCapabilities(
	headers: Record<string, string | undefined>,
): string[] {
	const value = `${headers["x-drenyra-capability"] ?? ""},${headers["x-drenyra-capabilities"] ?? ""}`;
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function createFiscalWorkInspectRoutes(
	deps: FiscalWorkInspectRoutesDeps,
) {
	return new Elysia({ name: "drenyra-fiscal-work-inspect" }).get(
		"/fiscal-work/:workItemId/inspect",
		async ({ params, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const context = contextResolution.context;
			const result = await deps.fiscalWorkInspect.inspect({
				scope: {
					organizationId: context.organizationId,
					companyId: context.companyId,
					companyRuc: context.companyRuc,
					period: context.period,
					countryCode: "PE",
					actorId: context.userId,
				},
				workItemId: params.workItemId,
				grantedCapabilities: readGrantedCapabilities(headers),
			});
			if (result.status === "denied") set.status = 403;
			if (result.status === "not_found") set.status = 404;
			return ok(result);
		},
		{
			params: t.Object({ workItemId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["Drenyra"],
				summary: "Inspect one scoped Drenyra fiscal work item",
			},
		},
	);
}
