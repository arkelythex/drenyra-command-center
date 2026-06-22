/**
 * StatCard Molecule - Simple Stat Display 2026
 *
 * Lightweight stat card for dashboard overview strips.
 * Optimized for horizontal layout in summary sections.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Pending"
 *   value={12}
 *   status="warning"
 *   icon={<Clock />}
 * />
 * ```
 */

import { motion } from "framer-motion";
import type * as React from "react";
import { Dot } from "@/components/atoms/dot";
import { Text } from "@/components/atoms/text";
import type { StatusVariant } from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	label: string;
	value: string | number;
	status?: StatusVariant;
	icon?: React.ReactNode;
	trend?: string;
	onClick?: () => void;
	className?: string;
}

function StatCard({
	label,
	value,
	status = "neutral",
	icon,
	trend,
	onClick,
	className,
}: StatCardProps) {
	return (
		<motion.div
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg bg-surface-1 border border-[var(--color-stroke-1)]",
				onClick &&
					"cursor-pointer hover:bg-surface-2 hover:border-[var(--color-stroke-2)] transition-colors",
				className,
			)}
			initial={{ opacity: 0, x: -8 }}
			animate={{ opacity: 1, x: 0 }}
			whileHover={onClick ? { scale: 1.01 } : undefined}
			whileTap={onClick ? { scale: 0.99 } : undefined}
		>
			{icon && (
				<div className="p-2 rounded-lg bg-surface-2 text-muted shrink-0">
					{icon}
				</div>
			)}

			<div className="flex flex-col items-start flex-1 min-w-0">
				<Text variant="caption" muted className="truncate">
					{label}
				</Text>
				<div className="flex items-center gap-2">
					<Text
						variant="h4"
						weight="bold"
						className="text-primary tabular-nums"
					>
						{value}
					</Text>
					{trend && (
						<Text variant="caption" className="text-muted">
							{trend}
						</Text>
					)}
				</div>
			</div>

			<Dot status={status} size="md" />
		</motion.div>
	);
}

export { StatCard };
