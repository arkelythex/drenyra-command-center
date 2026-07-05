import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

interface SettingsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	size?: "xs" | "sm" | "md";
	active?: boolean;
	/** React 19 — ref es prop regular */
	ref?: Ref<HTMLButtonElement>;
}

export function SettingsButton({
	ref,
	className,
	variant = "secondary",
	size = "sm",
	active,
	children,
	...props
}: SettingsButtonProps) {
	const variants = {
		primary:
			"bg-[var(--accent)] text-[var(--surface)] border-[var(--accent)]/20 hover:opacity-90 shadow-[0_0_20px_-5px_var(--accent)]",
		secondary:
			"bg-[var(--ink)]/[0.03] text-[var(--ink)]/70 border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--ink)]/[0.06] hover:text-[var(--ink)]",
		ghost:
			"bg-transparent text-[var(--ink)]/40 border-transparent hover:text-[var(--ink)]/80 hover:bg-[var(--ink)]/5",
		danger:
			"text-[var(--diff-removed)] border-[var(--diff-removed)]/20 bg-[var(--diff-removed)]/10 hover:bg-[var(--diff-removed)]/20",
	};

	const sizes = {
		xs: "px-2.5 py-1 text-xs",
		sm: "px-4 py-2 text-xs",
		md: "px-6 py-3 text-xs",
	};

	return (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center rounded-xl border font-black uppercase tracking-[0.15em] transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
				variants[variant],
				sizes[size],
				active &&
					"border-[var(--accent)]/40 bg-[var(--accent)]/[0.05] text-[var(--accent)]",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

export const SettingsActionCard = ({
	children,
	onClick,
	active,
	className,
}: {
	children: ReactNode;
	onClick?: () => void;
	active?: boolean;
	className?: string;
}) => (
	<button
		onClick={onClick}
		className={cn(
			"group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
			active
				? "border-[var(--accent)]/30 bg-[var(--accent)]/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
				: "border-[var(--border)] bg-[var(--ink)]/[0.01] hover:border-[var(--accent)]/20 hover:bg-[var(--ink)]/[0.03]",
			className,
		)}
	>
		{children}
		{active && (
			<div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
		)}
	</button>
);
