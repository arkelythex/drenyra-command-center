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
	name: "Arkelythex Dark",
	mode: "dark",
	tokens: {
		accent: "#e0e0e5",
		surface: "#050505",
		surfaceLow: "#0f0f12",
		surfaceHigh: "#1a1a1f",
		ink: "#ffffff",
		inkSecondary: "#a1a1aa",
		inkTertiary: "#52525b",
		border: "#27272a",
		borderStrong: "#3f3f46",
		contrast: 64,
		uiFont: "Plus Jakarta Sans",
		codeFont: "JetBrains Mono",
		diffAdded: "#10b981",
		diffRemoved: "#ef4444",
		warning: "#f59e0b",
		info: "#3b82f6",
		skill: "#8e86ff",
		opaqueWindows: true,
	},
};

export const CODEX_LIGHT_THEME: CodexThemeSettings = {
	version: "codex-theme-v1",
	name: "Arkelythex Light",
	mode: "light",
	tokens: {
		accent: "#c47f30",
		surface: "#ffffff",
		surfaceLow: "#F5EFE8",
		surfaceHigh: "#EFE7DD",
		ink: "#1B1511",
		inkSecondary: "#6F6258",
		inkTertiary: "#9ca3af",
		border: "#DED2C4",
		borderStrong: "#c9bca8",
		contrast: 26,
		uiFont: "Plus Jakarta Sans",
		codeFont: "JetBrains Mono",
		diffAdded: "#059669",
		diffRemoved: "#dc2626",
		warning: "#d97706",
		info: "#2563eb",
		skill: "#d985d7",
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
			const saved = localStorage.getItem("arkelythex-settings");
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
		localStorage.setItem("arkelythex-settings", JSON.stringify(settings));
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
