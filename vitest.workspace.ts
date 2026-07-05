/**
 * Drenyra Vitest Workspace Configuration
 *
 * Defines all workspace projects for monorepo-wide test execution.
 * Run `bun vitest run` from root to execute all tests across every package.
 *
 * Each project with a local vitest.config.ts (apps/api, apps/web, apps/landing,
 * packages/domain, packages/application) automatically inherits its own
 * configuration (timeouts, coverage, aliases, etc.).
 *
 * Projects without a local config fall back to the root vitest.config.ts.
 *
 * @usage
 * ```bash
 * # Run all tests
 * bun vitest run
 *
 * # Run with coverage
 * bun vitest run --coverage
 *
 * # Run a specific project
 * bun vitest run --project domain
 * ```
 */
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	// --- Apps ---
	"apps/api",
	"apps/web",
	"apps/landing",

	// --- Packages ---
	"packages/domain",
	"packages/application",
	"packages/persistence",
	"packages/infrastructure",
	"packages/shared",
	"packages/memory",
	"packages/ai",
	"packages/agents",
]);
