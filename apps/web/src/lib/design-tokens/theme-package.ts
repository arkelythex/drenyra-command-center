import {
	ACCENT_PRESETS,
	type AccentPreset,
	DENSITY_LEVELS,
	type DensityLevel,
	type DrenyraThemePackage,
	THEME_PACKAGE_SCHEMA_ID,
	THEME_TOKEN_CSS_VARIABLES,
	type ThemePackage,
	type ThemeTokenName,
	themePackageSchema,
} from "./theme-package.schema";

export type {
	AccentPreset,
	DensityLevel,
	DrenyraThemePackage,
	ThemePackage,
} from "./theme-package.schema";

export type ThemePackageParseResult =
	| { ok: true; package: DrenyraThemePackage }
	| { ok: false; error: string };

export function parseThemePackage(input: unknown): DrenyraThemePackage {
	return themePackageSchema.parse(input);
}

export function tryParseThemePackage(
	input: unknown,
): DrenyraThemePackage | null {
	const result = themePackageSchema.safeParse(input);
	return result.success ? result.data : null;
}

export function isThemePackage(input: unknown): input is DrenyraThemePackage {
	return themePackageSchema.safeParse(input).success;
}

export function parseThemePackageJson(
	jsonPayload: string,
): DrenyraThemePackage {
	const parsed = JSON.parse(jsonPayload) as unknown;
	return parseThemePackage(parsed);
}

export function parseThemePackageJsonSafe(
	source: string,
): ThemePackageParseResult {
	try {
		const pkg = parseThemePackageJson(source);
		return { ok: true, package: pkg };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Theme JSON is invalid.";
		return { ok: false, error: message };
	}
}

export function stringifyThemePackage(
	themePackage: ThemePackage,
	spacing = 2,
): string {
	const validated = parseThemePackage(themePackage);
	return JSON.stringify(validated, null, spacing);
}

export const serializeThemePackage = stringifyThemePackage;

export const PRESET_THEME_PACKAGES = {
	"mono-dark": {
		schema: THEME_PACKAGE_SCHEMA_ID,
		colorScheme: "dark",
		metadata: {
			name: "ARKELYTHEX Dark",
			version: "1.0.0",
			description:
				"Monochromatic glass workspace: near-black canvas, graphite panels, soft white foreground.",
		},
		meta: {
			name: "ARKELYTHEX Dark",
			description:
				"Monochromatic glass workspace: near-black canvas, graphite panels, soft white foreground.",
		},
		tokens: {
			foundation: {
				"foundation.surface": "#16161e",
				"foundation.ink": "#e0e0e5",
				"foundation.accent": "#e0e0e5",
			},
			semantic: {
				"semantic.bg.canvas": "#0f0f12",
				"semantic.text.primary": "#e0e0e5",
				"semantic.accent.primary": "#e0e0e5",
			},
			component: {},
		},
	},
	"cocoa-light": {
		schema: THEME_PACKAGE_SCHEMA_ID,
		colorScheme: "light",
		metadata: {
			name: "ARKELYTHEX Light",
			version: "1.0.0",
			description:
				"Warm light theme — white surfaces, beige canvas, deep cocoa ink, warm lucuma accent.",
		},
		meta: {
			name: "ARKELYTHEX Light",
			description:
				"Warm light theme — white surfaces, beige canvas, deep cocoa ink, warm lucuma accent.",
		},
		tokens: {
			foundation: {
				"foundation.surface": "#ffffff",
				"foundation.ink": "#0d0b09",
				"foundation.accent": "#c47f30",
			},
			semantic: {
				"semantic.bg.canvas": "#ffffff",
				"semantic.text.primary": "#0d0b09",
				"semantic.text.muted": "#4a4035",
				"semantic.accent.primary": "#c47f30",
				"semantic.border.default": "#e0dcd2",
				"semantic.border.subtle": "#ece8e0",
			},
			component: {},
		},
	},
} satisfies Record<string, ThemePackage>;

export function getPresetThemePackage(themeId: string): DrenyraThemePackage {
	const preset =
		PRESET_THEME_PACKAGES[themeId as keyof typeof PRESET_THEME_PACKAGES] ??
		PRESET_THEME_PACKAGES["mono-dark"];
	return parseThemePackage(preset);
}

function flattenThemeTokens(
	themePackage: ThemePackage,
): Partial<Record<ThemeTokenName, string>> {
	const flattened: Partial<Record<ThemeTokenName, string>> = {};
	for (const [tokenName, value] of Object.entries(
		themePackage.tokens.foundation,
	)) {
		if (tokenName in THEME_TOKEN_CSS_VARIABLES) {
			flattened[tokenName as ThemeTokenName] = value;
		}
	}
	for (const [tokenName, value] of Object.entries(
		themePackage.tokens.semantic,
	)) {
		if (tokenName in THEME_TOKEN_CSS_VARIABLES) {
			flattened[tokenName as ThemeTokenName] = value;
		}
	}
	for (const [componentName, componentTokens] of Object.entries(
		themePackage.tokens.component,
	)) {
		if (typeof componentTokens === "string") {
			if (componentName in THEME_TOKEN_CSS_VARIABLES) {
				flattened[componentName as ThemeTokenName] = componentTokens;
			}
			continue;
		}
		for (const [tokenName, value] of Object.entries(componentTokens)) {
			const qualifiedName = `${componentName}.${tokenName}`;
			if (qualifiedName in THEME_TOKEN_CSS_VARIABLES) {
				flattened[qualifiedName as ThemeTokenName] = value;
			}
		}
	}
	return flattened;
}

export function getThemePackageCssVariables(
	themePackage: ThemePackage,
): Record<string, string> {
	const variables: Record<string, string> = {};
	const flattened = flattenThemeTokens(themePackage);
	for (const [tokenName, value] of Object.entries(flattened)) {
		const cssVariable = THEME_TOKEN_CSS_VARIABLES[tokenName as ThemeTokenName];
		if (cssVariable) variables[cssVariable] = value;
	}
	const surface =
		flattened["foundation.surface"] ?? flattened["semantic.bg.canvas"];
	const ink = flattened["foundation.ink"] ?? flattened["semantic.text.primary"];
	const accent =
		flattened["foundation.accent"] ?? flattened["semantic.accent.primary"];
	if (surface) {
		variables["--surface"] = surface;
		variables["--background"] = surface;
	}
	if (ink) {
		variables["--ink"] = ink;
		variables["--foreground"] = ink;
	}
	if (accent) {
		variables["--accent"] = accent;
		variables["--primary"] = accent;
		variables["--premium-action-blue"] = accent;
	}
	return variables;
}

export function applyThemePackageToElement(
	themePackage: ThemePackage,
	element: HTMLElement,
): void {
	for (const [cssVariable, value] of Object.entries(
		getThemePackageCssVariables(themePackage),
	)) {
		element.style.setProperty(cssVariable, value);
	}
	element.dataset.themePackage = themePackage.metadata.name;
}

export function clearThemePackageFromElement(element: HTMLElement): void {
	for (const cssVariable of Object.values(THEME_TOKEN_CSS_VARIABLES)) {
		element.style.removeProperty(cssVariable);
	}
	for (const cssVariable of [
		"--surface",
		"--background",
		"--ink",
		"--foreground",
		"--accent",
		"--primary",
		"--premium-action-blue",
	]) {
		element.style.removeProperty(cssVariable);
	}
	element.removeAttribute("data-theme-package");
}

/* ── Accent Preset Helpers ── */

export function applyAccentToDocument(accent: AccentPreset): void {
	if (typeof document === "undefined") return;
	if (!ACCENT_PRESETS.includes(accent)) return;
	document.documentElement.setAttribute("data-accent", accent);
}

export function clearAccentFromDocument(): void {
	if (typeof document === "undefined") return;
	document.documentElement.removeAttribute("data-accent");
}

export function getCurrentAccent(): AccentPreset | null {
	if (typeof document === "undefined") return null;
	const current = document.documentElement.getAttribute("data-accent");
	if (current && ACCENT_PRESETS.includes(current as AccentPreset)) {
		return current as AccentPreset;
	}
	return null;
}

/* ── Density Level Helpers ── */

export function applyDensityToDocument(density: DensityLevel): void {
	if (typeof document === "undefined") return;
	if (!DENSITY_LEVELS.includes(density)) return;
	document.documentElement.setAttribute("data-density", density);
}

export function clearDensityFromDocument(): void {
	if (typeof document === "undefined") return;
	document.documentElement.removeAttribute("data-density");
}

export function getCurrentDensity(): DensityLevel | null {
	if (typeof document === "undefined") return null;
	const current = document.documentElement.getAttribute("data-density");
	if (current && DENSITY_LEVELS.includes(current as DensityLevel)) {
		return current as DensityLevel;
	}
	return null;
}
