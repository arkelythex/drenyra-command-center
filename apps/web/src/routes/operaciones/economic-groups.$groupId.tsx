import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { DemoFeatureUnavailable } from "../../components/demo-feature-unavailable";
import { isDemoFeatureEnabled } from "../../lib/demo-feature-flags";

const EconomicGroupDashboard = lazyRouteComponent(
	() =>
		import("../../features/economic-groups/components/EconomicGroupDashboard"),
	"EconomicGroupDashboard",
);

export const Route = createFileRoute("/operaciones/economic-groups/$groupId")({
	component: EconomicGroupsPage,
});

function EconomicGroupsPage() {
	const { groupId } = Route.useParams();

	if (!isDemoFeatureEnabled("economic-groups")) {
		return (
			<DemoFeatureUnavailable
				title="Economic Groups deshabilitado en demo"
				description="Los grupos económicos siguen en una etapa avanzada pero no forman parte del recorrido P0. La ruta queda bloqueada para evitar navegación hacia superficies no críticas."
			/>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<EconomicGroupDashboard groupId={groupId} />
		</div>
	);
}
