import { isNavigationItemActive, type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "./NavItem";

/**
 * Shared section wrapper for grouped navigation links.
 */
export interface NavSectionProps {
	label: string;
	items: readonly NavigationItem[];
	pathname: string;
	isCollapsed?: boolean;
	onItemClick?: (item: NavigationItem) => void;
	className?: string;
	compact?: boolean;
	getBadge?: (item: NavigationItem) => string | undefined;
}

/**
 * Renders a labeled nav section with active-state aware heading and item list.
 */
export function NavSection({
	label,
	items,
	pathname,
	isCollapsed = false,
	onItemClick,
	className,
	compact = false,
	getBadge,
}: NavSectionProps) {
	if (items.length === 0) return null;

	const headingId = `nav-section-${label.toLowerCase().replace(/\s+/g, "-")}`;
	const hasActiveItem = items.some((item) =>
		isNavigationItemActive(pathname, item),
	);

	return (
		<section
			className={cn(isCollapsed ? "space-y-2" : "space-y-1.5", className)}
			aria-labelledby={headingId}
		>
			{!isCollapsed ? (
				<div className="px-2.5">
					<h3
						id={headingId}
						className={cn(
							"text-2xs font-semibold uppercase tracking-[0.05em]",
							hasActiveItem
								? "text-[var(--text-primary)]"
								: "text-[var(--text-muted)]",
						)}
					>
						{label}
					</h3>
				</div>
			) : (
				<h3 id={headingId} className="sr-only">
					{label}
				</h3>
			)}

			<div
				className={cn(
					"flex flex-col",
					isCollapsed ? "items-center gap-2" : "gap-0.5",
				)}
			>
				{items.map((item) => (
					<NavItem
						key={item.id}
						item={item}
						isActive={isNavigationItemActive(pathname, item)}
						isCollapsed={isCollapsed}
						variant={
							isCollapsed
								? "sidebarCollapsed"
								: compact
									? "settings"
									: "sidebar"
						}
						onClick={onItemClick}
						badge={getBadge?.(item)}
					/>
				))}
			</div>
		</section>
	);
}
