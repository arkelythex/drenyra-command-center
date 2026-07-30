import { describe, expect, it } from "vitest";
import {
	CODEX_LIGHT_THEME,
	DEFAULT_CODEX_THEME,
} from "../../context/SettingsContext";
import { contrastRatio } from "../../lib/design-tokens/contrast";

function expectContrast(
	foreground: string,
	background: string,
	minimumRatio: number,
) {
	const ratio = contrastRatio(foreground, background);
	expect(ratio).not.toBeNull();
	expect(ratio).toBeGreaterThanOrEqual(minimumRatio);
}

function expectAaContrast(foreground: string, background: string) {
	expectContrast(foreground, background, 4.5);
}

describe("Drenyra Ledger OS themes", () => {
	it("exposes canonical Light Pearl and Black OLED themes", () => {
		expect(CODEX_LIGHT_THEME.name).toBe("Drenyra Light Pearl");
		expect(DEFAULT_CODEX_THEME.name).toBe("Drenyra Black OLED");
	});

	it("keeps Light Pearl primary, secondary, and metadata text readable", () => {
		expectAaContrast("#1D1A16", "#FFFFFF");
		expectAaContrast("#5C5347", "#FFFFFF");
		expectAaContrast("#7A7166", "#FFFFFF");
	});

	it("keeps Black OLED primary, secondary, and metadata text readable", () => {
		expectAaContrast("#F7F1E8", "#090807");
		expectAaContrast("#BDB3A6", "#090807");
		expectAaContrast("#81786E", "#090807");
	});

	it("keeps semantic labels and focus accents distinguishable", () => {
		for (const theme of [CODEX_LIGHT_THEME, DEFAULT_CODEX_THEME]) {
			expectAaContrast(theme.tokens.diffAdded, theme.tokens.surface);
			expectAaContrast(theme.tokens.diffRemoved, theme.tokens.surface);
			expectAaContrast(theme.tokens.warning, theme.tokens.surface);
			expectAaContrast(theme.tokens.info, theme.tokens.surface);
			expectContrast(theme.tokens.accent, theme.tokens.surface, 3);
		}
	});

	it("does not retain cyan/violet legacy defaults in canonical themes", () => {
		expect(CODEX_LIGHT_THEME.tokens.accent).toBe("#B87333");
		expect(DEFAULT_CODEX_THEME.tokens.accent).toBe("#D39A5A");
	});
});
