import { createFileRoute } from "@tanstack/react-router";
import { AutomationsView } from "../../features/automations/components/AutomationsView";

export const Route = createFileRoute("/drenyra/automatizaciones")({
	component: () => <AutomationsView />,
});
