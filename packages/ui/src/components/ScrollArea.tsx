import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
	return (
		<div
			className={cn(
				"overflow-auto",
				"[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
				"[&::-webkit-scrollbar-track]:bg-transparent",
				"[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)]",
				"[&::-webkit-scrollbar-thumb]:hover:bg-[var(--color-border-strong)]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
