import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "happy-dom",
		include: [
			"lib/**/*.{test,spec}.{ts,tsx}",
			"components/**/*.{test,spec}.{ts,tsx}",
		],
		exclude: [...configDefaults.exclude],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
		},
		dedupe: ["react", "react-dom"],
	},
});
