import { Check } from "lucide-react";
import {
	CODEX_LIGHT_THEME,
	DEFAULT_CODEX_THEME,
	useSettings,
} from "@/context/SettingsContext";
import type { CodexThemeSettings } from "@/context/settings.types";
import { cn } from "@/lib/utils";
import {
	THEME_ID,
	THEME_PREFERENCE,
	type ThemePreference,
} from "@/lib/ux-mode";
import { useUIStore } from "@/stores/ui.store";
import { THEME_PRESETS } from "./AppearanceConstants";

export const AtmosphereGrid = () => {
	const { settings, updateSettings } = useSettings();
	const themePreference = useUIStore((state) => state.themePreference);
	const setThemePreference = useUIStore((state) => state.setThemePreference);

	const getCodexThemeForPreference = (
		preference: ThemePreference,
		currentTheme: CodexThemeSettings,
	): CodexThemeSettings => {
		if (preference === THEME_ID.LIGHT) return CODEX_LIGHT_THEME;
		if (preference === THEME_PREFERENCE.SYSTEM) {
			return { ...currentTheme, mode: "system", name: "Drenyra Sistema" };
		}
		return DEFAULT_CODEX_THEME;
	};

	const applyTheme = (preference: ThemePreference) => {
		updateSettings({
			theme:
				preference === THEME_ID.LIGHT
					? "light"
					: preference === THEME_PREFERENCE.SYSTEM
						? "system"
						: "dark",
			codexTheme: getCodexThemeForPreference(preference, settings.codexTheme),
		});
		setThemePreference(preference);
	};

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{THEME_PRESETS.map((option) => {
				const isActive = themePreference === option.id;
				const Icon = option.icon;

				return (
					<button
						key={option.id}
						type="button"
						onClick={() => applyTheme(option.id as ThemePreference)}
						className={cn(
							"group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300",
							isActive
								? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.03] shadow-[0_0_40px_-15px_var(--accent)]"
								: "border-[var(--border)] bg-[var(--ink)]/[0.02] hover:border-[var(--accent)]/20 hover:bg-[var(--ink)]/[0.04]",
						)}
					>
						<div className="flex w-full items-center justify-between">
							<div
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300",
									isActive
										? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
										: "border-[var(--border)] bg-[var(--ink)]/5 text-[var(--ink)]/40",
								)}
							>
								<Icon size={18} strokeWidth={2.5} />
							</div>
							{isActive && (
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--surface)] shadow-lg">
									<Check size={12} strokeWidth={4} />
								</div>
							)}
						</div>

						<div className="space-y-1">
							<h4
								className={cn(
									"text-xs font-black uppercase tracking-widest transition-colors",
									isActive ? "text-[var(--accent)]" : "text-[var(--ink)]/80",
								)}
							>
								{option.label}
							</h4>
							<p className="text-xs leading-relaxed text-[var(--ink)]/40">
								{option.description}
							</p>
						</div>
					</button>
				);
			})}
		</div>
	);
};
