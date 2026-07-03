/**
 * Fiscal Agent Routes — group registration.
 */

import { Elysia } from "elysia";
import { fiscalAgentReportRoute } from "./report.route";
import { fiscalAgentCorrectionRoute } from "./correction.route";

export const fiscalAgentRoutes = new Elysia()
	.use(fiscalAgentReportRoute)
	.use(fiscalAgentCorrectionRoute);
