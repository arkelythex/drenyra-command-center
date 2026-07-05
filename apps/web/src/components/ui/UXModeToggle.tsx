import { Check, Monitor, Moon, SunMedium } from "lucide-react";
import type { ReactNode } from "react";
import {
	ACCENT_PRESETS,
	type AccentPreset,
	DENSITY_LEVELS,
	type DensityLevel,
} from "@/lib/design-tokens/theme-package.schema";
import { cn } from "@/lib/utils";
import { THEME_PREFERENCE, type ThemePreference } from "@/lib/ux-mode";
import { useUIStore } from "@/store/ui-store";

const MODE_OPTIONS: {
	value: ThemePreference;
	icon: ReactNode;
	label: string;
}[] = [
	{
		value: THEME_PREFERENCE.LIGHT,
		icon: <SunMedium size={14} />,
		label: "Light",
	},
	{
		value: THEME_PREFERENCE.SYSTEM,
		icon: <Monitor size={14} />,
		label: "Sistema",
	},
	{
		value: THEME_PREFERENCE.DARK,
		icon: <Moon size={14} />,
		label: "Dark",
	},
];

const ACCENT_LABELS: Record<AccentPreset, string> = {
	ember: "Ember",
	cocoa: "Cocoa",
	terracotta: "Terracotta",
	teal: "Teal",
	steel: "Steel",
	sage: "Sage",
	lavender: "Lavender",
	maple: "Maple",
};

const ACCENT_COLORS: Record<AccentPreset, string> = {
	ember: "#d99555",
	cocoa: "#824f16",
	terracotta: "#c96a45",
	teal: "#0f6570",
	steel: "#5f95ca",
	sage: "#4db35f",
	lavender: "#7d6db5",
	maple: "#d4506b",
};

const DENSITY_LABELS: Record<DensityLevel, string> = {
	compact: "Compacto",
	normal: "Normal",
	spacious: "Espacioso",
};

function SectionLabel({ children }: { children: ReactNode }) {
	return (
		<p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			{children}
		</p>
	);
}

export function UXModeToggle() {
	const themePreference = useUIStore((s) => s.themePreference);
	const setThemePreference = useUIStore((s) => s.setThemePreference);
	const accentPreference = useUIStore((s) => s.accentPreference);
	const setAccentPreference = useUIStore((s) => s.setAccentPreference);
	const densityPreference = useUIStore((s) => s.densityPreference);
	const setDensityPreference = useUIStore((s) => s.setDensityPreference);

	return (
		<div className="flex flex-col gap-5 min-w-56">
			{/* ── Theme Mode ── */}
			<div className="space-y-2">
				<SectionLabel>Modo</SectionLabel>
				<div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-0.5">
					{MODE_OPTIONS.map((opt) => {
						const isActive = themePreference === opt.value;
						return (
							<button
								type="button"
								key={opt.value}
								onClick={() => setThemePreference(opt.value)}
								className={cn(
									"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150",
									isActive
										? "bg-[var(--accent)] text-[var(--color-bg-0)] shadow-sm"
										: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
								)}
								title={opt.label}
							>
								{opt.icon}
								<span>{opt.label}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* ── Accent Color ── */}
			<div className="space-y-2">
				<SectionLabel>Acento</SectionLabel>
				<div className="grid grid-cols-4 gap-1.5">
					{ACCENT_PRESETS.map((accent) => {
						const isActive = accentPreference === accent;
						return (
							<button
								type="button"
								key={accent}
								onClick={() => setAccentPreference(accent)}
								className={cn(
									"flex flex-col items-center gap-1 rounded-lg border p-2 transition-all duration-200",
									"hover:scale-110 hover:shadow-[0_0_10px_var(--accent)]",
									isActive
										? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm"
										: "border-transparent hover:border-[var(--border-subtle)]",
								)}
								title={ACCENT_LABELS[accent]}
								style={
									{ "--accent": ACCENT_COLORS[accent] } as React.CSSProperties
								}
								aria-label={`Accent color: ${ACCENT_LABELS[accent]}`}
								aria-pressed={isActive}
							>
								<span className="relative block size-4">
									<span
										className={cn(
											"block size-4 rounded-full ring-1 ring-inset ring-black/10 transition-all duration-200",
											isActive &&
												"ring-2 ring-offset-1 ring-[var(--accent)] scale-110",
										)}
										style={{ backgroundColor: ACCENT_COLORS[accent] }}
									/>
									{isActive && (
										<Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-sm" />
									)}
								</span>
								<span
									className={cn(
										"text-[10px] font-medium leading-none",
										isActive
											? "text-[var(--text-primary)]"
											: "text-[var(--text-muted)]",
									)}
								>
									{ACCENT_LABELS[accent]}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* ── UI Density ── */}
			<div className="space-y-2">
				<SectionLabel>Densidad</SectionLabel>
				<div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-0.5">
					{DENSITY_LEVELS.map((density) => {
						const isActive = densityPreference === density;
						return (
							<button
								type="button"
								key={density}
								onClick={() => setDensityPreference(density)}
								className={cn(
									"flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150",
									isActive
										? "bg-[var(--accent)] text-[var(--color-bg-0)] shadow-sm"
										: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
								)}
							>
								{DENSITY_LABELS[density]}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
