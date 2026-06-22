import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-3)]",
				className,
			)}
			{...props}
		/>
	);
}
