import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Variants for shared navigation item sizing/layout.
 */
type NavItemVariant = "sidebar" | "sidebarCollapsed" | "settings" | "mobile";

/**
 * Shared navigation item primitive used across sidebar/settings/mobile contexts.
 */
export interface NavItemProps {
	item: NavigationItem;
	isActive: boolean;
	isCollapsed?: boolean;
	variant?: NavItemVariant;
	onClick?: (item: NavigationItem) => undefined | false;
	badge?: string;
	className?: string;
}

const iconSizes: Record<NavItemVariant, number> = {
	sidebar: 16,
	sidebarCollapsed: 16,
	settings: 16,
	mobile: 18,
};

function getContainerClasses(
	variant: NavItemVariant,
	isCollapsed: boolean,
): string {
	if (variant === "sidebarCollapsed" || isCollapsed) {
		return "mx-auto h-9 w-9 justify-center px-0";
	}

	if (variant === "settings") {
		return "h-10 w-full justify-start gap-2.5 px-3";
	}

	if (variant === "mobile") {
		return "h-10 w-full justify-start gap-3 px-3";
	}

	return "h-9 w-full justify-start gap-2.5 px-3";
}

/**
 * Renders a semantic navigation link with active/focus states and optional badge.
 */
export function NavItem({
	item,
	isActive,
	isCollapsed = false,
	variant = "sidebar",
	onClick,
	badge,
	className,
}: NavItemProps) {
	const Icon: LucideIcon = item.icon;

	return (
		<Link
			to={item.to}
			preload="intent"
			onClick={(e) => {
				const result = onClick?.(item);
				if (result === false) {
					e.preventDefault();
				}
			}}
			aria-current={isActive ? "page" : undefined}
			title={isCollapsed ? item.label : undefined}
			className={cn(
				"group relative flex items-center overflow-hidden rounded-lg transition-[background-color,color,box-shadow] duration-150",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
				getContainerClasses(variant, isCollapsed),
				isActive
					? "bg-[var(--surface-1)] text-[var(--text-primary)]"
					: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
				className,
			)}
		>
			<div
				className={cn(
					"relative z-10 flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150",
					isActive
						? "text-[var(--text-primary)]"
						: "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]",
				)}
			>
				<Icon
					size={iconSizes[variant]}
					strokeWidth={1.5}
					className="shrink-0"
				/>
			</div>

			{!isCollapsed ? (
				<div className="relative z-10 flex min-w-0 flex-1 items-center gap-2">
					<span
						className={cn(
							"min-w-0 flex-1 truncate text-[13px] font-medium transition-colors duration-150",
							isActive
								? "text-[var(--text-primary)]"
								: "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
						)}
					>
						{item.label}
					</span>
					{badge ? (
						<span
							className={cn(
								"mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-3xs font-medium tracking-[0.04em]",
								isActive
									? "bg-[var(--surface-1)] text-[var(--text-secondary)]"
									: "bg-[var(--surface-2)] text-[var(--text-tertiary)]",
							)}
						>
							{badge}
						</span>
					) : null}
				</div>
			) : null}
		</Link>
	);
}
