import { describe, expect, it } from "vitest";
import { buildDreamcoderThemeCss, DREAMCODER_ROLES } from "../dreamcoder-theme";

const mode = (overrides: Record<string, unknown> = {}) => ({
	bg: "#000000",
	bg_soft: "#0B0B0B",
	surface0: "#0B0B0B",
	surface1: "#0D0D0F",
	surface2: "#1F1F1F",
	surface3: "#2E2E2E",
	text: "#E6E6E6",
	text_heading: "#F5F5F5",
	muted: "#C7C7C7",
	subtle: "#A7A7A7",
	disabled: "#A7A7A7",
	border_ui: "#767676",
	border_hi: "#A7A7A7",
	focus: "#3B82F6",
	accent: "#A5B4FC",
	accent_2: "#D4B5FD",
	on_accent: "#000000",
	on_error: "#000000",
	link: "#A5B4FC",
	link_hover: "#D4B5FD",
	success: "#34D399",
	warning: "#FBBF24",
	error: "#FB8585",
	info: "#7DD3FC",
	selection_bg: "#3A3A3A",
	selection_fg: "#E6E6E6",
	hover: "#3A3A3A",
	pressed: "#1F1F1F",
	overlay: "rgba(0, 0, 0, 0.64)",
	scrim: "rgba(0, 0, 0, 0.78)",
	aliases: { border_subtle: "#1F1F1F", border_medium: "#3A3A3A" },
	...overrides,
});

const tokens = {
	modes: {
		dark: mode(),
		light: mode({
			bg: "#f3eadc",
			surface0: "#fff7ea",
			surface1: "#decbb1",
			surface2: "#c8ad89",
			accent: "#824f16",
		}),
	},
};

describe("buildDreamcoderThemeCss", () => {
	it("emits every role for dark (default and .force-dark) and light", () => {
		const css = buildDreamcoderThemeCss(tokens, "tokens.json@abc123");

		expect(css).toContain(":root,\n.force-dark {");
		expect(css).toContain(".light {");
		for (const role of Object.keys(DREAMCODER_ROLES)) {
			expect(css.match(new RegExp(`--dc-${role}:`, "g"))).toHaveLength(2);
		}
		expect(css).toContain("tokens.json@abc123");
	});

	it("maps raised surfaces per mode: panel in dark, lightest layer in light", () => {
		const css = buildDreamcoderThemeCss(tokens, "src");
		const [dark, light] = css.split(".light {");

		expect(dark).toContain("--dc-raised: #0D0D0F;");
		expect(light).toContain("--dc-raised: #fff7ea;");
		expect(dark).toContain("--dc-hairline: #3A3A3A;");
		expect(light).toContain("--dc-hairline: #c8ad89;");
	});

	it("emits rgb triplets for colors used with alpha", () => {
		const css = buildDreamcoderThemeCss(tokens, "src");
		expect(css).toContain("--dc-accent-rgb: 165 180 252;");
	});

	it("fails loudly when the source is missing a token", () => {
		const broken = {
			modes: { dark: mode({ accent: undefined }), light: mode() },
		};
		expect(() => buildDreamcoderThemeCss(broken, "src")).toThrow(
			/dark.*accent/,
		);
	});
});
