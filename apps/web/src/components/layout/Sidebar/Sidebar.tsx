import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SidebarCaseList } from "./components/SidebarCaseList";
import { SidebarFooter } from "./components/SidebarFooter";
import { SidebarSection } from "./components/SidebarSection";
import { SidebarSearch } from "./components/SidebarSearch";
import { SidebarToggle } from "./components/SidebarToggle";
import { SIDEBAR_SECTIONS } from "./Sidebar.data";
import type { SidebarProps } from "./Sidebar.types";

export function Sidebar({ isCollapsed, onToggle, onNavigate }: SidebarProps) {
	const navigate = useNavigate();

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

				{!isCollapsed && (
					<button
						type="button"
						onClick={() => {
							onNavigate();
							navigate({ to: "/inbox" });
						}}
						className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
					>
						<Plus size={14} />
						<span>Nueva revisión</span>
					</button>
				)}

				{!isCollapsed &&
					SIDEBAR_SECTIONS.map((section) => (
						<SidebarSection
							key={section.id}
							label={section.label}
							items={section.items.map((item) => ({
								icon: <item.icon size={13} />,
								label: item.label,
								to: item.to,
							}))}
							collapsible={section.collapsible}
							defaultCollapsed={section.defaultCollapsed}
							onNavigate={onNavigate}
						/>
					))}

				{!isCollapsed && (
					<div className="border-t border-[var(--border-subtle)]" />
				)}

				<SidebarCaseList isCollapsed={isCollapsed} onNavigate={onNavigate} />
			</nav>

			<SidebarFooter isCollapsed={isCollapsed} onNavigate={onNavigate} />
		</aside>
	);
}
