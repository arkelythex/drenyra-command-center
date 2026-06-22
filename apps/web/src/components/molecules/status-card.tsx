/**
 * StatusCard Molecule - Composed Status Display 2026
 *
 * Combines Card, Badge, and Text atoms into a cohesive status indicator.
 * Reduces cognitive load by providing a single component for status display.
 *
 * @example
 * ```tsx
 * <StatusCard
 *   title="Compliance Status"
 *   status="success"
 *   message="All documents validated"
 *   icon={<CheckCircle />}
 * />
 * ```
 */

import { motion } from "framer-motion";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Dot } from "@/components/atoms/dot";
import { Text } from "@/components/atoms/text";
import type { StatusVariant } from "@/lib/design-tokens/semantic-tokens";
import { semanticTokens } from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export interface StatusCardProps {
	title: string;
	status?: StatusVariant;
	message?: string;
	description?: string;
	icon?: React.ReactNode;
	trend?: "up" | "down" | "stable";
	trendValue?: string;
	actions?: React.ReactNode;
	compact?: boolean;
	className?: string;
}

function StatusCard({
	title,
	status = "neutral",
	message,
	description,
	icon,
	trend,
	trendValue,
	actions,
	compact,
	className,
}: StatusCardProps) {
	const tokens = semanticTokens.status[status];

	return (
		<motion.div
			className={cn(
				"rounded-xl border p-4 transition-[background-color,border-color,box-shadow,transform,opacity] duration-200",
				tokens.bgSubtle,
				tokens.border,
				!compact && "hover:shadow-lg",
				className,
			)}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3">
					{icon && <div className={cn("mt-0.5", tokens.text)}>{icon}</div>}

					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Text variant="label" weight="semibold" className="text-primary">
								{title}
							</Text>
							<Dot
								status={status}
								size="sm"
								pulse={status === "warning" || status === "danger"}
							/>
						</div>

						{message && (
							<Text variant="caption" className={tokens.text}>
								{message}
							</Text>
						)}

						{description && !compact && (
							<Text variant="caption" muted>
								{description}
							</Text>
						)}
					</div>
				</div>

				<div className="flex flex-col items-end gap-2">
					<Badge status={status} size="xs" variant="soft" dot>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Badge>

					{trend && trendValue && (
						<Text
							variant="caption"
							className={cn(
								"flex items-center gap-1",
								trend === "up" && "text-[rgb(var(--premium-success-rgb))]",
								trend === "down" && "text-[rgb(var(--premium-danger-rgb))]",
								trend === "stable" && "text-muted",
							)}
						>
							{trend === "up" && "↑"}
							{trend === "down" && "↓"}
							{trend === "stable" && "→"}
							{trendValue}
						</Text>
					)}
				</div>
			</div>

			{actions && !compact && (
				<div className="mt-4 pt-3 border-t border-[var(--color-stroke-1)] flex items-center gap-2">
					{actions}
				</div>
			)}
		</motion.div>
	);
}

export { StatusCard };
