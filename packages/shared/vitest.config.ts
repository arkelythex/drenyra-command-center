import { defineConfig } from "vitest/config";

export default defineConfig({
	// Prefer .ts over stale compiled .js committed next to sources, so tests
	// exercise the real source (see odd/tasks/typecheck-baseline.md).
	resolve: {
		extensions: [".ts", ".tsx", ".mts", ".js", ".mjs", ".json"],
	},
	test: {
		globals: true,
		include: ["src/**/*.{test,spec}.{js,ts}"],
		pool: "forks",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.{test,spec}.{js,ts}", "src/**/index.ts"],
			thresholds: {
				global: {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
			},
		},
	},
});
