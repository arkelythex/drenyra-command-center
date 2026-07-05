import { Elysia, t } from "elysia";
import type { DrenyraActorContext, DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import {
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	type DrenyraFiscalWorkInspectEnvelope,
	type DrenyraFiscalWorkInspectSourceSurface,
} from "@drenyra/domain/drenyra";

type DrenyraActorContextResolution =
	| { ok: true; context: DrenyraActorContext }
	| { ok: false; missingHeaders: string[] };

type ResolveDrenyraActorContext = (
	headers: Record<string, string | undefined>,
) => DrenyraActorContextResolution;

export function createDrenyraFiscalWorkRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-fiscal-work" }).get(
		"/fiscal-work/:id/inspect",
		async ({ params, headers, set }) => {
			const contextResolution = resolveActorContext(headers);
			let envelope: DrenyraFiscalWorkInspectEnvelope;
			if (!contextResolution.ok) {
				envelope = fiscalWorkInspectValidationEnvelope(headers, contextResolution.missingHeaders);
			} else {
				envelope = await commandCenter.inspectFiscalWorkItem(contextResolution.context, {
					workItemId: params.id,
					capabilityGranted: hasInspectCapabilityGrant(headers),
					traceId: resolveInspectTraceId(headers),
					sourceSurface: resolveInspectSourceSurface(headers),
				});
			}
			set.status = statusCodeForFiscalWorkInspect(envelope);
			return envelope;
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			detail: { tags: ["Drenyra"], summary: "Inspect scoped Drenyra fiscal work item" },
		},
	);
}

function readOptionalHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

function resolveInspectTraceId(headers: Record<string, string | undefined>): string | undefined {
	return readOptionalHeader(headers, "x-trace-id") || undefined;
}

function resolveInspectSourceSurface(
	headers: Record<string, string | undefined>,
): DrenyraFiscalWorkInspectSourceSurface {
	const sourceSurface = readOptionalHeader(headers, "x-drenyra-source-surface");
	if (sourceSurface === "cli" || sourceSurface === "web" || sourceSurface === "api" || sourceSurface === "automation") {
		return sourceSurface;
	}
	return "api";
}

function hasInspectCapabilityGrant(headers: Record<string, string | undefined>): boolean {
	return readOptionalHeader(headers, "x-drenyra-capability-grant")
		.split(",")
		.map((capability) => capability.trim())
		.includes(DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY);
}

function fiscalWorkInspectValidationEnvelope(
	headers: Record<string, string | undefined>,
	missingHeaders: string[],
): DrenyraFiscalWorkInspectEnvelope {
	return {
		status: "validation_failed",
		reasonCode: "TENANT_CONTEXT_REQUIRED",
		traceId: resolveInspectTraceId(headers) ?? `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
		redactedDetail: `Missing required fiscal scope headers: ${missingHeaders.join(", ")}`,
		sourceSurface: resolveInspectSourceSurface(headers),
	};
}

function statusCodeForFiscalWorkInspect(envelope: DrenyraFiscalWorkInspectEnvelope): 200 | 400 | 403 | 404 {
	if (envelope.status === "success") return 200;
	if (envelope.status === "denied") return 403;
	if (envelope.status === "not_found") return 404;
	return 400;
}
