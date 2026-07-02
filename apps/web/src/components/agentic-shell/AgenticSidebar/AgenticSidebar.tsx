import { cn } from "@/lib/utils";
import type { AgenticSidebarProps } from "../AgenticLayout/AgenticLayout.types";
import { AgenticSidebarToggle } from "./components/AgenticSidebarToggle";
import { AgenticSidebarNavItems } from "./components/AgenticSidebarNavItems";
import { AgenticSidebarFooter } from "./components/AgenticSidebarFooter";

export function AgenticSidebar({
	isCollapsed,
	onToggle,
	onNavigate,
	className,
}: AgenticSidebarProps) {
	return (
		<aside
			className={cn(
				"relative flex h-full flex-col bg-[var(--surface-1)] border-r border-[var(--border-subtle)] transition-[width] duration-300 ease-in-out",
				isCollapsed ? "w-[64px]" : "w-[240px]",
				className,
			)}
		>
			{/* Logo area */}
			<div
				className={cn(
					"flex items-center gap-2 border-b border-[var(--border-subtle)]",
					isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3",
				)}
			>
				<span className="text-sm font-bold text-[var(--color-primary)]">
					{isCollapsed ? "D" : "Drenyra"}
				</span>
			</div>

			{/* Navigation */}
			<nav
				className="flex-1 overflow-y-auto pt-3 scrollbar-none"
				aria-label="Agentic navigation"
			>
				<AgenticSidebarNavItems
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
			</nav>

			{/* Toggle */}
			<AgenticSidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />

			{/* Footer */}
			<AgenticSidebarFooter isCollapsed={isCollapsed} />
		</aside>
	);
}
