import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { captureError } from "@/lib/monitoring";
import {
	getResolvedColorScheme,
	getResolvedThemeId,
	THEME_PREFERENCE,
	type ThemePreference,
} from "@/lib/ux-mode";
import { useUIStore } from "@/store/ui-store";
import type { AppSettings, CodexThemeSettings } from "./settings.types";

const THEME_BRIDGE: Record<string, ThemePreference> = {
	light: "mono-light" as ThemePreference,
	dark: "mono-dark" as ThemePreference,
	system: THEME_PREFERENCE.SYSTEM,
	auto: THEME_PREFERENCE.SYSTEM,
};

interface SettingsContextType {
	settings: AppSettings;
	resolvedTheme: "light" | "dark";
	updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined,
);

export const DEFAULT_CODEX_THEME: CodexThemeSettings = {
	version: "codex-theme-v1",
	name: "Drenyra Dark",
	mode: "dark",
	tokens: {
		accent: "#3CE6D8",
		surface: "#0B0E11",
		surfaceLow: "#12161B",
		surfaceHigh: "#1A1F26",
		ink: "#EDEFF2",
		inkSecondary: "#A8B0BC",
		inkTertiary: "#6B7480",
		border: "#262C34",
		borderStrong: "#323A44",
		contrast: 64,
		uiFont: "Inter",
		codeFont: "Geist Mono",
		diffAdded: "#4ADE94",
		diffRemoved: "#F0665E",
		warning: "#F5B84A",
		info: "#6B9FE8",
		skill: "#9B7FE8",
		opaqueWindows: true,
	},
};

export const CODEX_LIGHT_THEME: CodexThemeSettings = {
	version: "codex-theme-v1",
	name: "Drenyra Light",
	mode: "light",
	tokens: {
		accent: "#0A8A7D",
		surface: "#FFFFFF",
		surfaceLow: "#F2F2F0",
		surfaceHigh: "#FFFFFF",
		ink: "#16181B",
		inkSecondary: "#52565D",
		inkTertiary: "#7A7F87",
		border: "#E5E5E2",
		borderStrong: "#D4D4D0",
		contrast: 26,
		uiFont: "Inter",
		codeFont: "Geist Mono",
		diffAdded: "#1A8F52",
		diffRemoved: "#C23B33",
		warning: "#A86A0A",
		info: "#2E5FB8",
		skill: "#5B3FA8",
		opaqueWindows: true,
	},
};

const DEFAULT_SETTINGS: AppSettings = {
	theme: "dark",
	bgImage: null,
	overlayColor: null,
	blur: false,
	wallpaperDim: 20,
	textureOverlay: true,
	codexTheme: DEFAULT_CODEX_THEME,
	codexPets: {
		enabled: false,
		companion: "alpaca",
	},
	chatStyle: {
		userBubbleColor: "bg-primary text-primary-foreground",
		aiBubbleColor: "bg-muted text-foreground",
	},
} as AppSettings & { dynamicTheme?: boolean };

function withDefaultCodexTheme(settings: AppSettings): AppSettings {
	return {
		...settings,
		codexTheme: {
			...DEFAULT_CODEX_THEME,
			...settings.codexTheme,
			tokens: {
				...DEFAULT_CODEX_THEME.tokens,
				...settings.codexTheme?.tokens,
			},
		},
		codexPets: settings.codexPets ?? {
			enabled: false,
			companion: "alpaca",
		},
	};
}

function applyCodexThemeTokens(codexTheme: CodexThemeSettings): void {
	if (typeof document === "undefined") return;

	const html = document.documentElement;
	const { tokens } = codexTheme;

	// Global Theme Context
	html.dataset.codexTheme = codexTheme.name;

	// Core Surfaces
	html.style.setProperty("--surface", tokens.surface);
	html.style.setProperty("--surface-low", tokens.surfaceLow);
	html.style.setProperty("--surface-high", tokens.surfaceHigh);

	// Core Inks
	html.style.setProperty("--ink", tokens.ink);
	html.style.setProperty("--ink-secondary", tokens.inkSecondary);
	html.style.setProperty("--ink-tertiary", tokens.inkTertiary);

	// Borders
	html.style.setProperty("--border", tokens.border);
	html.style.setProperty("--border-strong", tokens.borderStrong);

	// Accents & Signals
	html.style.setProperty("--accent", tokens.accent);
	html.style.setProperty("--diff-added", tokens.diffAdded);
	html.style.setProperty("--diff-removed", tokens.diffRemoved);
	html.style.setProperty("--warning", tokens.warning);
	html.style.setProperty("--info", tokens.info);
	html.style.setProperty("--skill", tokens.skill);

	// Legacy Support & Shadcn Overrides
	html.style.setProperty("--background", tokens.surface);
	html.style.setProperty("--foreground", tokens.ink);
	html.style.setProperty("--primary", tokens.accent);
	html.style.setProperty("--muted", tokens.surfaceLow);
	html.style.setProperty("--muted-foreground", tokens.inkSecondary);
	html.style.setProperty("--card", tokens.surfaceLow);
	html.style.setProperty("--card-foreground", tokens.ink);
	html.style.setProperty("--popover", tokens.surfaceHigh);
	html.style.setProperty("--popover-foreground", tokens.ink);

	// Fonts
	html.style.setProperty("--font-sans", `${tokens.uiFont}, var(--font-ui)`);
	html.style.setProperty("--font-mono", `${tokens.codeFont}, ui-monospace`);
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
	const [isLoaded, setIsLoaded] = useState(false);
	const themePreference = useUIStore((state) => state.themePreference);
	const setThemePreference = useUIStore((state) => state.setThemePreference);
	const resolvedTheme = getResolvedColorScheme(
		getResolvedThemeId(themePreference),
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const saved = localStorage.getItem("drenyra-settings");
			if (saved) {
				setSettings((prev) =>
					withDefaultCodexTheme({
						...prev,
						...JSON.parse(saved),
					}),
				);
			}
		} catch (e) {
			captureError(
				e instanceof Error ? e : new Error("Failed to load settings"),
			);
		} finally {
			setIsLoaded(true);
		}
	}, []);

	useEffect(() => {
		applyCodexThemeTokens(settings.codexTheme);
	}, [settings.codexTheme]);

	useEffect(() => {
		if (!isLoaded || typeof window === "undefined") return;
		localStorage.setItem("drenyra-settings", JSON.stringify(settings));
	}, [settings, isLoaded]);

	const updateSettings = (newSettings: Partial<AppSettings>) => {
		setSettings((prev) => withDefaultCodexTheme({ ...prev, ...newSettings }));

		if (newSettings.theme) {
			const bridgePreference = THEME_BRIDGE[newSettings.theme];
			if (bridgePreference) {
				setThemePreference(bridgePreference);
			}
		}
	};

	return (
		<SettingsContext.Provider
			value={{ settings, resolvedTheme, updateSettings }}
		>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettings = () => {
	const context = useContext(SettingsContext);
	if (!context)
		throw new Error("useSettings must be used within SettingsProvider");
	return context;
};
