import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	bootstrapPersistedTheme,
	getResolvedThemeId,
	normalizeThemePreference,
	readPersistedThemePreference,
	syncThemeDocumentState,
	UI_STORAGE_KEY,
} from "../ux-mode";

describe("theme runtime", () => {
	beforeEach(() => {
		document.documentElement.className = "";
		document.documentElement.removeAttribute("data-theme");
		document.documentElement.removeAttribute("data-color-scheme");
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	it("normalizes legacy and canonical values to theme preferences", () => {
		expect(normalizeThemePreference("cyberpunk")).toBe("mono-dark");
		expect(normalizeThemePreference("dark")).toBe("mono-dark");
		expect(normalizeThemePreference("light")).toBe("cocoa-light");
		expect(normalizeThemePreference("cocoa-dark")).toBe("mono-dark");
		expect(normalizeThemePreference("system")).toBe("system");
	});

	it("reads the persisted preference from storage", () => {
		window.localStorage.setItem(
			UI_STORAGE_KEY,
			JSON.stringify({ state: { uxMode: "cyberpunk" } }),
		);

		expect(readPersistedThemePreference()).toBe("mono-dark");
	});

	it("falls back to Light Pearl when persisted state is invalid", () => {
		window.localStorage.setItem(UI_STORAGE_KEY, "{invalid-json");

		expect(readPersistedThemePreference()).toBe("cocoa-light");
	});

	it("resolves system preference to cocoa-light when system is light", () => {
		expect(getResolvedThemeId("system", false)).toBe("cocoa-light");
	});

	it("syncs Black OLED dataset and compatibility classes", () => {
		syncThemeDocumentState("mono-dark");

		expect(document.documentElement.dataset.theme).toBe("mono-dark");
		expect(document.documentElement.dataset.ledgerTheme).toBe("black-oled");
		expect(document.documentElement.dataset.colorScheme).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(document.documentElement.classList.contains("theme-mono-dark")).toBe(
			true,
		);
	});

	it("bootstraps the persisted preference into the document", () => {
		window.localStorage.setItem(
			UI_STORAGE_KEY,
			JSON.stringify({ state: { uxMode: "light" } }),
		);

		bootstrapPersistedTheme();

		expect(document.documentElement.dataset.theme).toBe("cocoa-light");
		expect(document.documentElement.classList.contains("light")).toBe(true);
	});
});
