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
	name: "Drenyra Black OLED",
	mode: "dark",
	tokens: {
		accent: "#D39A5A",
		surface: "#090807",
		surfaceLow: "#11100E",
		surfaceHigh: "#191612",
		ink: "#F7F1E8",
		inkSecondary: "#BDB3A6",
		inkTertiary: "#81786E",
		border: "#2C261F",
		borderStrong: "#493D31",
		contrast: 64,
		uiFont: "Inter",
		codeFont: "Geist Mono",
		diffAdded: "#62B47F",
		diffRemoved: "#D66A66",
		warning: "#D39A5A",
		info: "#7EA6C8",
		skill: "#A9793F",
		opaqueWindows: true,
	},
};

export const CODEX_LIGHT_THEME: CodexThemeSettings = {
	version: "codex-theme-v1",
	name: "Drenyra Light Pearl",
	mode: "light",
	tokens: {
		accent: "#B87333",
		surface: "#FFFFFF",
		surfaceLow: "#F3EEE6",
		surfaceHigh: "#ECE4D8",
		ink: "#1D1A16",
		inkSecondary: "#5C5347",
		inkTertiary: "#7A7166",
		border: "#E0D5C7",
		borderStrong: "#B5A38E",
		contrast: 64,
		uiFont: "Inter",
		codeFont: "Geist Mono",
		diffAdded: "#257F4E",
		diffRemoved: "#A83E3C",
		warning: "#8A5A18",
		info: "#3D5F7E",
		skill: "#D8A24A",
		opaqueWindows: true,
	},
};

const DEFAULT_SETTINGS: AppSettings = {
	theme: "light",
	bgImage: null,
	overlayColor: null,
	blur: false,
	wallpaperDim: 20,
	textureOverlay: true,
	codexTheme: CODEX_LIGHT_THEME,
	codexPets: {
		enabled: false,
		companion: "alpaca",
	},
	chatStyle: {
		userBubbleColor: "bg-primary text-primary-foreground",
		aiBubbleColor: "bg-muted text-foreground",
	},
} as AppSettings & { dynamicTheme?: boolean };

function getDefaultCodexTheme(theme: AppSettings["theme"]): CodexThemeSettings {
	return theme === "light" ? CODEX_LIGHT_THEME : DEFAULT_CODEX_THEME;
}

function isLegacyCodexTheme(theme: CodexThemeSettings | undefined): boolean {
	return (
		theme?.name === "Drenyra Dark" ||
		theme?.name === "Drenyra Light" ||
		theme?.tokens.accent === "#3CE6D8" ||
		theme?.tokens.accent === "#0A8A7D"
	);
}

function withDefaultCodexTheme(settings: AppSettings): AppSettings {
	const defaultTheme = getDefaultCodexTheme(settings.theme);
	const persistedTheme = isLegacyCodexTheme(settings.codexTheme)
		? undefined
		: settings.codexTheme;

	return {
		...settings,
		codexTheme: {
			...defaultTheme,
			...persistedTheme,
			tokens: {
				...defaultTheme.tokens,
				...persistedTheme?.tokens,
			},
		},
		codexPets: settings.codexPets ?? {
			enabled: false,
			companion: "alpaca",
		},
	};
}

function getInitialSettings(): AppSettings {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;

	try {
		const saved = localStorage.getItem("drenyra-settings");
		if (!saved) return DEFAULT_SETTINGS;
		const persisted = JSON.parse(saved) as Partial<AppSettings>;
		return withDefaultCodexTheme({
			...DEFAULT_SETTINGS,
			...persisted,
			codexTheme: persisted.codexTheme,
		} as AppSettings);
	} catch (error) {
		captureError(
			error instanceof Error ? error : new Error("Failed to load settings"),
		);
		return DEFAULT_SETTINGS;
	}
}

function applyCodexThemeTokens(codexTheme: CodexThemeSettings): void {
	if (typeof document === "undefined") return;

	const html = document.documentElement;
	const { tokens } = codexTheme;

	// Global Theme Context
	html.dataset.codexTheme = codexTheme.name;
	html.dataset.ledgerTheme =
		codexTheme.mode === "light" ? "light" : "black-oled";

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
	const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
	const [isLoaded, setIsLoaded] = useState(false);
	const themePreference = useUIStore((state) => state.themePreference);
	const setThemePreference = useUIStore((state) => state.setThemePreference);
	const resolvedTheme = getResolvedColorScheme(
		getResolvedThemeId(themePreference),
	);

	useEffect(() => {
		setIsLoaded(true);
	}, []);

	useEffect(() => {
		if (!isLoaded) return;
		applyCodexThemeTokens(settings.codexTheme);
	}, [isLoaded, settings.codexTheme]);

	useEffect(() => {
		if (!isLoaded) return;
		const bridgePreference = THEME_BRIDGE[settings.theme];
		if (bridgePreference && bridgePreference !== themePreference) {
			setThemePreference(bridgePreference);
		}
	}, [isLoaded, settings.theme, themePreference, setThemePreference]);

	useEffect(() => {
		if (!isLoaded || typeof window === "undefined") return;
		localStorage.setItem("drenyra-settings", JSON.stringify(settings));
	}, [settings, isLoaded]);

	const updateSettings = (newSettings: Partial<AppSettings>) => {
		setSettings((prev) => {
			const nextSettings = { ...prev, ...newSettings };
			const themeChanged =
				newSettings.theme !== undefined && newSettings.theme !== prev.theme;

			return withDefaultCodexTheme({
				...nextSettings,
				codexTheme:
					newSettings.codexTheme ??
					(themeChanged
						? getDefaultCodexTheme(nextSettings.theme)
						: nextSettings.codexTheme),
			});
		});

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
