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
import type { AuditEventType } from "@drenyra/domain/drenyra";
import { Elysia, t } from "elysia";
import { ok } from "../shared/api-response";
import {
	drenyraActorContextFailure,
	resolveDrenyraActorContext,
} from "./drenyra-context";

export interface CommandEnvelopeAuditRoutesDeps {
	commandCenter: DrenyraFiscalCommandCenterService;
}

const commandEnvelopeEventTypes = {
	allowed: ["CAPABILITY_ALLOWED"] satisfies AuditEventType[],
	denied: ["CAPABILITY_DENIED"] satisfies AuditEventType[],
	all: ["CAPABILITY_ALLOWED", "CAPABILITY_DENIED"] satisfies AuditEventType[],
};

function readLimit(value: string | undefined): number {
	if (!value) return 50;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 1) return 50;
	return Math.min(parsed, 100);
}

export function createCommandEnvelopeAuditRoutes({
	commandCenter,
}: CommandEnvelopeAuditRoutesDeps) {
	return new Elysia({ name: "drenyra-command-envelope-audit" }).get(
		"/command-envelope/audit",
		async ({ query, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const decision = query.decision ?? "all";
			const events = await commandCenter.listAuditEvents(
				contextResolution.context,
				{
					caseId: query.caseId,
					eventTypes: commandEnvelopeEventTypes[decision],
					limit: readLimit(query.limit),
				},
			);
			return ok({
				decision,
				events,
				count: events.length,
			});
		},
		{
			query: t.Object({
				decision: t.Optional(
					t.Union([
						t.Literal("allowed"),
						t.Literal("denied"),
						t.Literal("all"),
					]),
				),
				caseId: t.Optional(t.String({ minLength: 1 })),
				limit: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Drenyra"],
				summary: "List scoped command-envelope capability audit events",
			},
		},
	);
}
