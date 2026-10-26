import { afterEach, describe, expect, it } from "vitest";
import {
	normalizeThemePreference,
	readPersistedThemePreference,
	THEME_ID,
	THEME_PREFERENCE,
	UI_STORAGE_KEY,
} from "../ux-mode";

afterEach(() => window.localStorage.clear());

describe("theme preference defaults", () => {
	it("follows the operating system when nothing was chosen", () => {
		expect(normalizeThemePreference(undefined)).toBe(THEME_PREFERENCE.SYSTEM);
		expect(normalizeThemePreference("not-a-theme")).toBe(
			THEME_PREFERENCE.SYSTEM,
		);
		expect(readPersistedThemePreference()).toBe(THEME_PREFERENCE.SYSTEM);
	});

	it("keeps an explicit choice", () => {
		expect(normalizeThemePreference("light")).toBe(THEME_ID.LIGHT);
		expect(normalizeThemePreference("dark")).toBe(THEME_ID.MONO_DARK);
		window.localStorage.setItem(
			UI_STORAGE_KEY,
			JSON.stringify({ state: { themePreference: "cocoa-light" } }),
		);
		expect(readPersistedThemePreference()).toBe(THEME_ID.LIGHT);
	});
});
