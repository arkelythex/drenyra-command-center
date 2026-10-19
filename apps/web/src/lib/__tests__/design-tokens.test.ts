import { describe, expect, it } from "vitest";
import {
	BORDER_RADIUS,
	MOTION_VARIANTS,
	tokensToClasses,
	useDesignTokens,
	Z_INDEX,
} from "../design-tokens";
import {
	applyAccentToDocument,
	applyDensityToDocument,
	applyThemePackageToElement,
	clearAccentFromDocument,
	clearDensityFromDocument,
	clearThemePackageFromElement,
	getPresetThemePackage,
} from "../design-tokens/theme-package";
import {
	ACCENT_PRESETS,
	drenyraThemePackageSchema,
	isAccentPreset,
	isDensityLevel,
} from "../design-tokens/theme-package.schema";

describe("design tokens", () => {
	it("references CSS variables instead of duplicating values", () => {
		expect(Z_INDEX.modal).toBe("var(--z-modal)");
		expect(BORDER_RADIUS.card).toBe("var(--radius-xl)");
	});

	it("defines springs with positive physics values", () => {
		for (const spring of [
			MOTION_VARIANTS.spring,
			MOTION_VARIANTS.springGentle,
		]) {
			expect(spring.stiffness).toBeGreaterThan(0);
			expect(spring.damping).toBeGreaterThan(0);
			expect(spring.mass).toBeGreaterThan(0);
		}
	});

	it("maps radius roles to literal Tailwind classes", () => {
		expect(tokensToClasses.borderRadius("card")).toBe(
			"rounded-[var(--radius-xl)]",
		);
	});

	it("exposes the same tokens through the hook", () => {
		const tokens = useDesignTokens();
		expect(tokens.zIndex).toBe(Z_INDEX);
		expect(tokens.borderRadius).toBe(BORDER_RADIUS);
	});
});

describe("theme package schema", () => {
	it("accepts a valid custom package", () => {
		const parsed = drenyraThemePackageSchema.safeParse({
			id: "custom",
			name: "Mine",
			colorScheme: "dark",
			variables: { "--accent": "#fff" },
		});
		expect(parsed.success).toBe(true);
	});

	it("rejects variable names that are not custom properties", () => {
		const parsed = drenyraThemePackageSchema.safeParse({
			id: "custom",
			name: "Mine",
			colorScheme: "dark",
			variables: { color: "red" },
		});
		expect(parsed.success).toBe(false);
	});

	it("guards accent and density values", () => {
		expect(ACCENT_PRESETS.every(isAccentPreset)).toBe(true);
		expect(isAccentPreset("neon")).toBe(false);
		expect(isDensityLevel("compact")).toBe(true);
		expect(isDensityLevel("huge")).toBe(false);
	});
});

describe("theme package application", () => {
	it("falls back to mono-dark for unknown presets", () => {
		expect(getPresetThemePackage("nope").id).toBe("mono-dark");
		expect(getPresetThemePackage("cocoa-light").colorScheme).toBe("light");
	});

	it("applies and fully clears package variables", () => {
		const el = document.createElement("div");
		el.style.setProperty("--keep", "1");
		applyThemePackageToElement(
			{ id: "c", name: "c", colorScheme: "dark", variables: { "--a": "red" } },
			el,
		);
		expect(el.style.getPropertyValue("--a")).toBe("red");
		clearThemePackageFromElement(el);
		expect(el.style.getPropertyValue("--a")).toBe("");
		expect(el.style.getPropertyValue("--keep")).toBe("1");
	});

	it("replaces the previous package's variables on re-apply", () => {
		const el = document.createElement("div");
		const make = (v: Record<string, string>) => ({
			id: "c",
			name: "c",
			colorScheme: "dark" as const,
			variables: v,
		});
		applyThemePackageToElement(make({ "--a": "1" }), el);
		applyThemePackageToElement(make({ "--b": "2" }), el);
		expect(el.style.getPropertyValue("--a")).toBe("");
		expect(el.style.getPropertyValue("--b")).toBe("2");
	});

	it("sets and clears accent and density on the document", () => {
		applyAccentToDocument("teal");
		applyDensityToDocument("compact");
		expect(document.documentElement.dataset.accent).toBe("teal");
		expect(document.documentElement.dataset.density).toBe("compact");
		clearAccentFromDocument();
		clearDensityFromDocument();
		expect(document.documentElement.dataset.accent).toBeUndefined();
		expect(document.documentElement.dataset.density).toBeUndefined();
	});
});
