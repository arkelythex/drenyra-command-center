import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	AccentPreset,
	DensityLevel,
} from "@/lib/design-tokens/theme-package.schema";
import {
	normalizeThemePreference,
	syncThemeDocumentState,
	THEME_PREFERENCE,
	type ThemePreference,
	UI_STORAGE_KEY,
} from "@/lib/ux-mode";

interface UIState {
	/** Colour scheme choice, including "system". */
	themePreference: ThemePreference;
	/** `null` keeps the default accent defined in CSS. */
	accentPreference: AccentPreset | null;
	/** `null` keeps the default (normal) density defined in CSS. */
	densityPreference: DensityLevel | null;
	setThemePreference: (preference: ThemePreference) => void;
	setAccentPreference: (accent: AccentPreset | null) => void;
	setDensityPreference: (density: DensityLevel | null) => void;
}

/** Projects the three appearance preferences onto `<html>`. */
function applyAppearance(
	state: Pick<
		UIState,
		"themePreference" | "accentPreference" | "densityPreference"
	>,
): void {
	syncThemeDocumentState(
		state.themePreference,
		undefined,
		state.accentPreference,
		state.densityPreference,
	);
}

/**
 * Single owner of appearance state. Persistence uses `UI_STORAGE_KEY`, the same
 * key `ux-mode` reads before React mounts, so first paint matches the store.
 */
export const useUIStore = create<UIState>()(
	persist(
		(set, get) => ({
			themePreference: THEME_PREFERENCE.SYSTEM,
			accentPreference: null,
			densityPreference: null,
			setThemePreference: (themePreference) => {
				set({ themePreference });
				applyAppearance(get());
			},
			setAccentPreference: (accentPreference) => {
				set({ accentPreference });
				applyAppearance(get());
			},
			setDensityPreference: (densityPreference) => {
				set({ densityPreference });
				applyAppearance(get());
			},
		}),
		{
			name: UI_STORAGE_KEY,
			partialize: (s) => ({
				themePreference: s.themePreference,
				accentPreference: s.accentPreference,
				densityPreference: s.densityPreference,
			}),
			merge: (persisted, current) => {
				const saved = (persisted ?? {}) as Partial<UIState>;
				return {
					...current,
					themePreference: normalizeThemePreference(saved.themePreference),
					accentPreference: saved.accentPreference ?? null,
					densityPreference: saved.densityPreference ?? null,
				};
			},
		},
	),
);
