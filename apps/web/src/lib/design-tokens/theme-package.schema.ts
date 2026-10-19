import { z } from "zod";

/**
 * Theme vocabulary. Values live in `src/index.css`
 * (`html[data-accent]`, `html[data-density]`); this module only names them.
 */
export const ACCENT_PRESETS = [
	"voltage",
	"ember",
	"cocoa",
	"terracotta",
	"teal",
	"steel",
	"sage",
	"lavender",
	"maple",
] as const;
export type AccentPreset = (typeof ACCENT_PRESETS)[number];

export const DENSITY_LEVELS = ["compact", "normal", "spacious"] as const;
export type DensityLevel = (typeof DENSITY_LEVELS)[number];

export const COLOR_SCHEMES = ["light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** A custom property name, e.g. `--accent`. */
const cssVariableName = z.string().regex(/^--[a-z0-9][a-z0-9-]*$/);

export const drenyraThemePackageSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	colorScheme: z.enum(COLOR_SCHEMES),
	/** Overrides applied inline on the root element. Empty for CSS-defined presets. */
	variables: z.record(cssVariableName, z.string().min(1)),
});

export type DrenyraThemePackage = z.infer<typeof drenyraThemePackageSchema>;

export function isAccentPreset(value: unknown): value is AccentPreset {
	return ACCENT_PRESETS.includes(value as AccentPreset);
}

export function isDensityLevel(value: unknown): value is DensityLevel {
	return DENSITY_LEVELS.includes(value as DensityLevel);
}
