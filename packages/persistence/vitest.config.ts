import { defineConfig } from "vitest/config";

export default defineConfig({
	// Prefer .ts over stale compiled .js committed next to sources, so tests
	// exercise the real source (see odd/tasks/typecheck-baseline.md).
	resolve: {
		extensions: [".ts", ".tsx", ".mts", ".js", ".mjs", ".json"],
	},
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
	},
});
