import { createFileRoute, redirect } from "@tanstack/react-router";
import { closeWorkspaceParams } from "@/lib/close-workspace";
import { getActiveFiscalSnapshot } from "@/lib/use-active-company-context";

/** Entry point of the monthly close: the active company's period workspace. */
export const Route = createFileRoute("/cierre-mensual")({
	loader: () => {
		const { companyContext, fiscalPeriod } = getActiveFiscalSnapshot();
		throw redirect({
			to: "/workspace/$companyId/$year/$month/$intent",
			params: closeWorkspaceParams(companyContext.companyId, fiscalPeriod),
		});
	},
});
