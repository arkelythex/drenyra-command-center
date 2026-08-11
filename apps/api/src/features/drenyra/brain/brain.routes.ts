/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

import { createDrenyraBrainEvidenceBridge } from "@drenyra/application/drenyra";
import { type EvidenceGraphRepository, RUC } from "@drenyra/domain";
import { Elysia, t } from "elysia";
import {
	createInMemoryDrenyraBrainRepository,
	type DrenyraBrainRepository,
} from "./brain.repository";
import { createDrenyraBrainService } from "./brain.service";

interface DrenyraBrainContextResolution {
	ok: boolean;
	missingHeaders: string[];
	invalidHeaders?: string[];
	organizationId?: string;
	companyId?: string;
	companyRuc?: string;
	period?: string;
	userId?: string;
}

function readHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

function resolveContext(
	headers: Record<string, string | undefined>,
): DrenyraBrainContextResolution {
	const organizationId = readHeader(headers, "x-organization-id");
	const companyId = readHeader(headers, "x-company-id");
	const companyRuc = readHeader(headers, "x-company-ruc");
	const period = readHeader(headers, "x-fiscal-period");
	const userId = readHeader(headers, "x-user-id");

	const missingHeaders = [
		...(organizationId ? [] : ["x-organization-id"]),
		...(companyId ? [] : ["x-company-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
		...(userId ? [] : ["x-user-id"]),
	];

	const invalidHeaders =
		companyRuc && !RUC.isValid(companyRuc) ? ["x-company-ruc"] : [];

	if (missingHeaders.length > 0 || invalidHeaders.length > 0) {
		return { ok: false, missingHeaders, invalidHeaders };
	}

	return {
		ok: true,
		missingHeaders: [],
		organizationId,
		companyId,
		companyRuc,
		period,
		userId,
	};
}

function tenantContextRequired(
	context: Pick<
		DrenyraBrainContextResolution,
		"missingHeaders" | "invalidHeaders"
	>,
) {
	const hasInvalidHeaders = (context.invalidHeaders?.length ?? 0) > 0;
	return {
		error: hasInvalidHeaders
			? "Drenyra brain requests require a valid SUNAT RUC"
			: "Drenyra brain requests require tenant and user scope headers",
		code: hasInvalidHeaders ? "INVALID_RUC" : "TENANT_CONTEXT_REQUIRED",
		details: {
			missingHeaders: context.missingHeaders,
			invalidHeaders: context.invalidHeaders ?? [],
		},
	};
}

export interface CreateDrenyraBrainModuleInput {
	repository?: DrenyraBrainRepository;
	evidenceGraph?: Pick<EvidenceGraphRepository, "appendNode" | "appendEdge">;
}

async function digestText(value: string): Promise<string> {
	const data = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

export function createDrenyraBrainModule(
	input: CreateDrenyraBrainModuleInput = {},
) {
	const repository = input.repository ?? createInMemoryDrenyraBrainRepository();
	const evidenceBridge = input.evidenceGraph
		? createDrenyraBrainEvidenceBridge({
				appendNode: input.evidenceGraph.appendNode,
				appendEdge: input.evidenceGraph.appendEdge,
				digest: digestText,
			})
		: undefined;
	const service = createDrenyraBrainService({
		repository,
		now: () => new Date().toISOString(),
		id: (prefix) => `${prefix}_${crypto.randomUUID()}`,
		...(evidenceBridge !== undefined ? { evidenceBridge } : {}),
	});

	return new Elysia({ prefix: "/api/drenyra/brain", name: "drenyra-brain" })
		.get("/threads", async ({ headers, set }) => {
			const context = resolveContext(headers);
			if (!context.ok) {
				set.status = 400;
				return tenantContextRequired(context);
			}

			return service.listThreads({
				fiscalScope: {
					organizationId: context.organizationId!,
					companyId: context.companyId!,
					companyRuc: context.companyRuc!,
					period: context.period!,
					countryCode: "PE",
				},
			});
		})
		.post(
			"/threads",
			async ({ headers, body, set }) => {
				const context = resolveContext(headers);
				if (!context.ok) {
					set.status = 400;
					return tenantContextRequired(context);
				}

    				const thread = await service.createThread({
    					title: body.title,
    					sourceSurface: body.sourceSurface,
    					...(body.linkedCaseId !== undefined
    						? { linkedCaseId: body.linkedCaseId }
    						: {}),
    					...(body.linkedMissionId !== undefined
    						? { linkedMissionId: body.linkedMissionId }
    						: {}),
    					createdBy: context.userId!,
					fiscalScope: {
						organizationId: context.organizationId!,
						companyId: context.companyId!,
						companyRuc: context.companyRuc!,
						period: context.period!,
						countryCode: "PE",
					},
				});

				set.status = 201;
				return thread;
			},
			{
				body: t.Object({
					title: t.String({ minLength: 1 }),
					sourceSurface: t.Union([
						t.Literal("cli"),
						t.Literal("tui"),
						t.Literal("web"),
						t.Literal("api"),
						t.Literal("automation"),
					]),
					linkedCaseId: t.Optional(t.String()),
					linkedMissionId: t.Optional(t.String()),
				}),
			},
		)
		.post(
			"/threads/:threadId/turns",
			async ({ params, headers, body, set }) => {
				const context = resolveContext(headers);
				if (!context.ok) {
					set.status = 400;
					return tenantContextRequired(context);
				}

				try {
					const turn = await service.startTurn({
						threadId: params.threadId,
						prompt: body.prompt,
						sourceSurface: body.sourceSurface,
						createdBy: context.userId!,
						fiscalScope: {
							organizationId: context.organizationId!,
							companyId: context.companyId!,
							companyRuc: context.companyRuc!,
							period: context.period!,
							countryCode: "PE",
						},
					});

					set.status = 201;
					return turn;
				} catch (error) {
					set.status = 404;
					return {
						error:
							error instanceof Error
								? error.message
								: "Unable to start Drenyra brain turn",
						code: "THREAD_NOT_FOUND",
					};
				}
			},
			{
				params: t.Object({ threadId: t.String({ minLength: 1 }) }),
				body: t.Object({
					prompt: t.String({ minLength: 1 }),
					sourceSurface: t.Union([
						t.Literal("cli"),
						t.Literal("tui"),
						t.Literal("web"),
						t.Literal("api"),
						t.Literal("automation"),
					]),
				}),
			},
		)
		.get(
			"/threads/:threadId/items",
			async ({ params, headers, set }) => {
				const context = resolveContext(headers);
				if (!context.ok) {
					set.status = 400;
					return tenantContextRequired(context);
				}

				const thread = await repository.getThread(params.threadId, {
					organizationId: context.organizationId!,
					companyId: context.companyId!,
					companyRuc: context.companyRuc!,
					period: context.period!,
					countryCode: "PE",
				});

				if (!thread) {
					set.status = 404;
					return {
						error: `Thread '${params.threadId}' not found for provided fiscal scope`,
						code: "THREAD_NOT_FOUND",
					};
				}

				return service.listItems({
					threadId: params.threadId,
					fiscalScope: {
						organizationId: context.organizationId!,
						companyId: context.companyId!,
						companyRuc: context.companyRuc!,
						period: context.period!,
						countryCode: "PE",
					},
				});
			},
			{ params: t.Object({ threadId: t.String({ minLength: 1 }) }) },
		)
		.get(
			"/threads/:threadId/events",
			async ({ params, headers, set }) => {
				const context = resolveContext(headers);
				if (!context.ok) {
					set.status = (context.invalidHeaders?.length ?? 0) > 0 ? 422 : 400;
					return tenantContextRequired(context);
				}

				const fiscalScope = {
					organizationId: context.organizationId!,
					companyId: context.companyId!,
					companyRuc: context.companyRuc!,
					period: context.period!,
					countryCode: "PE" as const,
				};
				const thread = await repository.getThread(params.threadId, fiscalScope);
				if (!thread) {
					set.status = 404;
					return {
						error: `Thread '${params.threadId}' not found for provided fiscal scope`,
						code: "THREAD_NOT_FOUND",
					};
				}

				const events = await service.listEvents({
					threadId: params.threadId,
					fiscalScope,
				});
				return new Response(
					`event: heartbeat\ndata: ${JSON.stringify({ status: "ok", threadId: params.threadId, events: events.length })}\n\n`,
					{
						headers: {
							"content-type": "text/event-stream",
							"cache-control": "no-cache",
							connection: "keep-alive",
						},
					},
				);
			},
			{ params: t.Object({ threadId: t.String({ minLength: 1 }) }) },
		);
}

export const drenyraBrainModule = createDrenyraBrainModule();
