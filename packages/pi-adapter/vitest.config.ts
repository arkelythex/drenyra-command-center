import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
		exclude: ["node_modules", "dist"],
	},
	resolve: {
		alias: {
			"@drenyra/fiscal-agent-domain": path.resolve(
				__dirname,
				"../fiscal-agent-domain/src",
			),
		},
	},
});
