import { useLocation } from "@tanstack/react-router";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { MainLayoutSettingsView } from "./components/MainLayoutSettingsView";
import { MainLayoutShell } from "./components/MainLayoutShell";

export function MainLayoutView({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	useKeyboardShortcuts();

	if (location.pathname.startsWith("/configuracion")) {
		return <MainLayoutSettingsView>{children}</MainLayoutSettingsView>;
	}

	return <MainLayoutShell>{children}</MainLayoutShell>;
}
