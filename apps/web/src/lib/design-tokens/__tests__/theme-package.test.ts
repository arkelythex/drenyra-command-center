import { describe, expect, it } from "vitest";
import {
	isThemePackage,
	parseThemePackageJson,
	stringifyThemePackage,
	tryParseThemePackage,
} from "../theme-package";

describe("theme-package helpers", () => {
	const validPackage = {
		schema: "codex-theme-v1",
		colorScheme: "dark",
		metadata: {
			name: "Codex Theme",
			version: "1.0.0",
		},
		tokens: {
			foundation: {
				"color.base": "#ffffff",
			},
			semantic: {},
			component: {},
		},
	} as const;

	it("parses JSON payloads", () => {
		expect(parseThemePackageJson(JSON.stringify(validPackage))).toMatchObject(
			validPackage,
		);
	});

	it("serializes validated package", () => {
		const json = stringifyThemePackage(validPackage);
		expect(JSON.parse(json)).toMatchObject(validPackage);
	});

	it("returns null for invalid package in tryParse", () => {
		expect(tryParseThemePackage({ schema: "bad" })).toBeNull();
	});

	it("exposes type guard", () => {
		expect(isThemePackage(validPackage)).toBe(true);
		expect(isThemePackage({ schema: "bad" })).toBe(false);
	});
});
