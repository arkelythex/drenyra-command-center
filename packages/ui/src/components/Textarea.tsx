import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
	return (
		<textarea
			className={cn(
				"flex min-h-[80px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-[var(--n-pad-md)] py-[var(--n-pad-sm)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
				"focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}
