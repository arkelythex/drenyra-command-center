import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { SireComparisonService } from "./infrastructure/compare.service";

export const sireComparisonRoutes = new Elysia({
	prefix: "/api/sire/comparison",
})
	.use(companyScopeGuard())
	.get(
		"/:period",
		async ({ params, query, set, companyContext }) => {
			if (
				query.companyId !== (companyContext as { companyId: string }).companyId
			) {
				set.status = 403;
				return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
			}

			try {
				const result = await SireComparisonService.getComparison(
					query.companyId,
					params.period,
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "SIRE_COMPARISON_ERROR");
			}
		},
		{
			params: t.Object({
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			}),
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE Comparison"],
				summary: "SIRE comparison summary for a period",
				description:
					"Returns comparison summary with match percentage and discrepancy counts.",
			},
		},
	)
	.get(
		"/:period/discrepancies",
		async ({ params, query, set, companyContext }) => {
			if (
				query.companyId !== (companyContext as { companyId: string }).companyId
			) {
				set.status = 403;
				return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
			}

			try {
				const discrepancies = await SireComparisonService.getDiscrepancies(
					query.companyId,
					params.period,
					query.type,
					query.status,
				);
				return ok(discrepancies);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "SIRE_DISCREPANCIES_ERROR");
			}
		},
		{
			params: t.Object({
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			}),
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				type: t.Optional(
					t.Union([
						t.Literal("SUNAT_ONLY"),
						t.Literal("LOCAL_ONLY"),
						t.Literal("AMOUNT_MISMATCH"),
						t.Literal("STATUS_MISMATCH"),
					]),
				),
				status: t.Optional(
					t.Union([
						t.Literal("UNRESOLVED"),
						t.Literal("ACCEPTED"),
						t.Literal("FLAGGED"),
						t.Literal("REVIEWING"),
					]),
				),
			}),
			detail: {
				tags: ["SIRE Comparison"],
				summary: "List discrepancies for a period",
				description:
					"Filtered list of discrepancies by type and/or resolution status.",
			},
		},
	)
	.patch(
		"/discrepancies/:id/resolve",
		async ({ params, body, query, set, companyContext }) => {
			try {
				const companyId =
					query.companyId ??
					(companyContext as { companyId: string } | undefined)?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = await SireComparisonService.resolveDiscrepancy(
					params.id,
					companyId,
					query.period ?? "",
					body.action,
					body.notes,
				);
				return ok(result);
			} catch (error) {
				const message = getErrorMessage(error);
				if (message.includes("not found")) {
					set.status = 404;
					return fail(message, "DISCREPANCY_NOT_FOUND");
				}
				set.status = 500;
				return fail(message, "SIRE_RESOLVE_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			query: t.Object({
				companyId: t.Optional(t.String({ minLength: 1 })),
				period: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
			}),
			body: t.Object({
				action: t.Union([
					t.Literal("ACCEPT_SUNAT"),
					t.Literal("ACCEPT_LOCAL"),
					t.Literal("MANUAL_FIX"),
					t.Literal("FLAG_FOR_REVIEW"),
				]),
				notes: t.Optional(t.String()),
			}),
			detail: {
				tags: ["SIRE Comparison"],
				summary: "Resolve a discrepancy",
				description:
					"Accept SUNAT/local, flag for review, or mark as manual fix.",
			},
		},
	)
	.post(
		"/:period/report",
		async ({ params, query, set, companyContext }) => {
			if (
				query.companyId !== (companyContext as { companyId: string }).companyId
			) {
				set.status = 403;
				return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
			}

			try {
				const result = await SireComparisonService.getReport(
					query.companyId,
					params.period,
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "SIRE_REPORT_ERROR");
			}
		},
		{
			params: t.Object({
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			}),
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE Comparison"],
				summary: "Generate full comparison report",
				description:
					"Returns a structured report with summary, all discrepancies, and metadata.",
			},
		},
	)
	.get(
		"/dashboard",
		async ({ query, set, companyContext }) => {
			if (
				query.companyId !== (companyContext as { companyId: string }).companyId
			) {
				set.status = 403;
				return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
			}

			try {
				const result = await SireComparisonService.getDashboard(
					query.companyId,
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "SIRE_DASHBOARD_ERROR");
			}
		},
		{
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE Comparison"],
				summary: "Multi-period comparison dashboard",
				description:
					"Shows trend data across last 6 periods with overall match percentage.",
			},
		},
	);
