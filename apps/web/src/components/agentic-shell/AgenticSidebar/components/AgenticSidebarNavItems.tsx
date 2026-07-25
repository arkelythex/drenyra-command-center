import { useLocation, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { createElement } from "react";
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
	const { pathname } = useLocation();

	if (isCollapsed) return null;

	return (
		<nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-4 scrollbar-none">
			<div className="space-y-2">
				<button
					type="button"
					onClick={() => {
						closeSidebar(false);
						navigate({ to: "/drenyra" } as Parameters<typeof navigate>[0]);
					}}
					className="flex w-full items-center gap-2 rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-left text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
				>
					<Plus size={14} className="text-[var(--color-primary)]" />
					<span>Nueva revisión fiscal</span>
				</button>
				<button
					type="button"
					onClick={() => {
						closeSidebar(false);
						navigate({ to: "/drenyra" } as Parameters<typeof navigate>[0]);
					}}
					className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
				>
					<Search size={14} className="text-[var(--text-muted)]" />
					<span>Buscar en Drenyra</span>
				</button>
			</div>

			{AGENTIC_SECTIONS.map((section) => (
				<div key={section.title}>
					<p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						{section.title}
					</p>
					<div className="space-y-0.5">
						{section.items.map((item) => {
							const isActive =
								pathname === item.to || pathname.startsWith(`${item.to}/`);
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => {
										closeSidebar(false);
										navigate({ to: item.to } as Parameters<typeof navigate>[0]);
									}}
									className={cn(
										"flex w-full items-center gap-2 rounded-lg border-l-2 px-2 py-1.5 text-left text-xs font-medium transition-colors",
										isActive
											? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--text-primary)]"
											: "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
									)}
								>
									{createElement(item.icon, {
										size: 14,
										className: cn(
											"flex-shrink-0",
											isActive
												? "text-[var(--color-primary)]"
												: "text-[var(--text-muted)]",
										),
									})}
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
