import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorkspace } from "../contexts/workspace-context";

export const Route = createFileRoute(
	"/workspace/$companyId/$year/$month/$intent",
)({
	component: WorkspaceRoute,
});

const MOCK_COMPANIES: Record<
	string,
	{ id: string; name: string; ruc: string; organizationId: string }
> = {
	arkelythex: {
		id: "1",
		name: "Arkelythex SAC",
		ruc: "20123456789",
		organizationId: "org-1",
	},
};

/**
 * WorkspaceRoute — navigates to workspace on mount.
 *
 * Reads route params and calls workspace.navigateTo().
 * Shows workspace content or loading state.
 */
function WorkspaceRoute() {
	const { companyId, year, month, intent } = Route.useParams();
	const { workspace, navigateTo, isLoading } = useWorkspace();

	const yearNum = Number.parseInt(year, 10);
	const monthNum = Number.parseInt(month, 10);

	// Navigate to workspace on mount or param change
	useEffect(() => {
		const company = MOCK_COMPANIES[companyId];
		if (!company) return;

		navigateTo(
			company,
			yearNum,
			monthNum,
			intent as
				| "close"
				| "reconcile"
				| "review"
				| "investigate"
				| "configure"
				| "report",
		);
	}, [companyId, yearNum, monthNum, intent, navigateTo]);

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="text-sm text-[var(--text-muted)]">
					Cargando workspace...
				</div>
			</div>
		);
	}

	if (!workspace) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center">
					<p className="text-sm font-medium text-[var(--text-primary)]">
						Workspace no encontrado
					</p>
					<p className="mt-1 text-xs text-[var(--text-muted)]">
						Empresa: {companyId} · Periodo: {month}/{year} · Intención: {intent}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<div className="flex flex-1 items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-[var(--text-primary)]">
						{workspace.company.name}
					</p>
					<p className="text-xs text-[var(--text-secondary)]">
						{workspace.period.label} · {workspace.intent}
					</p>
					<p className="mt-4 text-xs text-[var(--text-muted)]">
						Workspace listo. El contenido específico del workspace se implementa
						en Waves B y C.
					</p>
				</div>
			</div>
		</div>
	);
}
