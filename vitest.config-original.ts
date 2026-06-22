import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			include: [
				// Domain layer: 100% coverage target
				"src/domain/**/*.ts",
				// Application layer: 80% coverage target (hooks, use-cases)
				"src/application/**/*.ts",
				"src/components/features/**/hooks/**/*.{ts,tsx}",
				"src/components/features/**/containers/**/*.{ts,tsx}",
				"src/components/features/**/utils/**/*.ts",
				// UI layer: 60% coverage target (components, views)
				"src/components/features/**/components/**/*.{ts,tsx}",
				"src/components/features/**/views/**/*.{ts,tsx}",
			],
			exclude: [
				"node_modules/",
				"dist/",
				".next/",
				"**/*.config.*",
				"**/*.test.*",
				"**/__tests__/**",
				"**/*.stories.*",
				// Excluir infrastructure (0% coverage)
				"src/infrastructure/**",
				"src/lib/db/**",
				"src/repositories/**",
				// Excluir archivos de barril/índice
				"**/index.ts",
				// Excluir archivos de contenido principal (entry points)
				"**/*-content.tsx",
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 65,
				statements: 70,
			},
		},
	},
	resolve: {
		alias: {
			// Coincidir con tsconfig.json: @/* -> ./src/*
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
