import { useNavigate, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
	AGENTIC_NAV_ITEMS,
	AGENTIC_SECTION_CONFIG,
} from "../AgenticSidebar.data";

interface AgenticSidebarNavItemsProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

/** Map section items collapsed state to just the first letter */
function sectionShortLabel(label: string): string {
	return label.charAt(0);
}

export function AgenticSidebarNavItems({
	isCollapsed,
	onNavigate,
}: AgenticSidebarNavItemsProps) {
	const navigate = useNavigate();
	const location = useLocation();

	const sections = ["workspace", "platform", "organization"] as const;

	return (
		<div className="flex-1 overflow-y-auto px-2 scrollbar-none">
			{sections.map((sectionId) => {
				const sectionItems = AGENTIC_NAV_ITEMS.filter(
					(item) => item.section === sectionId,
				);
				const config = AGENTIC_SECTION_CONFIG[sectionId];
				if (sectionItems.length === 0) return null;

				return (
					<div key={sectionId} className="mb-4">
						{!isCollapsed && (
							<div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
								{config.label}
							</div>
						)}
						{isCollapsed && (
							<div className="mb-1 flex justify-center text-[9px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
								{sectionShortLabel(config.label)}
							</div>
						)}

						<div className="space-y-0.5">
							{sectionItems.map((item) => {
								const ItemIcon = item.icon;
								const isActive = location.pathname.startsWith(item.to);

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											onNavigate();
											navigate({ to: item.to as never });
										}}
										className={cn(
											"group flex w-full items-center gap-2 rounded-lg text-left text-xs font-medium transition-colors",
											isCollapsed ? "justify-center px-0 py-2" : "px-2 py-1.5",
											isActive
												? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
												: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
										)}
										title={isCollapsed ? item.label : undefined}
									>
										<div className="relative shrink-0">
											<ItemIcon
												size={isCollapsed ? 18 : 16}
												className={cn(
													"shrink-0",
													isActive
														? "text-[var(--color-primary)]"
														: "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
												)}
											/>
											{/* Active indicator dot for collapsed mode */}
											{isCollapsed && isActive && (
												<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
											)}
										</div>

										{!isCollapsed && (
											<>
												<span className="flex-1">{item.label}</span>
												{item.badge !== undefined && item.badge > 0 && (
													<span
														className={cn(
															"flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none",
															item.badgeVariant === "critical" &&
																"bg-[var(--color-danger)]/20 text-[var(--color-danger)]",
															item.badgeVariant === "warning" &&
																"bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
															(!item.badgeVariant ||
																item.badgeVariant === "info") &&
																"bg-[var(--color-info)]/20 text-[var(--color-info)]",
														)}
													>
														{item.badge > 99 ? "99+" : item.badge}
													</span>
												)}
											</>
										)}

										{/* Collapsed mode: dot badge */}
										{isCollapsed &&
											item.badge !== undefined &&
											item.badge > 0 && (
												<span
													className={cn(
														"absolute right-1 top-1 h-2 w-2 rounded-full",
														item.badgeVariant === "critical" &&
															"bg-[var(--color-danger)]",
														item.badgeVariant === "warning" &&
															"bg-[var(--color-warning)]",
														(!item.badgeVariant ||
															item.badgeVariant === "info") &&
															"bg-[var(--color-info)]",
													)}
												/>
											)}
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
