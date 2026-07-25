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
			<div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-sm">
				{SETTINGS_NAV.map((item) => {
					const active = isSettingsNavItemActive(pathname, item.to);
					return (
						<Link
							key={item.to}
							to={item.to}
							preload="intent"
							className={cn(
								"inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200",
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
