import type { ReactNode } from "react";
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
		<section className={cn("space-y-3", className)}>
			<div className="space-y-1">
				<h2 className="text-base font-medium tracking-tight text-foreground">
					{title}
				</h2>
				{description ? (
					<p className="text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{/* Grouped list: rows are separated by hairlines, not nested cards. */}
			<div className="divide-y divide-border rounded-xl border border-border bg-card">
				{children}
			</div>
		</section>
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
				"flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
				className,
			)}
		>
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground">{title}</p>
				{description ? (
					<p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			<div className="flex shrink-0 sm:justify-end">{action}</div>
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
			// 44px hit area around a 24px track.
			className={cn(
				"group inline-flex size-11 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
				className,
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200",
					checked ? "bg-brand" : "bg-muted ring-1 ring-inset ring-border",
				)}
			>
				<span
					className={cn(
						"inline-block size-5 rounded-full bg-background shadow-sm transition-transform duration-200",
						checked ? "translate-x-[18px]" : "translate-x-0.5",
					)}
				/>
			</span>
		</button>
	);
};
