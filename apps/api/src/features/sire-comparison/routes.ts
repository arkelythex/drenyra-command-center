import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail } from "../shared/api-response";
import {
	getComparison,
	getComparisonReport,
	getDashboard,
	getDiscrepancies,
	resolveDiscrepancy,
} from "./controller";

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
			return getComparison(query.companyId, params.period, set);
		},
		{
			params: t.Object({
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			}),
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE"],
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
			return getDiscrepancies(
				query.companyId,
				params.period,
				set,
				query.type,
				query.status,
			);
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
				tags: ["SIRE"],
				summary: "List discrepancies for a period",
				description:
					"Filtered list of discrepancies by type and/or resolution status.",
			},
		},
	)
	.patch(
		"/discrepancies/:id/resolve",
		async ({ params, body, set }) => {
			return resolveDiscrepancy(params.id, body.action, set, body.notes);
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
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
				tags: ["SIRE"],
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
			return getComparisonReport(query.companyId, params.period, set);
		},
		{
			params: t.Object({
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			}),
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE"],
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
			return getDashboard(query.companyId, set);
		},
		{
			query: t.Object({ companyId: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["SIRE"],
				summary: "Multi-period comparison dashboard",
				description:
					"Shows trend data across last 6 periods with overall match percentage.",
			},
		},
	);
