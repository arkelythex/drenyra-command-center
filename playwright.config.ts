/**
 * Playwright Configuration for Drenyra product E2E tests
 */
import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const SKIP_WEBSERVER = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;
const PORT = process.env.PORT || "5174";
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? 2 : 0,
	workers: CI ? 1 : undefined,
	timeout: CI ? 60_000 : 30_000,
	expect: {
		timeout: 15_000,
	},
	reporter: [
		[
			"html",
			{ outputFolder: "test-results/html", open: CI ? "never" : "on-failure" },
		],
		["list"],
	],
	outputDir: "./test-results/screenshots",
	globalSetup: "./e2e/global-setup.ts",
	globalTeardown: "./e2e/global-teardown.ts",
	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	...(SKIP_WEBSERVER
		? {}
		: {
				webServer: {
					command: `bun run --cwd apps/web dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
					url: BASE_URL,
					reuseExistingServer: !CI,
					timeout: 120_000,
				},
			}),
});
