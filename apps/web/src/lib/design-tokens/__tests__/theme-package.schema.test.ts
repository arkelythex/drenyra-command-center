import { describe, expect, it } from "vitest";
import {
	themePackageSchema,
	THEME_PACKAGE_SCHEMA_ID,
	isAllowedColorValue,
} from "../theme-package.schema";

describe("themePackageSchema", () => {
	it("accepts schema drenyra.theme.v1 with foundation/semantic/component", () => {
		const result = themePackageSchema.parse({
			schema: THEME_PACKAGE_SCHEMA_ID,
			tokens: {
				foundation: {
					"color.brand.500": "#1A2B3C",
				},
				semantic: {
					"text.primary": "rgb(34, 34, 34)",
				},
				component: {
					button: {
						background: "oklch(62% 0.15 248)",
					},
				},
			},
		});

		expect(result.schema).toBe(THEME_PACKAGE_SCHEMA_ID);
	});

	it("rejects sensitive keys", () => {
		expect(() =>
			themePackageSchema.parse({
				schema: THEME_PACKAGE_SCHEMA_ID,
				tokens: {
					foundation: {
						companyId: "#000000",
					},
					semantic: {},
					component: {},
				},
			}),
		).toThrow(/Sensitive token key/i);
	});

	it("rejects unsupported color values", () => {
		expect(() =>
			themePackageSchema.parse({
				schema: THEME_PACKAGE_SCHEMA_ID,
				tokens: {
					foundation: {
						"color.bad": "hsl(0 0% 0%)",
					},
					semantic: {},
					component: {},
				},
			}),
		).toThrow(/Unsupported color token format/i);
	});
});

describe("isAllowedColorValue", () => {
	it("accepts conservative allowlist formats", () => {
		expect(isAllowedColorValue("#fff")).toBe(true);
		expect(isAllowedColorValue("rgb(0, 0, 0)")).toBe(true);
		expect(isAllowedColorValue("oklch(0.75 0.2 220 / 0.9)")).toBe(true);
		expect(isAllowedColorValue("color-mix(in srgb, #fff, #000 30%)")).toBe(true);
		expect(isAllowedColorValue("var(--color-brand-500)")).toBe(true);
	});

	it("rejects non-allowlisted color syntax", () => {
		expect(isAllowedColorValue("hsl(200 50% 40%)")).toBe(false);
		expect(isAllowedColorValue("javascript:alert(1)")).toBe(false);
	});
});
