import { beforeEach, describe, expect, it } from "vitest";
import { THEME_PREFERENCE, UI_STORAGE_KEY } from "@/lib/ux-mode";
import { useUIStore } from "../ui.store";

const html = document.documentElement;

beforeEach(() => {
	localStorage.clear();
	html.removeAttribute("data-accent");
	html.removeAttribute("data-density");
	useUIStore.setState({
		themePreference: THEME_PREFERENCE.SYSTEM,
		accentPreference: null,
		densityPreference: null,
	});
});

describe("useUIStore appearance", () => {
	it("applies the accent to the document and clears it on null", () => {
		useUIStore.getState().setAccentPreference("teal");
		expect(html.dataset.accent).toBe("teal");
		useUIStore.getState().setAccentPreference(null);
		expect(html.dataset.accent).toBeUndefined();
	});

	it("applies density to the document", () => {
		useUIStore.getState().setDensityPreference("compact");
		expect(html.dataset.density).toBe("compact");
	});

	it("applies an explicit theme to the document", () => {
		useUIStore.getState().setThemePreference(THEME_PREFERENCE.LIGHT);
		expect(html.classList.contains("light")).toBe(true);
		useUIStore.getState().setThemePreference(THEME_PREFERENCE.DARK);
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.classList.contains("light")).toBe(false);
	});

	it("persists only appearance under the key ux-mode reads", () => {
		useUIStore.getState().setAccentPreference("sage");
		useUIStore.getState().setRightRailOpen(true);
		const saved = JSON.parse(localStorage.getItem(UI_STORAGE_KEY) ?? "{}");
		expect(saved.state.accentPreference).toBe("sage");
		expect(saved.state.isRightRailOpen).toBeUndefined();
	});
});
