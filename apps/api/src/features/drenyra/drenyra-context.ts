/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import type { AgentContext } from "@drenyra/pi";
import { fail } from "../shared/api-response";

export type DrenyraAgentContextResolution =
	| { ok: true; context: AgentContext }
	| {
			ok: false;
			code: "TENANT_CONTEXT_REQUIRED";
			error: string;
			details: { missingHeaders: string[] };
	  };

export type DrenyraActorContextResolution =
	| { ok: true; context: DrenyraActorContext }
	| { ok: false; missingHeaders: string[] };

function readRequiredHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string | null {
	const value = headers[key]?.trim();
	return value ? value : null;
}

function readOptionalHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

export function resolveAgentContextFromHeaders(
	headers: Record<string, string | undefined>,
): DrenyraAgentContextResolution {
	const companyId = readRequiredHeader(headers, "x-company-id");
	const userId = readRequiredHeader(headers, "x-user-id");
	const missingHeaders = [
		...(companyId ? [] : ["x-company-id"]),
		...(userId ? [] : ["x-user-id"]),
	];

	if (!companyId || !userId) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_REQUIRED",
			error: "Drenyra requests require tenant and user context headers",
			details: { missingHeaders },
		};
	}

	return {
		ok: true,
		context: {
			tenantId: companyId,
			userId,
			organizationId: companyId,
			companyId,
			ruc: readOptionalHeader(headers, "x-company-ruc"),
			traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		},
	};
}

export function resolveDrenyraActorContext(
	headers: Record<string, string | undefined>,
): DrenyraActorContextResolution {
	const companyId = readRequiredHeader(headers, "x-company-id");
	const userId = readRequiredHeader(headers, "x-user-id");
	const companyRuc = readRequiredHeader(headers, "x-company-ruc");
	const period = readRequiredHeader(headers, "x-fiscal-period");
	const missingHeaders = [
		...(companyId ? [] : ["x-company-id"]),
		...(userId ? [] : ["x-user-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
	];

	if (!companyId || !userId || !companyRuc || !period) {
		return { ok: false, missingHeaders };
	}

	return {
		ok: true,
		context: {
			companyId,
			companyRuc,
			organizationId:
				readOptionalHeader(headers, "x-organization-id") || companyId,
			period,
			userId,
		},
	};
}

export function drenyraActorContextFailure(missingHeaders: string[]) {
	return fail(
		"Drenyra command center requests require company, RUC, fiscal period and user headers",
		"TENANT_CONTEXT_REQUIRED",
		{ details: { missingHeaders } },
	);
}

export function drenyraContextFailure(
	resolution: Extract<DrenyraAgentContextResolution, { ok: false }>,
) {
	return fail(resolution.error, resolution.code, {
		details: resolution.details,
	});
}
