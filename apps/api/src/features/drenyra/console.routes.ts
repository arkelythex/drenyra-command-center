import type { DrenyraFiscalConsoleService } from "@drenyra/application/drenyra";
import { Elysia } from "elysia";
import type { ResolveDrenyraActorContext } from "./console.shared";
import { createDrenyraConsoleApprovalRoutes } from "./console-approval.routes";
import { createDrenyraConsoleCaseRoutes } from "./console-case.routes";
import { createDrenyraConsoleWorkflowRoutes } from "./console-workflow.routes";

export function createDrenyraConsoleRoutes(
	consoleService: DrenyraFiscalConsoleService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-console-routes" })
		.use(
			createDrenyraConsoleCaseRoutes(
				consoleService,
				resolveDrenyraActorContext,
			),
		)
		.use(
			createDrenyraConsoleWorkflowRoutes(
				consoleService,
				resolveDrenyraActorContext,
			),
		)
		.use(
			createDrenyraConsoleApprovalRoutes(
				consoleService,
				resolveDrenyraActorContext,
			),
		);
}
