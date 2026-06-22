/**
 * StatusBadge
 *
 * Opinionated wrapper around Badge for common status display.
 */

import type { BadgeVariant } from "@arkelythex/ui";
import { Badge } from "@arkelythex/ui";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
	status: "success" | "warning" | "danger" | "info" | "neutral" | "pending";
	label?: string;
	dot?: boolean;
	size?: "sm" | "md";
	className?: string;
}

const statusLabelMap: Record<StatusBadgeProps["status"], string> = {
	success: "Éxito",
	warning: "Advertencia",
	danger: "Crítico",
	info: "Información",
	neutral: "Neutral",
	pending: "Pendiente",
};

/** Map StatusBadge status → shared Badge variant */
const statusVariantMap: Record<StatusBadgeProps["status"], BadgeVariant> = {
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
	neutral: "default",
	pending: "outline",
};

export function StatusBadge({
	status,
	label,
	dot = true,
	className,
}: StatusBadgeProps) {
	const variant = statusVariantMap[status];

	return (
		<Badge variant={variant} className={cn(className)}>
			{dot && (
				<span
					className={cn(
						"inline-block h-1.5 w-1.5 rounded-full",
						status === "success" && "bg-[var(--color-success)]",
						status === "warning" && "bg-[var(--color-warning)]",
						status === "danger" && "bg-[var(--color-danger)]",
						status === "info" && "bg-[var(--color-info)]",
						(status === "neutral" || status === "pending") &&
							"bg-[var(--color-text-muted)]",
					)}
					aria-hidden="true"
				/>
			)}
			{label ?? statusLabelMap[status]}
		</Badge>
	);
}
