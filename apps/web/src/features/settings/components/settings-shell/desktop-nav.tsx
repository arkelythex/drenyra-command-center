import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { SettingsNavItem } from "./constants";
import { isSettingsNavItemActive } from "./constants";

interface SettingsDesktopNavProps {
	pathname: string;
	visibleItems: SettingsNavItem[];
}

export function SettingsDesktopNav({
	pathname,
	visibleItems,
}: SettingsDesktopNavProps) {
	return (
		<nav
			className="flex flex-col gap-1"
			aria-label="Navegación de configuración"
		>
			{visibleItems.map((item) => {
				const active = isSettingsNavItemActive(pathname, item.to);
				const Icon = item.icon;
				return (
					<Link
						key={item.to}
						to={item.to}
						preload="intent"
						aria-current={active ? "page" : undefined}
						className={cn(
							"flex min-h-11 items-start gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
							active
								? "bg-muted text-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						<Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
						<span className="flex flex-col">
							<span className="text-sm font-medium">{item.label}</span>
							<span className="text-xs text-muted-foreground">
								{item.description}
							</span>
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
