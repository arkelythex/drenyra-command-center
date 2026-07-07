import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { AgenticSidebarFooter } from "./components/AgenticSidebarFooter";
import { AgenticSidebarNavItems } from "./components/AgenticSidebarNavItems";
import { AgenticSidebarToggle } from "./components/AgenticSidebarToggle";

/**
 * AgenticSidebar — redesigned sidebar for agentic-first navigation.
 *
 * Shows 3 sections: WORKSPACE, PLATFORM, ORGANIZATION.
 * Collapsible to icon-only mode. Badges for Review Queue and Agents.
 */
export function AgenticSidebar() {
	const isCollapsed = useAgenticShell((s) => s.isSidebarCollapsed);

	return (
		<aside
			className={cn(
				"relative flex h-full flex-col bg-[var(--surface-1)] border-r border-[var(--border-subtle)] transition-[width] duration-200 ease-in-out",
				isCollapsed ? "w-[64px]" : "w-[260px]",
			)}
		>
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
				{!isCollapsed && (
					<span className="text-sm font-semibold text-[var(--text-primary)]">
						Drenyra
					</span>
				)}
				<AgenticSidebarToggle />
			</div>

			<AgenticSidebarNavItems isCollapsed={isCollapsed} />
			<AgenticSidebarFooter isCollapsed={isCollapsed} />
		</aside>
	);
}
