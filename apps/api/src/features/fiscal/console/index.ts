import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { drenyraHarnessRoutes } from "../../drenyra-harness/harness.routes";
import { agentRunsRoutes } from "./agent-runs.routes";
import { approvalRequestsRoutes } from "./approval-requests.routes";
import { auditEventsRoutes } from "./audit-events.routes";
import { fiscalCasesRoutes } from "./fiscal-cases.routes";

/**
 * fiscalConsoleModule const.
 *
 * @example
 * ```ts
 * console.log(fiscalConsoleModule);
 * ```
 */
export const fiscalConsoleModule = new Elysia({
	prefix: "/api/fiscal-console",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.use(fiscalCasesRoutes)
	.use(agentRunsRoutes)
	.use(drenyraHarnessRoutes)
	.use(approvalRequestsRoutes)
	.use(auditEventsRoutes);
