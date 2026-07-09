import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: [
			"__tests__/**/*.{test,spec}.{js,ts}",
			"src/**/__tests__/**/*.{test,spec}.{js,ts}",
		],
		pool: "forks",
	},	},

		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.{test,spec}.{js,ts}", "src/**/index.ts"],
			thresholds: {
				global: {
					lines: 80,
					functions: 80,
					branches: 80,
					statements: 80,
				},
			},
		},

});
