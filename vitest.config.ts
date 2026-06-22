/**
 * ARKELYTHEX Root Vitest Configuration
 *
 * Workspace configuration for Vitest in monorepo.
 * Best practices for 2026: centralized config, shared coverage, workspace projects.
 *
 * Run tests:
 * - Root: bun vitest run (runs all projects)
 * - Per package: cd apps/api && bun vitest run
 * - With coverage: bun vitest run --coverage
 */
import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Global settings for all projects
		globals: true,
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		exclude: [
			...configDefaults.exclude,
			"**/node_modules/**",
			"**/_deprecated/**",
			"**/worktrees/**",
			"**/e2e/**",
		],
		// Coverage configuration for monorepo
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "./coverage",
			// Monorepo: include all packages
			include: [
				"apps/api/src/**/*.{ts,tsx}",
				"apps/web/src/**/*.{ts,tsx}",
				"packages/**/src/**/*.{ts,tsx}",
			],
			exclude: [
				...configDefaults.exclude,
				"**/*.d.ts",
				"**/*.config.ts",
				"**/node_modules/**",
				"**/dist/**",
				"**/build/**",
				"**/__tests__/**",
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/test/**",
				"**/tests/**",
				// Exclude mock files
				"**/test/stubs/**",
				"**/__mocks__/**",
			],
			// Per-project thresholds
			thresholds: {
				global: {
					lines: 60,
					functions: 60,
					branches: 55,
					statements: 60,
				},
				// Per-package specific thresholds
				"apps/api/src/features/banking/**/*.ts": {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
				"apps/api/src/features/taxation/**/*.ts": {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
				// Domain package: fiscal correctness is safety-critical, must be 100%
				"packages/domain/src/**/*.ts": {
					lines: 100,
					functions: 100,
					branches: 100,
					statements: 100,
				},
			},
		},
		// Setup files (can be overridden by individual projects)
		// setupFiles: ['./tests/setup-global.ts'],
		// Test timeout
		testTimeout: 30000,
		hookTimeout: 30000,
	},
	resolve: {
		alias: [
			// Use array-of-objects with prefix matching.
			// More specific package aliases MUST come before the catch-all @arkelythex.
			// This ensures subpath exports like @arkelythex/infrastructure/services/error-recovery
			// resolve to ./packages/infrastructure/src/services/error-recovery (with src/).
			{ find: "@", replacement: path.resolve(__dirname, "./") },
			{
				find: "@arkelythex/persistence",
				replacement: path.resolve(__dirname, "./packages/persistence/src"),
			},
			{
				find: "@arkelythex/infrastructure",
				replacement: path.resolve(__dirname, "./packages/infrastructure/src"),
			},
			{
				find: "@arkelythex/application",
				replacement: path.resolve(__dirname, "./packages/application/src"),
			},
			{
				find: "@arkelythex/ai",
				replacement: path.resolve(__dirname, "./packages/ai/src"),
			},
			{
				find: "@arkelythex/domain",
				replacement: path.resolve(__dirname, "./packages/domain/src"),
			},
			{
				find: "@arkelythex/shared",
				replacement: path.resolve(__dirname, "./packages/shared/src"),
			},
			{
				find: "@arkelythex/agent-memory",
				replacement: path.resolve(__dirname, "./packages/agent-memory/src"),
			},
			{
				find: "@arkelythex/drenyra-core",
				replacement: path.resolve(__dirname, "./packages/drenyra-core/src"),
			},
			{
				find: "@arkelythex/platform-core",
				replacement: path.resolve(__dirname, "./packages/platform-core/src"),
			},
			// Catch-all for any @arkelythex/* subpath not matched above
			{
				find: "@arkelythex/test-utils",
				replacement: path.resolve(__dirname, "./packages/test-utils/src"),
			},
			{
				find: "@arkelythex",
				replacement: path.resolve(__dirname, "./packages"),
			},
		],
	},
});
