import type {
	AccentPreset,
	DensityLevel,
	DrenyraThemePackage,
} from "./theme-package.schema";

/**
 * Presets are defined in CSS (`.light`, `html[data-theme]`), so their
 * packages carry no variables. Only custom packages inject values.
 */
const PRESET_PACKAGES: Record<string, DrenyraThemePackage> = {
	"mono-dark": {
		id: "mono-dark",
		name: "Mono Dark",
		colorScheme: "dark",
		variables: {},
	},
	"cocoa-light": {
		id: "cocoa-light",
		name: "Cocoa Light",
		colorScheme: "light",
		variables: {},
	},
};

const appliedVariables = new WeakMap<HTMLElement, string[]>();

export function getPresetThemePackage(themeId: string): DrenyraThemePackage {
	return (
		PRESET_PACKAGES[themeId] ??
		(PRESET_PACKAGES["mono-dark"] as DrenyraThemePackage)
	);
}

export function applyThemePackageToElement(
	themePackage: DrenyraThemePackage,
	element: HTMLElement,
): void {
	clearThemePackageFromElement(element);
	const names = Object.keys(themePackage.variables);
	for (const name of names) {
		element.style.setProperty(name, themePackage.variables[name] as string);
	}
	appliedVariables.set(element, names);
}

export function clearThemePackageFromElement(element: HTMLElement): void {
	for (const name of appliedVariables.get(element) ?? []) {
		element.style.removeProperty(name);
	}
	appliedVariables.delete(element);
}

function root(): HTMLElement {
	return document.documentElement;
}

export function applyAccentToDocument(accent: AccentPreset): void {
	root().dataset.accent = accent;
}

export function clearAccentFromDocument(): void {
	delete root().dataset.accent;
}

export function applyDensityToDocument(density: DensityLevel): void {
	root().dataset.density = density;
}

export function clearDensityFromDocument(): void {
	delete root().dataset.density;
}
