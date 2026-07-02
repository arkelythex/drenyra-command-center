/**
 * AI Swarm API Routes
 *
 * Mount point for all AI Swarm route modules
 *
 * @module ai-swarm/api/routes
 */

import { Elysia } from "elysia";
import { latencyStatsModule } from "../latency-stats/index";
import { aiObservabilityModule } from "../observability/index";
import { agentStreamRoute } from "./agent-stream.route";
import { agentsRoute } from "./agents.route";
import { budgetRoute } from "./budget.route";
import { compatControlPlaneRoute } from "./compat-control-plane.route";
import { costStatsRoute } from "./cost-stats.route";
import { invoiceValidationRoute } from "./invoice-validation.route";
import { sireRoute } from "./sire.route";
import { workflowRoute } from "./workflow.route";

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */
export const aiSwarmRoutes = new Elysia({ prefix: "/api/ai-swarm" })
	.use(aiObservabilityModule)
	.use(latencyStatsModule)
	.use(invoiceValidationRoute)
	.use(agentStreamRoute)
	.use(agentsRoute)
	.use(budgetRoute)
	.use(workflowRoute)
	.use(compatControlPlaneRoute)
	.use(sireRoute)
	.use(costStatsRoute);
