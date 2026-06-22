import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface UnreconciledBadgeProps {
	count: number;
	variant?: "default" | "compact" | "pill";
	showIcon?: boolean;
	className?: string;
}

export const UnreconciledBadge = ({
	count,
	variant = "default",
	showIcon = true,
	className,
}: UnreconciledBadgeProps) => {
	if (count === 0) return null;

	const baseStyles =
		"font-bold uppercase tracking-widest transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200";

	const variants = {
		default: cn(
			"flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
			"border border-warning-subtle bg-warning-subtle text-xs text-warning",
		),
		compact: cn(
			"flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full",
			"bg-warning text-2xs text-[var(--color-text-inverse)] shadow-sm",
		),
		pill: cn(
			"flex items-center gap-1 px-2 py-0.5 rounded-full",
			"border border-warning-muted bg-warning-muted text-2xs text-warning",
		),
	};

	if (variant === "compact") {
		return (
			<span className={cn(variants.compact, className)}>
				{count > 99 ? "99+" : count}
			</span>
		);
	}

	return (
		<div className={cn(variants[variant], baseStyles, className)}>
			{showIcon && <AlertCircle size={12} className="shrink-0" />}
			<span>
				{count} pendiente{count !== 1 ? "s" : ""}
			</span>
		</div>
	);
};
