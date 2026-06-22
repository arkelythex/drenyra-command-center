import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	size?: EmptyStateSize;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	size = "md",
	className,
	...props
}: EmptyStateProps) {
	const sizeStyles = {
		sm: {
			icon: "h-8 w-8",
			container: "gap-[var(--n-gap-sm)]",
			text: "text-sm",
			desc: "text-xs",
		},
		md: {
			icon: "h-10 w-10",
			container: "gap-[var(--n-gap-md)]",
			text: "text-base",
			desc: "text-sm",
		},
		lg: {
			icon: "h-12 w-12",
			container: "gap-[var(--n-gap-lg)]",
			text: "text-lg",
			desc: "text-sm",
		},
	}[size];

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-[var(--n-section)]",
				sizeStyles.container,
				className,
			)}
			role="status"
			{...props}
		>
			{icon && (
				<div
					className={cn(
						"flex items-center justify-center rounded-full bg-[var(--color-surface-3)] p-[var(--n-pad-sm)] text-[var(--color-text-muted)]",
						sizeStyles.icon,
					)}
				>
					{icon}
				</div>
			)}
			<div className="flex flex-col items-center gap-1 text-center">
				<p
					className={cn(
						"font-semibold text-[var(--color-text-primary)]",
						sizeStyles.text,
					)}
				>
					{title}
				</p>
				{description && (
					<p className={cn("text-[var(--color-text-muted)]", sizeStyles.desc)}>
						{description}
					</p>
				)}
			</div>
			{action && <div>{action}</div>}
		</div>
	);
}
