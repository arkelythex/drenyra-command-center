import type { DrenyraFiscalDesktopService } from "@drenyra/application/drenyra";
import { Elysia } from "elysia";
import type { ResolveDrenyraActorContext } from "./desktop.shared";
import { createDrenyraDesktopApprovalRoutes } from "./desktop-approval.routes";
import { createDrenyraDesktopCaseRoutes } from "./desktop-case.routes";
import { createDrenyraDesktopWorkflowRoutes } from "./desktop-workflow.routes";

export function createDrenyraDesktopRoutes(
	desktop: DrenyraFiscalDesktopService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-desktop-routes" })
		.use(createDrenyraDesktopCaseRoutes(desktop, resolveDrenyraActorContext))
		.use(
			createDrenyraDesktopWorkflowRoutes(desktop, resolveDrenyraActorContext),
		)
		.use(
			createDrenyraDesktopApprovalRoutes(desktop, resolveDrenyraActorContext),
		);
}
