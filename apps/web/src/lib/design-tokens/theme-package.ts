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
	const result = themePackageSchema.safeParse(input);
	if (!result.success) {
		throw new Error(result.error.message);
	}
	return result.data;
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
	try {
		const parsed = JSON.parse(jsonPayload) as unknown;
		return parseThemePackage(parsed);
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Theme JSON is invalid.",
		);
	}
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
			name: "Drenyra Black OLED",
			version: "1.0.0",
			description:
				"Black OLED fiscal command center with warm copper emphasis and calm semantic states.",
		},
		meta: {
			name: "Drenyra Black OLED",
			description:
				"Black OLED fiscal command center with warm copper emphasis and calm semantic states.",
		},
		tokens: {
			foundation: {
				"foundation.surface": "#090807",
				"foundation.ink": "#F7F1E8",
				"foundation.accent": "#D39A5A",
			},
			semantic: {
				"semantic.bg.canvas": "#000000",
				"semantic.text.primary": "#F7F1E8",
				"semantic.text.muted": "#81786E",
				"semantic.accent.primary": "#D39A5A",
				"semantic.border.default": "#2C261F",
				"semantic.border.subtle": "#1E1A16",
			},
			component: {},
		},
	},
	"cocoa-light": {
		schema: THEME_PACKAGE_SCHEMA_ID,
		colorScheme: "light",
		metadata: {
			name: "Drenyra Light Pearl",
			version: "1.0.0",
			description:
				"Warm pearl accounting workspace with deep cocoa ink and copper emphasis.",
		},
		meta: {
			name: "Drenyra Light Pearl",
			description:
				"Warm pearl accounting workspace with deep cocoa ink and copper emphasis.",
		},
		tokens: {
			foundation: {
				"foundation.surface": "#FFFFFF",
				"foundation.ink": "#1D1A16",
				"foundation.accent": "#B87333",
			},
			semantic: {
				"semantic.bg.canvas": "#F8F5EF",
				"semantic.text.primary": "#1D1A16",
				"semantic.text.muted": "#7A7166",
				"semantic.accent.primary": "#B87333",
				"semantic.border.default": "#CEBFAE",
				"semantic.border.subtle": "#E0D5C7",
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

function addKnownTokens(
	target: Partial<Record<ThemeTokenName, string>>,
	tokens: Record<string, string>,
	prefix = "",
): void {
	for (const [tokenName, value] of Object.entries(tokens)) {
		const qualifiedName = `${prefix}${tokenName}`;
		if (qualifiedName in THEME_TOKEN_CSS_VARIABLES) {
			target[qualifiedName as ThemeTokenName] = value;
		}
	}
}

function addComponentTokens(
	target: Partial<Record<ThemeTokenName, string>>,
	components: ThemePackage["tokens"]["component"],
): void {
	for (const [componentName, componentTokens] of Object.entries(components)) {
		if (typeof componentTokens === "string") {
			addKnownTokens(target, { [componentName]: componentTokens });
			continue;
		}
		addKnownTokens(target, componentTokens, `${componentName}.`);
	}
}

function flattenThemeTokens(
	themePackage: ThemePackage,
): Partial<Record<ThemeTokenName, string>> {
	const flattened: Partial<Record<ThemeTokenName, string>> = {};
	addKnownTokens(flattened, themePackage.tokens.foundation);
	addKnownTokens(flattened, themePackage.tokens.semantic);
	addComponentTokens(flattened, themePackage.tokens.component);
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
