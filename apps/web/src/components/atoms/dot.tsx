/**
 * Dot Atom - Status Indicator 2026
 *
 * Minimal status indicator for inline use.
 */

import { motion } from "framer-motion";
import type { StatusVariant } from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export type DotSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<DotSize, string> = {
	xs: "h-1 w-1",
	sm: "h-1.5 w-1.5",
	md: "h-2 w-2",
	lg: "h-3 w-3",
};

const colorMap: Record<StatusVariant, string> = {
	success: "bg-[rgb(var(--premium-success-rgb))]",
	warning: "bg-[rgb(var(--premium-warning-rgb))]",
	danger: "bg-[rgb(var(--premium-danger-rgb))]",
	info: "bg-[rgb(var(--premium-info-rgb))]",
	neutral: "bg-secondary",
};

const shadowMap: Record<StatusVariant, string> = {
	success: "shadow-[0_0_6px_rgba(var(--premium-success-rgb),0.6)]",
	warning: "shadow-[0_0_6px_rgba(var(--premium-warning-rgb),0.6)]",
	danger: "shadow-[0_0_6px_rgba(var(--premium-danger-rgb),0.6)]",
	info: "shadow-[0_0_6px_rgba(var(--premium-info-rgb),0.6)]",
	neutral: "",
};

export interface DotProps {
	status?: StatusVariant;
	size?: DotSize;
	pulse?: boolean;
	className?: string;
}

function Dot({ status = "neutral", size = "sm", pulse, className }: DotProps) {
	return (
		<motion.span
			className={cn(
				"rounded-full inline-block",
				sizeMap[size],
				colorMap[status],
				shadowMap[status],
				className,
			)}
			animate={
				pulse
					? {
							scale: [1, 1.2, 1],
							opacity: [1, 0.7, 1],
						}
					: undefined
			}
			transition={
				pulse
					? {
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}
					: undefined
			}
			role="status"
			aria-label={`Status: ${status}`}
		/>
	);
}

export { Dot };
