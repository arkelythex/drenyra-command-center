import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { AGENTIC_SECTIONS } from "../AgenticSidebar.data";

interface AgenticSidebarNavItemsProps {
	isCollapsed: boolean;
}

export function AgenticSidebarNavItems({
	isCollapsed,
}: AgenticSidebarNavItemsProps) {
	const navigate = useNavigate();
	const closeSidebar = useAgenticShell((s) => s.setSidebarMobileOpen);

	if (isCollapsed) return null;

	return (
		<nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-4 scrollbar-none">
			{AGENTIC_SECTIONS.map((section) => (
				<div key={section.title}>
					<p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						{section.title}
					</p>
					<div className="space-y-0.5">
						{section.items.map((item) => {
							const ItemIcon = item.icon;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => {
										closeSidebar(false);
										navigate({ to: item.to } as Parameters<typeof navigate>[0]);
									}}
									className={cn(
										"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors",
										"text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
									)}
								>
									<ItemIcon
										size={14}
										className="flex-shrink-0 text-[var(--text-muted)]"
									/>
									<span className="flex-1 truncate">{item.label}</span>
									{item.badge !== undefined && (
										<span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">
											{item.badge}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}
