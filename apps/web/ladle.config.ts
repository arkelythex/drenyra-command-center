import { defineConfig } from "@ladle/react";

export default defineConfig({
	title: "Drenyra Design System",
	description: "Component library documentation for ARKELYTHEX",
	addons: {
		a11y: true,
		backgrounds: true,
		controls: true,
		darkMode: true,
		source: true,
		storySource: true,
	},
	storybookState: "./.ladle",
});
