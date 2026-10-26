import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native `<select>` with the app's field look: 44px tall, a visible
 * chevron and the platform picker on mobile.
 */
export function NativeSelect({
	className,
	children,
	...props
}: NativeSelectProps) {
	return (
		<div className="relative">
			<select
				className={cn(
					"h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-card pr-10 pl-3 text-sm text-foreground",
					"focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			>
				{children}
			</select>
			<ChevronDown
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
			/>
		</div>
	);
}
