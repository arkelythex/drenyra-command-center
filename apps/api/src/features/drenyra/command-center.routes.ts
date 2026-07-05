import type { DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import { Elysia } from "elysia";
import type { ResolveDrenyraActorContext } from "./command-center.shared";
import { createDrenyraCommandCenterApprovalRoutes } from "./command-center-approval.routes";
import { createDrenyraCommandCenterCaseRoutes } from "./command-center-case.routes";
import { createDrenyraCommandCenterWorkflowRoutes } from "./command-center-workflow.routes";

export function createDrenyraCommandCenterRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-command-center-routes" })
		.use(
			createDrenyraCommandCenterCaseRoutes(
				commandCenter,
				resolveDrenyraActorContext,
			),
		)
		.use(
			createDrenyraCommandCenterWorkflowRoutes(
				commandCenter,
				resolveDrenyraActorContext,
			),
		)
		.use(
			createDrenyraCommandCenterApprovalRoutes(
				commandCenter,
				resolveDrenyraActorContext,
			),
		);
}
