import { Elysia } from "elysia";
import { fail, ok } from "../../shared/api-response";
import { resolveFiscalCmdContext } from "./context";
import {
	type CreateFiscalCaseInput,
	CreateFiscalCaseSchema,
	type UpdateFiscalCaseInput,
	UpdateFiscalCaseSchema,
} from "./schemas";
import { fiscalCaseService } from "./services/fiscal-cases.service";

type FiscalCaseService = typeof fiscalCaseService;

/**
 * createFiscalCasesRoutes operation.
 *
 * @param service - Input for service.
 * @returns Result of createFiscalCasesRoutes.
 * @example
 * ```ts
 * const result = createFiscalCasesRoutes({} as FiscalCaseService);
 * console.log(result);
 * ```
 */
export function createFiscalCasesRoutes(
	service: FiscalCaseService = fiscalCaseService,
) {
	return new Elysia({ prefix: "/cases" })
		.get(
			"/",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.list(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/summaries",
			async ({ headers, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(await service.listSummaries(resolved.context));
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const item = await service.getById(params.id, resolved.context);
				if (!item) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(item);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.post(
			"/",
			async ({ headers, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				return ok(
					await service.create(body as CreateFiscalCaseInput, resolved.context),
				);
			},
			{
				body: CreateFiscalCaseSchema,
				detail: { tags: ["Fiscal Command Center"] },
			},
		)
		.patch(
			"/:id",
			async ({ headers, params, body, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const updated = await service.update(
					params.id,
					body as UpdateFiscalCaseInput,
					resolved.context,
				);
				if (!updated) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(updated);
			},
			{
				body: UpdateFiscalCaseSchema,
				detail: { tags: ["Fiscal Command Center"] },
			},
		)
		.get(
			"/:id/documents",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const rows = await service.getDocuments(params.id, resolved.context);
				if (!rows) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(rows);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		)
		.get(
			"/:id/evidence",
			async ({ headers, params, set }) => {
				const resolved = resolveFiscalCmdContext(headers);
				if (!resolved.ok) {
					set.status = 400;
					return resolved.error;
				}
				const rows = await service.getEvidence(params.id, resolved.context);
				if (!rows) {
					set.status = 404;
					return fail("Fiscal case not found", "NOT_FOUND");
				}
				return ok(rows);
			},
			{ detail: { tags: ["Fiscal Command Center"] } },
		);
}

/**
 * fiscalCasesRoutes const.
 *
 * @example
 * ```ts
 * console.log(fiscalCasesRoutes);
 * ```
 */
export const fiscalCasesRoutes = createFiscalCasesRoutes();
