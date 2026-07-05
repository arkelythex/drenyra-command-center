/**
 * Fiscal Agent Routes — group registration.
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins/company-scope-guard";
import { fiscalAgentReportRoute } from "./report.route";
import { fiscalAgentCorrectionRoute } from "./correction.route";
import { fiscalAgentHealthRoute } from "./health.route";

export const fiscalAgentRoutes = new Elysia({ prefix: "/api" })
	.use(companyScopeGuard())
	.use(fiscalAgentReportRoute)
	.use(fiscalAgentCorrectionRoute)
	.use(fiscalAgentHealthRoute);
