import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["__tests__/**/*.{test,spec}.{ts,js}"],
		// Exclude pre-existing tests that use bun:test (incompatible with vitest).
		// Those files should be run with `bun test` instead.
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"__tests__/control-plane/approval-guard.test.ts",
			"__tests__/control-plane/contracts.test.ts",
			"__tests__/control-plane/observability-contracts.test.ts",
			"__tests__/control-plane/policy-resolution.test.ts",
			"__tests__/control-plane/sandbox-adapter.test.ts",
			"__tests__/control-plane/trace-evidence.test.ts",
		],
		pool: "forks",
	},
	resolve: {
		alias: {
			// Override root-level @drenyra/* alias to include the src/ directory
			// Root maps @drenyra → ./packages (missing src/)
			"@drenyra/persistence": path.resolve(__dirname, "../persistence/src"),
			"@drenyra/infrastructure": path.resolve(
				__dirname,
				"../infrastructure/src",
			),
			"@drenyra/ai": path.resolve(__dirname, "../ai/src"),
			"@drenyra/shared": path.resolve(__dirname, "../shared/src"),
			"@drenyra/application": path.resolve(__dirname, "../application/src"),
		},
	},
});
