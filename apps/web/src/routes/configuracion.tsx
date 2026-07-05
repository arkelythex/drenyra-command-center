import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsProvider } from "@/context/SettingsContext";

export const Route = createFileRoute("/configuracion")({
	component: () => (
		<SettingsProvider>
			<Outlet />
		</SettingsProvider>
	),
});
