import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@drenyra/mission-domain": path.resolve(
				__dirname,
				"../../packages/mission-domain/src",
			),
			"@drenyra/test-utils": path.resolve(
				__dirname,
				"../../packages/test-utils/src",
			),
		},
	},
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/__tests__/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
			"**/*.e2e.spec.{ts,tsx}",
			"**/*.spec.{ts,tsx}",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "json-summary"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules/",
				"src/test/",
				"src/__tests__/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/mockData",
				"**/*.test.{ts,tsx}",
				"**/*.e2e.spec.{ts,tsx}",
			],
			thresholds: {
				global: {
					lines: 70,
					functions: 65,
					branches: 60,
					statements: 70,
				},
			},
		},
	},
});
