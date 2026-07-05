import {
	applyAccentToDocument,
	applyDensityToDocument,
	applyThemePackageToElement,
	clearAccentFromDocument,
	clearDensityFromDocument,
	clearThemePackageFromElement,
	getPresetThemePackage,
} from "@/lib/design-tokens/theme-package";
import type {
	AccentPreset,
	DensityLevel,
	DrenyraThemePackage,
} from "@/lib/design-tokens/theme-package.schema";
import { captureError } from "@/lib/monitoring";

export const THEME_ID = {
	MONO_DARK: "mono-dark",
	LIGHT: "cocoa-light",
	CUSTOM: "custom",
} as const;

export const THEME_PREFERENCE = {
	SYSTEM: "system",
	LIGHT: THEME_ID.LIGHT,
	DARK: THEME_ID.MONO_DARK,
	CUSTOM: THEME_ID.CUSTOM,
} as const;

export type ThemeId = (typeof THEME_ID)[keyof typeof THEME_ID];
export type ThemePreference =
	(typeof THEME_PREFERENCE)[keyof typeof THEME_PREFERENCE];
export type ResolvedColorScheme = "light" | "dark";

export type UXMode = "light" | "dark" | "system";

export const UI_STORAGE_KEY = "drenyra-ui-storage";

interface PersistedUIState {
	state?: {
		uxMode?: unknown;
		themePreference?: unknown;
		accentPreference?: unknown;
		densityPreference?: unknown;
	};
	accent?: unknown;
	density?: unknown;
}

const LEGACY_THEME_ALIAS: Record<string, ThemePreference> = {
	light: THEME_ID.LIGHT,
	dark: THEME_ID.MONO_DARK,
	cyberpunk: THEME_ID.MONO_DARK,
	auto: THEME_PREFERENCE.SYSTEM,
	system: THEME_PREFERENCE.SYSTEM,
	"mono-light": THEME_ID.LIGHT,
	"mono-dark": THEME_ID.MONO_DARK,
	"cocoa-light": THEME_ID.LIGHT,
	custom: THEME_ID.CUSTOM,
};

function getSystemColorScheme(): ResolvedColorScheme {
	if (typeof window === "undefined") return "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function normalizeThemePreference(value: unknown): ThemePreference {
	if (typeof value !== "string") return THEME_ID.MONO_DARK;
	return LEGACY_THEME_ALIAS[value] ?? THEME_ID.MONO_DARK;
}

export function getResolvedThemeId(
	preference: ThemePreference,
	isSystemDark = getSystemColorScheme() === "dark",
): ThemeId {
	if (preference === THEME_PREFERENCE.SYSTEM) {
		return isSystemDark ? THEME_ID.MONO_DARK : THEME_ID.LIGHT;
	}

	return preference;
}

export function getResolvedColorScheme(themeId: ThemeId): ResolvedColorScheme {
	if (themeId === THEME_ID.LIGHT) return "light";
	return "dark";
}

export function normalizeUXMode(value: unknown): UXMode {
	const normalized = normalizeThemePreference(value);
	if (normalized === THEME_PREFERENCE.SYSTEM) return "system";
	return normalized === THEME_ID.LIGHT ? "light" : "dark";
}

export function getResolvedTheme(mode: UXMode): "light" | "dark" {
	return getResolvedColorScheme(
		getResolvedThemeId(
			mode === "system" ? "system" : (`mono-${mode}` as ThemeId),
		),
	);
}

let systemThemeListener: (() => void) | null = null;

export function subscribeToSystemTheme(
	callback: (isDark: boolean) => void,
): () => void {
	if (typeof window === "undefined") return () => {};

	if (systemThemeListener) {
		systemThemeListener();
	}

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = (e: MediaQueryListEvent) => callback(e.matches);
	mediaQuery.addEventListener("change", handler);
	systemThemeListener = () => mediaQuery.removeEventListener("change", handler);

	return systemThemeListener;
}

export function syncThemeDocumentState(
	preference: ThemePreference,
	customThemePackage?: DrenyraThemePackage | null,
	accent?: AccentPreset | null | undefined,
	density?: DensityLevel | null | undefined,
): void {
	if (typeof document === "undefined") return;

	const html = document.documentElement;
	const resolvedThemeId = getResolvedThemeId(preference);
	const resolvedColorScheme = getResolvedColorScheme(resolvedThemeId);

	html.classList.remove(
		"ux-classic",
		"ux-cyberpunk",
		"ux-light",
		"ux-dark",
		"ux-system",
		"theme-mono-light",
		"theme-mono-dark",
		"theme-cocoa-light",
		"theme-custom",
		"dark",
		"light",
	);

	html.classList.add(`theme-${resolvedThemeId}`);
	html.classList.add(resolvedColorScheme);
	html.dataset.theme = resolvedThemeId;
	html.dataset.colorScheme = resolvedColorScheme;
	html.style.colorScheme = resolvedColorScheme;

	clearThemePackageFromElement(html);
	const themePackage =
		resolvedThemeId === THEME_ID.CUSTOM && customThemePackage
			? customThemePackage
			: getPresetThemePackage(resolvedThemeId);
	applyThemePackageToElement(themePackage, html);

	// Apply accent preset (or clear to default)
	if (accent) {
		applyAccentToDocument(accent);
	} else {
		clearAccentFromDocument();
	}

	// Apply density level (or clear to default = normal)
	if (density) {
		applyDensityToDocument(density);
	} else {
		clearDensityFromDocument();
	}

	if (preference === THEME_PREFERENCE.SYSTEM) {
		html.classList.add("ux-system");
	} else {
		html.classList.add(
			resolvedThemeId === THEME_ID.LIGHT ? "ux-light" : "ux-dark",
		);
	}
}

export function syncUXModeDocumentClasses(mode: UXMode): void {
	syncThemeDocumentState(
		mode === "system" ? "system" : (`mono-${mode}` as ThemePreference),
		undefined,
		readPersistedAccent(),
		readPersistedDensity(),
	);
}

export function readPersistedThemePreference(): ThemePreference {
	if (typeof window === "undefined") {
		return THEME_ID.MONO_DARK;
	}

	const persistedState = window.localStorage.getItem(UI_STORAGE_KEY);
	if (!persistedState) {
		return THEME_ID.MONO_DARK;
	}

	try {
		const parsed = JSON.parse(persistedState) as PersistedUIState;
		return normalizeThemePreference(
			parsed.state?.themePreference ?? parsed.state?.uxMode,
		);
	} catch (error) {
		captureError(
			error instanceof Error
				? error
				: new Error("Failed to parse persisted UX mode"),
			{
				source: "ux-mode.read-persisted",
			},
		);
		return THEME_ID.MONO_DARK;
	}
}

export function readPersistedUXMode(): UXMode {
	const preference = readPersistedThemePreference();
	if (preference === THEME_PREFERENCE.SYSTEM) return "system";
	return preference === THEME_ID.LIGHT ? "light" : "dark";
}

export function readPersistedAccent(): AccentPreset | undefined {
	if (typeof window === "undefined") return undefined;

	const persistedState = window.localStorage.getItem(UI_STORAGE_KEY);
	if (!persistedState) return undefined;

	try {
		const parsed = JSON.parse(persistedState) as PersistedUIState;
		const accent = parsed.state?.accentPreference ?? parsed.accent;
		if (typeof accent === "string" && accent.length > 0) {
			return accent as AccentPreset;
		}
	} catch {
		// Ignore parse errors — fall through to undefined
	}
	return undefined;
}

export function readPersistedDensity(): DensityLevel | undefined {
	if (typeof window === "undefined") return undefined;

	const persistedState = window.localStorage.getItem(UI_STORAGE_KEY);
	if (!persistedState) return undefined;

	try {
		const parsed = JSON.parse(persistedState) as PersistedUIState;
		const density = parsed.state?.densityPreference ?? parsed.density;
		if (typeof density === "string" && density.length > 0) {
			return density as DensityLevel;
		}
	} catch {
		// Ignore parse errors — fall through to undefined
	}
	return undefined;
}

export function bootstrapPersistedTheme(): void {
	syncThemeDocumentState(
		readPersistedThemePreference(),
		undefined,
		readPersistedAccent(),
		readPersistedDensity(),
	);
}

export function bootstrapPersistedUXMode(): void {
	bootstrapPersistedTheme();
}
