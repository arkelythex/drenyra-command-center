import { cn } from "@/lib/utils";
import { SidebarCaseList } from "./components/SidebarCaseList";
import { SidebarFooter } from "./components/SidebarFooter";
import { SidebarNavItems } from "./components/SidebarNavItems";
import { SidebarSearch } from "./components/SidebarSearch";
import { SidebarToggle } from "./components/SidebarToggle";
import type { SidebarProps } from "./Sidebar.types";

export function Sidebar({ isCollapsed, onToggle, onNavigate }: SidebarProps) {
	return (
		<aside
			className={cn(
				"relative flex h-full flex-col bg-[var(--surface-1)] border-r border-[var(--border-subtle)] transition-[width] duration-300 ease-in-out",
				isCollapsed ? "w-[64px]" : "w-[260px]",
			)}
		>
			<SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />

			<nav
				id="sidebar-navigation"
				className="flex-1 overflow-y-auto scrollbar-none px-3 pt-3 space-y-4"
				aria-label="Navegación lateral"
			>
				<SidebarSearch isCollapsed={isCollapsed} />
				<SidebarCaseList isCollapsed={isCollapsed} onNavigate={onNavigate} />

				{!isCollapsed && (
					<div className="border-t border-[var(--border-subtle)]" />
				)}

				<SidebarNavItems isCollapsed={isCollapsed} onNavigate={onNavigate} />
			</nav>

			<SidebarFooter isCollapsed={isCollapsed} onNavigate={onNavigate} />
		</aside>
	);
}
