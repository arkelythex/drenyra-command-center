import { HardDrive, Cloud, FlaskConical } from "lucide-react";
import type { ThreadEnvironment } from "@drenyra/domain/entities/thread";
import { cn } from "@/lib/utils";

// ─── Options ─────────────────────────────────────────────────────────────────

interface EnvironmentOption {
	value: ThreadEnvironment;
	label: string;
	shortLabel: string;
	icon: React.ElementType;
}

const ENVIRONMENTS: EnvironmentOption[] = [
	{
		value: "local",
		label: "Libros locales",
		shortLabel: "Local",
		icon: HardDrive,
	},
	{
		value: "sandbox",
		label: "Sandbox fiscal",
		shortLabel: "Sandbox",
		icon: FlaskConical,
	},
	{
		value: "cloud",
		label: "Cloud agente",
		shortLabel: "Cloud",
		icon: Cloud,
	},
];

// ─── Component ───────────────────────────────────────────────────────────────

interface EnvironmentSelectorProps {
	value: ThreadEnvironment;
	onChange: (env: ThreadEnvironment) => void;
	disabled?: boolean;
}

export function EnvironmentSelector({
	value,
	onChange,
	disabled = false,
}: EnvironmentSelectorProps) {
	return (
		<div className="flex gap-2">
			{ENVIRONMENTS.map((env) => {
				const Icon = env.icon;
				const isActive = value === env.value;

				return (
					<button
						key={env.value}
						type="button"
						onClick={() => onChange(env.value)}
						disabled={disabled}
						className={cn(
							"flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
							isActive
								? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
								: "border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
							disabled && "cursor-not-allowed opacity-50",
							!disabled && !isActive && "cursor-pointer",
						)}
					>
						<Icon size={16} />
						<span className="hidden sm:inline">{env.label}</span>
						<span className="sm:hidden">{env.shortLabel}</span>
					</button>
				);
			})}
		</div>
	);
}
