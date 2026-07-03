/**
 * Fiscal Agent Health Route — Health score for InspectorFiscalPanel.
 * Returns the FiscalHealthScore from FiscalHealthService.
 */

import { Elysia } from "elysia";
import { fiscalHealthService } from "@arkelythex/infrastructure/services/fiscal-health.service";
import { ok, fail } from "../../shared/api-response";

export const fiscalAgentHealthRoute = new Elysia().get(
	"/fiscal-agent/health",
	async ({ headers }) => {
		try {
			const orgId = Number((headers as Record<string, string>)["x-organization-id"] ?? "1");
			const companyId = (headers as Record<string, string>)["x-company-id"] ?? "default";
			const period = new Date().toISOString().slice(0, 7).replace("-", "");

			const score = await fiscalHealthService.getHealthScore(orgId, companyId, period);
			return ok(score);
		} catch (error) {
			return fail(
				error instanceof Error ? error.message : "Failed to get health score",
				"HEALTH_CHECK_FAILED",
			);
		}
	},
	{
		detail: {
			tags: ["Fiscal Agent"],
			summary: "Get fiscal health score for dashboard",
		},
	},
);
