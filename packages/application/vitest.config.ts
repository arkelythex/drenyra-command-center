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
					lines: 70,
					functions: 70,
					branches: 70,
					statements: 70,
				},
			},
		},
		// Integration tests need real DB — only run when DATABASE_URL_TEST is set
		exclude: ["src/**/*.integration.test.ts", "src/**/*.integration.spec.ts"],
	},
});
