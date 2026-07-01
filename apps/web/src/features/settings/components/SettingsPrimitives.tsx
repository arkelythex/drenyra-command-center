import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
}

export const SettingsSection = ({
	title,
	description,
	children,
	className,
}: SettingsSectionProps): ReactNode => {
	return (
		<SurfaceCard
			variant="muted"
			padding="lg"
			className={cn(
				"group relative overflow-hidden border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all duration-300",
				className,
			)}
		>
			<div
				aria-hidden="true"
				className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			/>

			<div className="relative mb-4 border-b border-[var(--border-subtle)]/50 pb-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
					{title}
				</h2>
				{description ? (
					<p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
						{description}
					</p>
				) : null}
			</div>
			<div className="relative space-y-4">{children}</div>
		</SurfaceCard>
	);
};

interface SettingsRowProps {
	title: string;
	description?: string;
	action: ReactNode;
	className?: string;
}

export const SettingsRow = ({
	title,
	description,
	action,
	className,
}: SettingsRowProps): ReactNode => {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/30 px-4 py-4 transition-colors duration-200 hover:bg-[var(--surface-1)]/50 sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			<div className="min-w-0">
				<p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
					{title}
				</p>
				{description ? (
					<p className="mt-1 text-xs font-medium leading-relaxed text-[var(--text-secondary)]">
						{description}
					</p>
				) : null}
			</div>
			<div className="flex justify-end sm:min-w-[200px]">{action}</div>
		</div>
	);
};

interface SettingSwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label: string;
	className?: string;
}

export const SettingSwitch = ({
	checked,
	onCheckedChange,
	label,
	className,
}: SettingSwitchProps): ReactNode => {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"group relative inline-flex h-5 w-10 items-center rounded-full border transition-all duration-300 outline-none active:scale-95",
				checked
					? "border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_12px_-2px_var(--accent)]"
					: "border-[var(--border-default)] bg-[var(--surface-2)]/50 hover:border-[var(--border-default)]",
				className,
			)}
		>
			<span
				className={cn(
					"inline-block h-3.5 w-3.5 rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
					checked
						? "translate-x-5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
						: "translate-x-1 bg-[var(--text-tertiary)]",
				)}
			/>
			<span className="sr-only">{checked ? "Activado" : "Desactivado"}</span>
		</button>
	);
};
