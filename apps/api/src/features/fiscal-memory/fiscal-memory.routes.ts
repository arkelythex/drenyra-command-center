/**
 * Fiscal Memory Routes — the "Consultar" step of the institutional
 * fiscal-memory loop (Decidir → Registrar → Consultar).
 *
 * Exposes company-scoped reads over the engram fiscal-memory adapter
 * (PR #139) and the approved-decision recorder (PR #152):
 *
 * - GET /api/v1/fiscal-memory           — list, optional period/category/severity/evidenceRef filters
 * - GET /api/v1/fiscal-memory/:id       — single memory by id (scoped)
 *
 * Every read is scoped by tenantId + companyId + ruc via the
 * companyScopeGuard (structural isolation; a different tenant/company/RUC can
 * never retrieve another tenant's memory).
 *
 * Fail closed: when DRENYRA_ENGRAM_ENABLED is off, queries answer 503 with
 * FISCAL_MEMORY_DISABLED — nothing touches the sidecar. Engram outages surface
 * as 503 DEPENDENCY_FAILURE, never as an unhandled crash.
 *
 * No monetary fields: Drenyra money values are BigInt cents (repo-wide rule);
 * fiscal memories carry no money values.
 */

import {
	FISCAL_MEMORY_CATEGORIES,
	FISCAL_MEMORY_SEVERITIES,
	type FiscalMemoryCategory,
	type FiscalMemorySeverity,
} from "@drenyra/domain/fiscal-memory";
import { EngramError } from "@drenyra/memory";
import { Elysia, t } from "elysia";

/** t.Enum record built from the canonical category list. */
const CATEGORY_ENUM = Object.fromEntries(
	FISCAL_MEMORY_CATEGORIES.map((category) => [category, category]),
) as Record<string, string>;

/** t.Enum record built from the canonical severity list. */
const SEVERITY_ENUM = Object.fromEntries(
	FISCAL_MEMORY_SEVERITIES.map((severity) => [severity, severity]),
) as Record<string, string>;

import { fail, ok } from "../../shared/api-response";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { companyScopeFiscalMemoryResolver } from "./company-scope-fiscal-memory.resolver";
import {
	createFiscalMemoryQueryService,
	type FiscalMemoryListFilters,
} from "./fiscal-memory.query";

export const fiscalMemoryRoutes = new Elysia({
	prefix: "/api/v1/fiscal-memory",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			if (
				companyContext?.companyId === undefined ||
				companyContext.companyId === ""
			) {
				set.status = 401;
				return fail("UNAUTHORIZED", "Company scope is required");
			}

			const service = createFiscalMemoryQueryService(
				companyScopeFiscalMemoryResolver,
			);
			try {
				const filters: FiscalMemoryListFilters = {};
				if (query.period !== undefined) filters.period = query.period;
				if (query.category !== undefined) {
					filters.category = query.category as FiscalMemoryCategory;
				}
				if (query.severity !== undefined) {
					filters.severity = query.severity as FiscalMemorySeverity;
				}
				if (query.evidenceRef !== undefined) {
					filters.evidenceRef = query.evidenceRef;
				}
				const result = await service.list(companyContext.companyId, filters);

				if (result.disabled) {
					set.status = 503;
					return fail(
						"FISCAL_MEMORY_DISABLED",
						"Fiscal memory is disabled (DRENYRA_ENGRAM_ENABLED is off)",
					);
				}

				return ok(
					result.memories.map((memory) => memory.toJSON()),
					{
						total: result.memories.length,
					},
				);
			} catch (error) {
				if (error instanceof EngramError) {
					set.status = 503;
					return fail(
						"DEPENDENCY_FAILURE",
						"Fiscal memory sidecar unavailable",
						{ kind: error.kind },
					);
				}
				throw error;
			}
		},
		{
			query: t.Object({
				period: t.Optional(t.String()),
				category: t.Optional(t.Enum(CATEGORY_ENUM)),
				severity: t.Optional(t.Enum(SEVERITY_ENUM)),
				evidenceRef: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Fiscal Memory"],
				summary: "List company fiscal memories",
				description:
					"Company-scoped fiscal memory (decisions, findings, monthly closings). " +
					"Optional filters: period (YYYY-MM), category, severity, evidenceRef.",
			},
		},
	)
	.get(
		"/:id",
		async ({ params, companyContext, set }) => {
			if (
				companyContext?.companyId === undefined ||
				companyContext.companyId === ""
			) {
				set.status = 401;
				return fail("UNAUTHORIZED", "Company scope is required");
			}

			const service = createFiscalMemoryQueryService(
				companyScopeFiscalMemoryResolver,
			);
			try {
				const result = await service.findById(
					companyContext.companyId,
					params.id,
				);

				if (result.disabled) {
					set.status = 503;
					return fail(
						"FISCAL_MEMORY_DISABLED",
						"Fiscal memory is disabled (DRENYRA_ENGRAM_ENABLED is off)",
					);
				}

				if (result.memory === null) {
					set.status = 404;
					return fail("NOT_FOUND", "Fiscal memory not found");
				}

				return ok(result.memory.toJSON());
			} catch (error) {
				if (error instanceof EngramError) {
					set.status = 503;
					return fail(
						"DEPENDENCY_FAILURE",
						"Fiscal memory sidecar unavailable",
						{ kind: error.kind },
					);
				}
				throw error;
			}
		},
		{
			params: t.Object({ id: t.String() }),
			detail: {
				tags: ["Fiscal Memory"],
				summary: "Get one company fiscal memory by id",
				description:
					"Returns the fiscal memory scoped to the calling company, or 404.",
			},
		},
	);
