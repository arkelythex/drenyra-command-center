import { Elysia } from "elysia";
import { AppError } from "../../lib/errors";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	BatchValidateBody,
	IdParams,
	LineageParams,
	LinkBody,
	SearchQuery,
	UnlinkBody,
} from "./schemas";
import * as service from "./service";

function handleError(error: unknown, set: { status: number }) {
	if (error instanceof AppError) {
		set.status = error.statusCode;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

function s(set: { status?: number | string }): { status: number } {
	return set as unknown as { status: number };
}

export const evidenceV2Routes = new Elysia({
	prefix: "/api/v2/evidence",
	name: "evidence-v2",
})
	.use(companyScopeGuard())

	// ─── Search evidence ───
	.get(
		"/search",
		async ({ query, set }) => {
			try {
				const result = await service.searchEvidence({
					companyId: query.companyId,
					type: query.type,
					source: query.source,
					status: query.status,
					period: query.period,
					q: query.q,
					limit: query.limit,
					offset: query.offset,
				});
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			query: SearchQuery,
			detail: {
				tags: ["Evidence V2"],
				summary: "Search evidence with filters",
			},
		},
	)

	// ─── Evidence detail with lineage links ───
	.get(
		"/:id",
		async ({ params, set }) => {
			try {
				const result = await service.getEvidenceDetail(params.id);
				if (!result) {
					set.status = 404;
					return fail("Evidence no encontrado", "NOT_FOUND");
				}
				return ok({ data: result });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Evidence V2"],
				summary: "Get evidence detail with lineage links",
			},
		},
	)

	// ─── Validate evidence ───
	.post(
		"/:id/validate",
		async ({ params, set }) => {
			try {
				const result = await service.validateSingle(params.id);
				return ok({ data: result });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Evidence V2"],
				summary: "Validate evidence against SUNAT",
			},
		},
	)

	// ─── Batch validate ───
	.post(
		"/batch-validate",
		async ({ body, set }) => {
			try {
				const result = await service.batchValidate(body.ids);
				return ok({ data: result });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: BatchValidateBody,
			detail: {
				tags: ["Evidence V2"],
				summary: "Batch validate multiple evidence items",
			},
		},
	)

	// ─── Link evidence to entity ───
	.post(
		"/link",
		async ({ body, set }) => {
			try {
				const link = await service.createLink({
					evidenceId: body.evidenceId,
					entityType: body.entityType,
					entityId: body.entityId,
					relationship: body.relationship ?? "supporting",
					linkedBy: "current-user",
				});
				if (!link) {
					set.status = 409;
					return fail("El vínculo ya existe", "DUPLICATE_LINK");
				}
				set.status = 201;
				return ok({ data: link });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: LinkBody,
			detail: {
				tags: ["Evidence V2"],
				summary: "Link evidence to a business entity",
			},
		},
	)

	// ─── Unlink evidence ───
	.post(
		"/unlink",
		async ({ body, set }) => {
			try {
				const deleted = await service.deleteLink(body.linkId);
				if (!deleted) {
					set.status = 404;
					return fail("Vínculo no encontrado", "NOT_FOUND");
				}
				return ok({ data: { unlinked: true } });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: UnlinkBody,
			detail: {
				tags: ["Evidence V2"],
				summary: "Unlink evidence from an entity",
			},
		},
	)

	// ─── Lineage for entity ───
	.get(
		"/lineage/:entityType/:entityId",
		async ({ params, set }) => {
			try {
				const result = await service.getLineage(
					params.entityType,
					params.entityId,
				);
				return ok({ data: result });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: LineageParams,
			detail: {
				tags: ["Evidence V2"],
				summary: "Get complete evidence lineage for an entity",
			},
		},
	);
