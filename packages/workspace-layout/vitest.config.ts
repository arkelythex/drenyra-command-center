import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		globals: true,
	},
	resolve: {
		alias: {
			"@drenyra/workspace-domain": path.resolve(
				__dirname,
				"../workspace-domain/src",
			),
		},
	},
});
