import { Outlet } from "@tanstack/react-router";
import { SettingsProvider } from "@/context/SettingsContext";

export default function SettingsLayout() {
	return (
		<SettingsProvider>
			<Outlet />
		</SettingsProvider>
	);
}
