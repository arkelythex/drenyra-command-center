import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV, isSettingsNavItemActive } from "./constants";

interface SettingsMobileNavProps {
	pathname: string;
}

export function SettingsMobileNav({ pathname }: SettingsMobileNavProps) {
	return (
		<div className="mb-8 lg:hidden">
			<div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-black/5 bg-white p-1 shadow-sm">
				{SETTINGS_NAV.map((item) => {
					const active = isSettingsNavItemActive(pathname, item.to);
					const NavIcon = item.icon;
					return (
						<Link
							key={item.to}
							to={item.to}
							preload="intent"
							className={cn(
								"inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200",
								active
									? "bg-black/5 text-primary"
									: "text-secondary hover:bg-black/5 hover:text-primary",
							)}
						>
							<NavIcon size={14} strokeWidth={2} />
							{item.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
