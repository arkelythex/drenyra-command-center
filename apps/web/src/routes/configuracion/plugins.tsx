import { createFileRoute } from "@tanstack/react-router";
import { PluginsView } from "../../features/plugins/components/PluginsView";

export const Route = createFileRoute("/configuracion/plugins")({
	component: PluginsView,
});
