import type {
	DrenyraBrainSourceSurface,
	DrenyraFiscalScope,
} from "@drenyra/domain/drenyra";
import { Elysia, t } from "elysia";
import { fail, ok } from "../../shared/api-response";
import { createInMemoryDrenyraBrainRepository } from "./brain.repository";
import {
	createDrenyraBrainService,
	type DrenyraBrainService,
} from "./brain.service";

let idCounter = 0;
function generateId(prefix: string): string {
	idCounter++;
	return `${prefix}_${Date.now()}_${idCounter}`;
}

const brainService: DrenyraBrainService = createDrenyraBrainService({
	repository: createInMemoryDrenyraBrainRepository(),
	now: () => new Date().toISOString(),
	id: generateId,
});

function resolveFiscalScope(
	headers: Record<string, string | undefined>,
):
	| { ok: true; scope: DrenyraFiscalScope }
	| { ok: false; missingHeaders: string[] } {
	const organizationId = headers["x-organization-id"]?.trim() ?? null;
	const companyId = headers["x-company-id"]?.trim() ?? null;
	const companyRuc = headers["x-company-ruc"]?.trim() ?? null;
	const period = headers["x-fiscal-period"]?.trim() ?? null;
	const missingHeaders = [
		...(organizationId ? [] : ["x-organization-id"]),
		...(companyId ? [] : ["x-company-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
	];
	if (!organizationId || !companyId || !companyRuc || !period) {
		return { ok: false, missingHeaders };
	}
	return {
		ok: true,
		scope: {
			organizationId,
			companyId,
			companyRuc,
			period,
			countryCode: "PE",
		},
	};
}

function fiscalScopeFailure(missingHeaders: string[]) {
	return fail(
		"Brain endpoints require organization, company, RUC, and fiscal period headers",
		"TENANT_CONTEXT_REQUIRED",
		{ details: { missingHeaders } },
	);
}

const sourceSurfaceSchema = t.Union([
	t.Literal("cli"),
	t.Literal("tui"),
	t.Literal("web"),
	t.Literal("api"),
	t.Literal("automation"),
]);

export const drenyraBrainModule = new Elysia({
	prefix: "/brain",
	name: "drenyra-brain",
})
	.post(
		"/threads",
		async ({ body, headers, set }) => {
			const scopeResolution = resolveFiscalScope(headers);
			if (!scopeResolution.ok) {
				set.status = 400;
				return fiscalScopeFailure(scopeResolution.missingHeaders);
			}
			const thread = await brainService.createThread({
				title: body.title,
				fiscalScope: scopeResolution.scope,
				sourceSurface: body.sourceSurface as DrenyraBrainSourceSurface,
				createdBy: headers["x-user-id"]?.trim() ?? "unknown",
				...(body.linkedCaseId !== undefined
					? { linkedCaseId: body.linkedCaseId }
					: {}),
				...(body.linkedMissionId !== undefined
					? { linkedMissionId: body.linkedMissionId }
					: {}),
			});
			set.status = 201;
			return ok(thread);
		},
		{
			body: t.Object({
				title: t.String({ minLength: 1 }),
				sourceSurface: sourceSurfaceSchema,
				linkedCaseId: t.Optional(t.String()),
				linkedMissionId: t.Optional(t.String()),
			}),
			detail: { tags: ["Drenyra Brain"], summary: "Create a brain thread" },
		},
	)
	.get(
		"/threads",
		async ({ headers, set }) => {
			const scopeResolution = resolveFiscalScope(headers);
			if (!scopeResolution.ok) {
				set.status = 400;
				return fiscalScopeFailure(scopeResolution.missingHeaders);
			}
			const threads = await brainService.listThreads({
				fiscalScope: scopeResolution.scope,
			});
			return ok(threads);
		},
		{
			detail: { tags: ["Drenyra Brain"], summary: "List brain threads" },
		},
	)
	.post(
		"/threads/:id/turns",
		async ({ params, body, headers, set }) => {
			const scopeResolution = resolveFiscalScope(headers);
			if (!scopeResolution.ok) {
				set.status = 400;
				return fiscalScopeFailure(scopeResolution.missingHeaders);
			}
			try {
				const turn = await brainService.startTurn({
					threadId: params.id,
					prompt: body.prompt,
					fiscalScope: scopeResolution.scope,
					sourceSurface: body.sourceSurface as DrenyraBrainSourceSurface,
					createdBy: headers["x-user-id"]?.trim() ?? "unknown",
				});
				set.status = 201;
				return ok(turn);
			} catch (error) {
				set.status =
					error instanceof Error && error.message.includes("not found")
						? 404
						: 400;
				return fail(
					error instanceof Error ? error.message : "Failed to start turn",
					"BRAIN_ERROR",
				);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({
				prompt: t.String({ minLength: 1 }),
				sourceSurface: sourceSurfaceSchema,
			}),
			detail: { tags: ["Drenyra Brain"], summary: "Start a brain turn" },
		},
	)
	.get(
		"/threads/:id/items",
		async ({ params, headers, set }) => {
			const scopeResolution = resolveFiscalScope(headers);
			if (!scopeResolution.ok) {
				set.status = 400;
				return fiscalScopeFailure(scopeResolution.missingHeaders);
			}
			const items = await brainService.listItems({
				threadId: params.id,
				fiscalScope: scopeResolution.scope,
			});
			return ok(items);
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			detail: { tags: ["Drenyra Brain"], summary: "List brain thread items" },
		},
	);
