import { NavSection } from "@/components/ui/NavSection";
import type { NavigationItem } from "@/lib/navigation";
import type { AppRoutePath } from "@/lib/router/app-route";
import type { SettingsNavItem } from "./constants";
import { SETTINGS_NAV_GROUPS } from "./constants";

interface SettingsDesktopNavProps {
	pathname: string;
	visibleItems: SettingsNavItem[];
}

function toNavigationItem(item: SettingsNavItem): NavigationItem {
	return {
		id: item.to,
		section: "sistema",
		label: item.label,
		description: item.description,
		to: item.to as AppRoutePath,
		icon: item.icon,
		keywords: [item.label, item.description],
		activeMatch: item.to === "/configuracion" ? "exact" : "prefix",
	};
}

export function SettingsDesktopNav({
	pathname,
	visibleItems,
}: SettingsDesktopNavProps) {
	const visiblePaths = new Set(visibleItems.map((i) => i.to));

	return (
		<nav
			className="flex flex-col gap-1"
			aria-label="Navegación de configuración"
		>
			{SETTINGS_NAV_GROUPS.filter((group) =>
				group.items.some((item) => visiblePaths.has(item.to)),
			).map((group) => (
				<div key={group.label} className="flex flex-col gap-1">
					<NavSection
						label={group.label}
						pathname={pathname}
						compact
						items={group.items
							.filter((item) => visiblePaths.has(item.to))
							.map((item) => toNavigationItem(item))}
					/>
				</div>
			))}
		</nav>
	);
}
