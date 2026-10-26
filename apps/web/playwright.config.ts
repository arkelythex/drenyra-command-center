import { defineConfig, devices } from "@playwright/test";

// Must match vite.config.ts (`WEB_PORT`, default 5174, strictPort).
const port = Number(process.env.WEB_PORT || 5174);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
	},
	snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
	use: {
		baseURL,
		// Deterministic screenshots; the app honors this through MotionConfig.
		contextOptions: { reducedMotion: "reduce" },
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "desktop-chrome",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "mobile-android",
			use: { ...devices["Pixel 7"] },
		},
		{
			// iPhone 15 metrics on Chromium: WebKit is not installed in every environment.
			name: "mobile-ios",
			use: {
				...devices["iPhone 15"],
				browserName: "chromium",
				defaultBrowserType: "chromium",
			},
		},
	],
	webServer: {
		command: "bun run dev",
		url: baseURL,
		env: { WEB_PORT: String(port) },
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
