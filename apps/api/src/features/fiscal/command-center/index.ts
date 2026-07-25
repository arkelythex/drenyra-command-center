import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { drenyraHarnessRoutes } from "../../drenyra-harness/harness.routes";
import { agentRunsRoutes } from "./agent-runs.routes";
import { approvalRequestsRoutes } from "./approval-requests.routes";
import { auditEventsRoutes } from "./audit-events.routes";
import { fiscalCasesRoutes } from "./fiscal-cases.routes";

/**
 * fiscalCommandCenterModule const.
 *
 * @example
 * ```ts
 * console.log(fiscalCommandCenterModule);
 * ```
 */
export const fiscalCommandCenterModule = new Elysia({
	prefix: "/api/fiscal-command-center",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.use(fiscalCasesRoutes)
	.use(agentRunsRoutes)
	.use(drenyraHarnessRoutes)
	.use(approvalRequestsRoutes)
	.use(auditEventsRoutes);
