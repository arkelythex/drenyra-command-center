"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/hooks/use-count-up";

export interface StatCardProps {
	value: ReactNode;
	/** Optional numeric value for count-up animation */
	numericValue?: number;
	/** Optional format template for animated count (e.g. "99.97%", "10M+") */
	formatTemplate?: string;
	label: string;
	sublabel?: string;
	className?: string;
}

/**
 * Card para mostrar estadísticas/métricas con optional count-up animation.
 * When numericValue is provided, animates from 0 to the target when scrolled into view.
 * RSC-compatible.
 */
function formatCountUp(template: string, count: number): string {
	if (template.includes("M+")) return `${count}M+`;
	if (template.includes("+") && !template.includes("%")) return `${count}+`;
	if (template.includes("%")) {
		if (template.includes(".")) return `${(count / 100).toFixed(2)}%`;
		return `${count}%`;
	}
	return String(count);
}

export function StatCard({
	value,
	numericValue,
	formatTemplate,
	label,
	sublabel,
	className,
}: StatCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-50px" });
	const hasStartedRef = useRef(false);

	// Only animate if we have a numeric value
	const shouldAnimate = numericValue !== undefined;
	const { count, isRunning, start } = useCountUp({
		end: numericValue ?? 0,
		duration: 2000,
		startOnMount: false,
	});

	// Trigger count-up when section enters viewport
	useEffect(() => {
		if (isInView && shouldAnimate && !hasStartedRef.current) {
			hasStartedRef.current = true;
			start();
		}
	}, [isInView, shouldAnimate, start]);

	// Determine display value: use animated count if counting up, otherwise use static value
	const displayValue: ReactNode =
		shouldAnimate && formatTemplate
			? formatCountUp(formatTemplate, count)
			: value;

	return (
		<div
			ref={ref}
			className={cn(
				"rounded-xl border border-border bg-surface/50 p-4 text-center sm:rounded-2xl sm:p-5",
				className,
			)}
		>
			<motion.div
				className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl tabular-nums"
				initial={shouldAnimate ? { opacity: 0 } : undefined}
				animate={
					shouldAnimate && (isRunning || count > 0) ? { opacity: 1 } : undefined
				}
				transition={{ duration: 0.3 }}
			>
				{displayValue}
			</motion.div>
			<div className="text-xs text-muted-foreground sm:text-sm">{label}</div>
			{sublabel && (
				<div className="mt-1 text-2xs text-section-label sm:text-xs">
					{sublabel}
				</div>
			)}
		</div>
	);
}
