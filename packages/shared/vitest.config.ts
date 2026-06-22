import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["src/**/*.{test,spec}.{js,ts}"],
		pool: "forks",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.{test,spec}.{js,ts}", "src/**/index.ts"],
		},
	},
});
