import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";
export type AccentPreset =
	| "voltage"
	| "ember"
	| "cocoa"
	| "terracotta"
	| "teal"
	| "steel"
	| "sage"
	| "lavender"
	| "maple";
export type Density = "compact" | "normal" | "spacious";

interface UIState {
	// Theme
	theme: Theme;
	accentPreset: AccentPreset;
	setTheme: (theme: Theme) => void;
	setAccentPreset: (preset: AccentPreset) => void;

	// Layout
	isRightRailOpen: boolean;
	toggleRightRail: () => void;
	setRightRailOpen: (open: boolean) => void;

	// Density
	density: Density;
	setDensity: (density: Density) => void;

	// Complexity
	complexityLevel: "basic" | "intermediate" | "advanced";
	setComplexityLevel: (level: "basic" | "intermediate" | "advanced") => void;

	// Sidebar
	isSidebarCollapsed: boolean;
	toggleSidebar: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			theme: "dark",
			accentPreset: "ember",
			setTheme: (theme) => {
				document.documentElement.classList.toggle("light", theme === "light");
				document.documentElement.classList.toggle("dark", theme === "dark");
				set({ theme });
			},
			setAccentPreset: (preset) => {
				document.documentElement.setAttribute("data-accent", preset);
				set({ accentPreset: preset });
			},

			isRightRailOpen: false,
			toggleRightRail: () =>
				set((s) => ({ isRightRailOpen: !s.isRightRailOpen })),
			setRightRailOpen: (open) => set({ isRightRailOpen: open }),

			density: "normal",
			setDensity: (density) => {
				document.documentElement.setAttribute("data-density", density);
				set({ density });
			},

			complexityLevel: "advanced",
			setComplexityLevel: (level) => set({ complexityLevel: level }),

			isSidebarCollapsed: false,
			toggleSidebar: () =>
				set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
			setSidebarCollapsed: (collapsed) =>
				set({ isSidebarCollapsed: collapsed }),
		}),
		{ name: "drenyra-ui-store" },
	),
);
