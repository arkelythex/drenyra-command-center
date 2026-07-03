import { createFileRoute } from "@tanstack/react-router";
import { AutomationsPage } from "@/features/automations/components/AutomationsPage";

export const Route = createFileRoute("/automations")({
	component: AutomationsPage,
});
