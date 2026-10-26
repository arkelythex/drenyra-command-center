import { Link } from "@tanstack/react-router";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import { isSettingsNavItemActive, SETTINGS_NAV } from "./constants";

interface SettingsMobileNavProps {
	pathname: string;
}

export function SettingsMobileNav({ pathname }: SettingsMobileNavProps) {
	return (
		<div className="mb-8 lg:hidden">
			<div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
				{SETTINGS_NAV.map((item) => {
					const active = isSettingsNavItemActive(pathname, item.to);
					return (
						<Link
							key={item.to}
							to={item.to}
							preload="intent"
							className={cn(
								"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
								active
									? "bg-[var(--surface-2)] text-[var(--text-primary)]"
									: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
							)}
						>
							{createElement(item.icon, { size: 14, strokeWidth: 2 })}
							{item.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
