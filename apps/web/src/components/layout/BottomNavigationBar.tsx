import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { Link, useLocation } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";

interface NavItem {
	icon: LucideIcon;
	label: string;
	href: string;
	isPrimary?: boolean;
}

interface BottomNavigationBarProps {
	items: NavItem[] | readonly NavItem[];
	className?: string;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
	items,
	className,
}) => {
	const { trigger } = useHaptics();
	const location = useLocation();
	const isItemActive = (href: string) =>
		href === "/"
			? location.pathname === "/"
			: location.pathname === href || location.pathname.startsWith(`${href}/`);

	return (
		<nav
			aria-label="Navegación inferior móvil"
			className={cn(
				"fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 lg:hidden",
				"border-t border-[var(--border-subtle)] bg-[var(--surface-1)]",
				"flex items-end justify-around shadow-sm",
				className,
			)}
		>
			{items.map((item) => {
				const isActive = isItemActive(item.href);
				const Icon = item.icon;

				if (item.isPrimary) {
					return (
						<motion.div
							key={item.href}
							whileTap={{ scale: 0.9 }}
							className="relative"
						>
							<Link
								to={item.href}
								preload="intent"
								onClick={() => trigger("heavy")}
								aria-label={item.label}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm transition-[background-color,box-shadow,transform]",
								)}
							>
								<Icon size={24} strokeWidth={2} />
							</Link>
						</motion.div>
					);
				}

				return (
					<Link
						key={item.href}
						to={item.href}
						preload="intent"
						onClick={() => trigger("light")}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex min-h-11 flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-[background-color,color,transform,opacity] active:scale-95",
							isActive
								? "font-semibold text-[var(--text-primary)]"
								: "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
						)}
					>
						<motion.div
							animate={isActive ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
						>
							<Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
						</motion.div>
						<span
							className={cn(
								"text-2xs tracking-wide transition-[opacity,color]",
								isActive ? "opacity-100" : "opacity-70",
							)}
						>
							{item.label}
						</span>
					</Link>
				);
			})}
		</nav>
	);
};
