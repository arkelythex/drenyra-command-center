import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	applyAccentToDocument,
	applyDensityToDocument,
} from "@/lib/design-tokens/theme-package";
import type {
	AccentPreset,
	ArkelythexThemePackage,
	DensityLevel,
} from "@/lib/design-tokens/theme-package.schema";
import {
	normalizeThemePreference,
	syncThemeDocumentState,
	type ThemePreference,
} from "@/lib/ux-mode";

/**
 * @fileoverview Store de UI para Arkelythex Core (2026)
 * Gestiona el modo de experiencia visual (claro vs oscuro)
 * Y el nivel de complejidad (Basic/Advanced/Expert)
 */

/**
 * Progressive Disclosure Levels - ARKELYTHEX v2
 * - Basic: Solo KPIs y acciones principales (contador público)
 * - Advanced: Métricas, gráficos, panel de decisiones (contador senior)
 * - Expert: Todo + detalles técnicos, logs, debug (CFO/IT)
 */
export type ComplexityLevel = "basic" | "advanced" | "expert";

export type SwarmMode = "auto" | "ledger" | "sire" | "analysis";

export type RightPanelTab = "diff" | "artifact" | "details" | "reports" | "kpi";

interface UIState {
	themePreference: ThemePreference;
	customThemePackage: ArkelythexThemePackage | null;
	accentPreference: AccentPreset;
	densityPreference: DensityLevel;
	complexityLevel: ComplexityLevel;
	isSidebarOpen: boolean;
	isRightRailOpen: boolean;
	terminalOpen: boolean;
	rightPanelTab: RightPanelTab;
	commandPaletteOpen: boolean;
	swarmMode: SwarmMode;
	setThemePreference: (mode: ThemePreference) => void;
	setCustomThemePackage: (themePackage: ArkelythexThemePackage | null) => void;
	setAccentPreference: (accent: AccentPreset) => void;
	setDensityPreference: (density: DensityLevel) => void;
	setComplexityLevel: (level: ComplexityLevel) => void;
	toggleSidebar: () => void;
	toggleRightRail: () => void;
	setRightRailOpen: (open: boolean) => void;
	toggleTerminal: () => void;
	setRightPanelTab: (tab: RightPanelTab) => void;
	setCommandPaletteOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
	setSwarmMode: (mode: SwarmMode) => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set, get) => ({
			themePreference: "mono-dark",
			customThemePackage: null,
			accentPreference: "voltage",
			densityPreference: "normal",
			complexityLevel: "advanced",
			isSidebarOpen: true,
			isRightRailOpen: false,
			terminalOpen: false,
			rightPanelTab: "diff",
			commandPaletteOpen: false,
			swarmMode: "auto",

			setThemePreference: (themePreference) => {
				syncThemeDocumentState(
					themePreference,
					get().customThemePackage,
					get().accentPreference,
					get().densityPreference,
				);
				set({ themePreference });
			},

			setCustomThemePackage: (customThemePackage) => {
				const nextPreference = customThemePackage ? "custom" : "mono-dark";
				syncThemeDocumentState(
					nextPreference,
					customThemePackage,
					get().accentPreference,
					get().densityPreference,
				);
				set({ customThemePackage, themePreference: nextPreference });
			},

			setAccentPreference: (accentPreference) => {
				applyAccentToDocument(accentPreference);
				set({ accentPreference });
			},

			setDensityPreference: (densityPreference) => {
				applyDensityToDocument(densityPreference);
				set({ densityPreference });
			},

			setComplexityLevel: (level) => set({ complexityLevel: level }),

			toggleSidebar: () =>
				set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

			toggleRightRail: () =>
				set((state) => ({ isRightRailOpen: !state.isRightRailOpen })),

			setRightRailOpen: (open) => set({ isRightRailOpen: open }),

			toggleTerminal: () =>
				set((state) => ({ terminalOpen: !state.terminalOpen })),

			setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

			setCommandPaletteOpen: (open) =>
				set((state) => ({
					commandPaletteOpen:
						typeof open === "function" ? open(state.commandPaletteOpen) : open,
				})),

			setSwarmMode: (mode) => set({ swarmMode: mode }),
		}),
		{
			name: "arkelythex-ui-storage",
			storage: createJSONStorage(() => window.localStorage),
			migrate: (persistedState) => {
				if (!persistedState || typeof persistedState !== "object") {
					return {
						themePreference: "mono-dark" as ThemePreference,
						customThemePackage: null,
						accentPreference: "ember" as AccentPreset,
						densityPreference: "normal" as DensityLevel,
						complexityLevel: "advanced" as ComplexityLevel,
						isSidebarOpen: true,
						isRightRailOpen: false,
						terminalOpen: false,
						rightPanelTab: "diff",
						commandPaletteOpen: false,
						swarmMode: "auto",
					};
				}

				const state = persistedState as Partial<UIState> & {
					uxMode?: unknown;
				};
				const customThemePackage = state.customThemePackage ?? null;

				return {
					...state,
					customThemePackage,
					themePreference: normalizeThemePreference(
						state.themePreference ?? state.uxMode,
					),
					accentPreference: state.accentPreference ?? ("ember" as AccentPreset),
					densityPreference:
						state.densityPreference ?? ("normal" as DensityLevel),
					complexityLevel: state.complexityLevel ?? "advanced",
					isSidebarOpen: state.isSidebarOpen ?? true,
					isRightRailOpen: state.isRightRailOpen ?? false,
					terminalOpen: state.terminalOpen ?? false,
					rightPanelTab: state.rightPanelTab ?? "diff",
					commandPaletteOpen: state.commandPaletteOpen ?? false,
					swarmMode: state.swarmMode ?? "auto",
				};
			},
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				const normalizedPreference = normalizeThemePreference(
					state.themePreference,
				);
				if (state.themePreference !== normalizedPreference) {
					state.themePreference = normalizedPreference;
				}
				syncThemeDocumentState(
					normalizedPreference,
					state.customThemePackage,
					state.accentPreference,
					state.densityPreference,
				);
			},
		},
	),
);
