import { Monitor, Moon, Palette, Sun } from "lucide-react";
import {
	ACCENT_PRESETS,
	type AccentPreset,
	DENSITY_LEVELS,
	type DensityLevel,
} from "@/lib/design-tokens/theme-package.schema";
import { cn } from "@/lib/utils";
import { THEME_PREFERENCE, type ThemePreference } from "@/lib/ux-mode";
import { useUIStore } from "@/stores/ui.store";
import { SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

const THEME_OPTIONS: {
	value: ThemePreference;
	label: string;
	icon: typeof Sun;
}[] = [
	{ value: THEME_PREFERENCE.SYSTEM, label: "Sistema", icon: Monitor },
	{ value: THEME_PREFERENCE.LIGHT, label: "Claro", icon: Sun },
	{ value: THEME_PREFERENCE.DARK, label: "Oscuro", icon: Moon },
];

const DENSITY_LABELS: Record<DensityLevel, string> = {
	compact: "Compacta",
	normal: "Normal",
	spacious: "Amplia",
};

const optionClass =
	"flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted has-[:checked]:border-ring has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40";

/**
 * Appearance preferences backed by the UI store (theme, accent, density).
 * Uses native radio groups so keyboard and screen-reader behavior comes for free.
 */
export function AppearanceSettings() {
	const themePreference = useUIStore((s) => s.themePreference);
	const accentPreference = useUIStore((s) => s.accentPreference);
	const densityPreference = useUIStore((s) => s.densityPreference);
	const setThemePreference = useUIStore((s) => s.setThemePreference);
	const setAccentPreference = useUIStore((s) => s.setAccentPreference);
	const setDensityPreference = useUIStore((s) => s.setDensityPreference);

	return (
		<SettingsShell
			title="Apariencia"
			description="Elige el tema, el color de acento y la densidad de la interfaz. Los cambios se aplican al instante y se guardan en este navegador."
			icon={Palette}
		>
			<SettingsSection title="Tema">
				<fieldset className="flex flex-wrap gap-2 p-4">
					<legend className="sr-only">Tema</legend>
					{THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
						<label key={value} className={optionClass}>
							<input
								type="radio"
								name="theme"
								value={value}
								checked={themePreference === value}
								onChange={() => setThemePreference(value)}
								className="sr-only"
							/>
							<Icon aria-hidden="true" className="size-4" />
							{label}
						</label>
					))}
				</fieldset>
			</SettingsSection>

			<SettingsSection
				title="Color de acento"
				description="Se usa en acciones principales y en la navegación activa."
			>
				<fieldset className="flex flex-wrap gap-2 p-4">
					<legend className="sr-only">Color de acento</legend>
					<label className={optionClass}>
						<input
							type="radio"
							name="accent"
							checked={accentPreference === null}
							onChange={() => setAccentPreference(null)}
							className="sr-only"
						/>
						Predeterminado
					</label>
					{ACCENT_PRESETS.map((accent: AccentPreset) => (
						<label key={accent} className={cn(optionClass, "capitalize")}>
							<input
								type="radio"
								name="accent"
								value={accent}
								checked={accentPreference === accent}
								onChange={() => setAccentPreference(accent)}
								className="sr-only"
							/>
							{/* data-accent-swatch re-scopes --primary to this accent (see index.css). */}
							<span
								aria-hidden="true"
								data-accent-swatch={accent}
								className="size-4 rounded-full border border-border bg-[var(--primary)]"
							/>
							{accent}
						</label>
					))}
				</fieldset>
			</SettingsSection>

			<SettingsSection title="Densidad">
				<fieldset className="flex flex-wrap gap-2 p-4">
					<legend className="sr-only">Densidad</legend>
					{DENSITY_LEVELS.map((density) => (
						<label key={density} className={optionClass}>
							<input
								type="radio"
								name="density"
								value={density}
								checked={(densityPreference ?? "normal") === density}
								onChange={() => setDensityPreference(density)}
								className="sr-only"
							/>
							{DENSITY_LABELS[density]}
						</label>
					))}
				</fieldset>
			</SettingsSection>
		</SettingsShell>
	);
}
