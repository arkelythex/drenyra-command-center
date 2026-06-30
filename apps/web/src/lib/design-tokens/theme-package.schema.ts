import { z } from "zod";

const SENSITIVE_KEY_PARTS = [
	"ruc",
	"companyid",
	"orgid",
	"token",
	"session",
	"email",
	"document",
] as const;

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

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_PATTERN =
	/^rgba?\(\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const OKLCH_COLOR_PATTERN =
	/^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*(?:0|1|0?\.\d+))?\s*\)$/i;
const COLOR_MIX_PATTERN =
	/^color-mix\(\s*in\s+[a-z-]+\s*,\s*[^,]+\s*,\s*[^)]+\)$/i;
const CSS_VAR_PATTERN = /^var\(\s*--[a-z0-9-]+(?:\s*,\s*[^)]+)?\s*\)$/i;

export const THEME_PACKAGE_SCHEMA_ID = "codex-theme-v1" as const;
export const ARKELYTHEX_THEME_SCHEMA_VERSION = THEME_PACKAGE_SCHEMA_ID;

export function normalizeKeyName(key: string): string {
	return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function isSensitiveKeyName(key: string): boolean {
	const normalizedKey = normalizeKeyName(key);
	return SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part));
}

export const isSensitiveThemeKey = isSensitiveKeyName;

export function isAllowedColorValue(value: string): boolean {
	const trimmed = value.trim();
	return (
		HEX_COLOR_PATTERN.test(trimmed) ||
		RGB_COLOR_PATTERN.test(trimmed) ||
		OKLCH_COLOR_PATTERN.test(trimmed) ||
		COLOR_MIX_PATTERN.test(trimmed) ||
		CSS_VAR_PATTERN.test(trimmed)
	);
}

export const isSafeThemeColorValue = isAllowedColorValue;

const colorTokenValueSchema = z
	.string()
	.trim()
	.min(1)
	.refine(isAllowedColorValue, {
		message: "Unsupported color token format",
	});

const tokenBucketSchema = z.record(z.string(), colorTokenValueSchema);
const componentTokenSchema: z.ZodType<
	Record<string, string | Record<string, string>>
> = z.record(z.string(), z.union([colorTokenValueSchema, tokenBucketSchema]));

export const themePackageSchema = z
	.object({
		schema: z.literal(THEME_PACKAGE_SCHEMA_ID),
		colorScheme: z.enum(["light", "dark", "system"]).default("dark"),
		accent: z.enum(ACCENT_PRESETS).optional(),
		density: z.enum(DENSITY_LEVELS).optional(),
		metadata: z
			.object({
				name: z.string().trim().min(1).max(120).default("Codex Theme"),
				version: z.string().trim().min(1).max(60).default("1.0.0"),
				description: z.string().trim().max(500).optional(),
			})
			.strict()
			.default({ name: "Codex Theme", version: "1.0.0" }),
		meta: z
			.object({
				name: z.string().trim().min(1).max(120).optional(),
				version: z.string().trim().min(1).max(60).optional(),
				description: z.string().trim().max(500).optional(),
			})
			.strict()
			.optional(),
		tokens: z
			.object({
				foundation: tokenBucketSchema.default({}),
				semantic: tokenBucketSchema.default({}),
				component: componentTokenSchema.default({}),
			})
			.strict(),
	})
	.strict()
	.transform((pkg) => ({
		...pkg,
		metadata: {
			...pkg.metadata,
			name: pkg.meta?.name ?? pkg.metadata.name,
			version: pkg.meta?.version ?? pkg.metadata.version,
			description: pkg.meta?.description ?? pkg.metadata.description,
		},
	}))
	.superRefine((pkg, ctx) => {
		for (const [groupKey, groupValue] of Object.entries(pkg.tokens)) {
			for (const [tokenKey, tokenValue] of Object.entries(groupValue)) {
				if (isSensitiveKeyName(tokenKey)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `Sensitive token key is not allowed: ${tokenKey}`,
						path: ["tokens", groupKey, tokenKey],
					});
				}

				if (typeof tokenValue === "string") {
					continue;
				}

				for (const nestedKey of Object.keys(tokenValue)) {
					if (isSensitiveKeyName(nestedKey)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: `Sensitive token key is not allowed: ${nestedKey}`,
							path: ["tokens", groupKey, tokenKey, nestedKey],
						});
					}
				}
			}
		}
	});

export const arkelythexThemePackageSchema = themePackageSchema;
export type ThemePackage = z.infer<typeof themePackageSchema>;
export type ArkelythexThemePackage = ThemePackage;

export const THEME_TOKEN_CSS_VARIABLES = {
	"foundation.surface": "--akx-foundation-surface",
	"foundation.ink": "--akx-foundation-ink",
	"foundation.accent": "--akx-foundation-accent",
	"semantic.bg.canvas": "--akx-semantic-bg-canvas",
	"semantic.text.primary": "--akx-semantic-text-primary",
	"semantic.text.muted": "--akx-semantic-text-muted",
	"semantic.accent.primary": "--akx-semantic-accent-primary",
	"semantic.accent.secondary": "--akx-semantic-accent-secondary",
	"semantic.border.default": "--akx-semantic-border-default",
	"semantic.border.subtle": "--akx-semantic-border-subtle",
	"component.button.background": "--akx-component-button-background",
} as const;

export type ThemeTokenName = keyof typeof THEME_TOKEN_CSS_VARIABLES;
export function isAllowedThemeTokenName(key: string): key is ThemeTokenName {
	return Object.hasOwn(THEME_TOKEN_CSS_VARIABLES, key);
}
