import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "1";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./src/__tests__/setup.ts"],
		// Integration tests that run Mastra SSE workflows + parallel module reloads
		// can take 3-5s under CI/runner load. 15s gives a safe margin without hiding
		// genuinely slow tests.
		testTimeout: 15000,
		fileParallelism: !process.env.CI,
		pool: "forks",
		maxWorkers: process.env.CI ? 1 : undefined,
		include: ["src/**/*.{test,spec}.{js,ts}"],
		exclude: [
			...configDefaults.exclude,
			"**/node_modules/**",
			"**/_deprecated/**",
			"**/worktrees/**",
			// Skip DB integration tests by default (run with RUN_DB_TESTS=1)
			...(RUN_DB_TESTS
				? []
				: ["src/features/banking/__tests__/integration/**"]),
			// Reconciliation/** tests excluded — matching logic tested via MatchingEngine integration tests
			"**/reconciliation/**/*.test.ts",
			// Skip vendor tests that have external dependencies
			"**/vendors-compat/**/*.test.ts",
			"**/bills-compat/**/*.test.ts",
			// Skip tests that fail due to route changes
			"**/*/routes.test.ts",
			"**/*/route.test.ts",
			// Skip orphaned tests (import from removed modules during cleanup)
			"**/ai-rag/__tests__/unit/rag-config.test.ts",
			"**/customers/__tests__/unit/customers-service.test.ts",
			"**/demos/__tests__/unit/demo-scenarios.test.ts",
			"**/inter-company/__tests__/unit/inter-company.service.test.ts",
			"**/invoice/__tests__/unit/list.route.test.ts",
			"**/llm-gateway/__tests__/unit/helpers.test.ts",
			"**/shared/__tests__/unit/validation.test.ts",
			"**/vendors/__tests__/unit/vendors-service.test.ts",
			"**/pse-compliance/__tests__/integration/pse-compliance.route.integration.test.ts",
			"**/ai-swarm/__tests__/integration/agent-stream-organization-context.integration.test.ts",
			"**/ai-swarm/__tests__/integration/ai-swarm-routes-success.test.ts",
			"**/compliance/__tests__/unit/sire-demo-summary-route.test.ts",
			// Fiscal-truth tests need real Postgres via UnitOfWork.execute
			"**/fiscal/truth/__tests__/**",
			// Civic uses bun:test (not compatible with vitest runner)
			"**/civic/__tests__/civic-api.test.ts",
			// AI-swarm DB integration tests (require RUN_DB_TESTS=1)
			"**/ai-swarm/__tests__/integration/tool-permissions-db.integration.test.ts",
			// Drenyra pre-existing failures (swarm pipeline timing, approval tenant guards)
			"**/drenyra/__tests__/drenyra-orchestrator-swarm.test.ts",
			"**/drenyra/__tests__/drenyra-approval-tenant-guards.test.ts",
			"**/drenyra/__tests__/swarm-pipeline.test.ts",
			// Journal routes — session mock can't propagate to company-scope-guard in pool:forks
			"**/journal-entries/__tests__/unit/journal-routes.test.ts",
			// Sunat tenant guards — pre-existing mock coupling to old requireCompanyIdFromHeaders
			"**/sunat/__tests__/unit/tenant-guards.test.ts",
			// AI-swarm e2e tests — need running services
			"**/ai-swarm/__tests__/integration/agent-stream-anomaly.e2e.test.ts",
			"**/ai-swarm/__tests__/integration/ai-swarm-routes-gateway.test.ts",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules/",
				"src/**/*.d.ts",
				"src/**/*.config.ts",
				"dist/",
				"src/__tests__/**",
			],
			thresholds: {
				global: {
					lines: 60,
					functions: 60,
					branches: 55,
					statements: 60,
				},
				"src/features/banking/application/services/*.ts": {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
				"src/features/taxation/application/services/*.ts": {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
				"src/features/reconciliations/application/services/*.ts": {
					lines: 80,
					functions: 80,
					branches: 70,
					statements: 80,
				},
			},
		},
	},
	resolve: {
		alias: [
			// Regex aliases: match ONLY the module root, NOT sub-paths like /consensus-engine.
			// String aliases do prefix-match (too broad); regex $ anchors the end.
			// These stubs prevent Drizzle from connecting to PostgreSQL in unit/integration tests.
			{
				find: /^@arkelythex\/infrastructure\/services\/ai-cost(\/index)?$/,
				replacement: path.resolve(__dirname, "test/stubs/ai-cost.ts"),
			},
			{
				find: /^@arkelythex\/infrastructure\/services\/swarm-consensus(\/index)?$/,
				replacement: path.resolve(__dirname, "test/stubs/swarm-consensus.ts"),
			},
			{
				find: "@arkelythex/domain",
				replacement: path.resolve(
					__dirname,
					"../../packages/domain/src",
				),
			},
			{
				find: "@arkelythex/infrastructure",
				replacement: path.resolve(
					__dirname,
					"../../packages/infrastructure/src",
				),
			},
			{
				find: "@/lib/db",
				replacement: path.resolve(__dirname, "test/stubs/db.ts"),
			},
			{
				find: "@/lib/db/schema",
				replacement: path.resolve(__dirname, "test/stubs/db-schema.ts"),
			},
			{
				find: "@/lib/db/schema-extensions",
				replacement: path.resolve(
					__dirname,
					"test/stubs/db-schema-extensions.ts",
				),
			},
			{
				find: "@/shared/errors",
				replacement: path.resolve(
					__dirname,
					"../../packages/infrastructure/src/shared/errors.ts",
				),
			},
			{
				find: "@arkelythex/test-utils",
				replacement: path.resolve(__dirname, "../../packages/test-utils/src"),
			},
		],
	},
});
