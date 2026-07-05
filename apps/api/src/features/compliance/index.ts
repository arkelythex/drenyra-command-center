import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { SIRE_LEDGER_REPRO_RUNBOOK } from "../../lib/compliance-runbooks";
import { logger } from "../../lib/logger";
import { ComplianceService } from "../../services/compliance.service";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { accountingJobRunsRoute } from "./routes/accounting-job-runs.route";
import { accountingJobsRoute } from "./routes/accounting-jobs.route";
import { countryPackRoute } from "./routes/country-pack.route";
import { roadmapMvpRoute } from "./routes/roadmap-mvp.route";
import { sireDemoExportRoute } from "./routes/sire-demo-export.route";
import { sireDemoSummaryRoute } from "./routes/sire-demo-summary.route";

/**
 * complianceModule const.
 *
 * @example
 * ```ts
 * console.log(complianceModule);
 * ```
 */
export const complianceModule = new Elysia({ prefix: "/api/compliance" })
	.use(companyScopeGuard())
	.use(accountingJobRunsRoute)
	.use(accountingJobsRoute)
	.use(countryPackRoute)
	.use(roadmapMvpRoute)
	.use(sireDemoExportRoute)
	.use(sireDemoSummaryRoute)
	.get(
		"/dashboard",
		async ({ query, set }) => {
			try {
				const result = await ComplianceService.getDashboard(query.companyId);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
			}),
			detail: {
				tags: ["Compliance"],
				summary: "Compliance dashboard",
			},
		},
	)
	.get(
		"/issues",
		async ({ query, set }) => {
			try {
				const result = await ComplianceService.getIssues(query.companyId);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
			}),
			detail: {
				tags: ["Compliance"],
				summary: "List compliance issues",
			},
		},
	)
	.get(
		"/sire-reproducibility",
		async ({ query, set }) => {
			try {
				const result = await ComplianceService.verifySireReproducibility({
					companyId: query.companyId,
					year: query.year,
					month: query.month,
					totalTolerance: query.totalTolerance,
					igvTolerance: query.igvTolerance,
					recordTolerance: query.recordTolerance,
				});

				if (!result.reproducible) {
					logger.warn(
						{
							feature: "compliance",
							route: "/compliance/sire-reproducibility",
							companyId: query.companyId,
							period: result.period,
							differences: result.differences,
							runbookId: SIRE_LEDGER_REPRO_RUNBOOK.id,
						},
						"SIRE reproducibility mismatch detected",
					);
				}

				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR", {
					runbook: SIRE_LEDGER_REPRO_RUNBOOK,
				});
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				year: z.coerce.number().min(2026).max(2100),
				month: z.coerce.number().min(1).max(12),
				totalTolerance: z.coerce.number().min(0).optional(),
				igvTolerance: z.coerce.number().min(0).optional(),
				recordTolerance: z.coerce.number().min(0).optional(),
			}),
			detail: {
				tags: ["Compliance", "SIRE"],
				summary: "Verify SIRE reproducibility against ledger evidence",
			},
		},
	)
	.post(
		"/issues/:id/resolve",
		async ({ params, set }) => {
			try {
				await ComplianceService.resolveIssue(params.id);
				return ok({ resolved: true });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
			detail: {
				tags: ["Compliance"],
				summary: "Resolve compliance issue",
			},
		},
	);
