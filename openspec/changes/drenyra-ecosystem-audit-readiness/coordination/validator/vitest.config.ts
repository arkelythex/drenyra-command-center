/** Focused vitest config for the coordination validator suite (U1b+); avoids the root config's bare `{}` alias entry that crashes module resolution (pre-existing; C3 documents fixing vitest.workspace). */
import { defineConfig } from "vitest/config";
export default defineConfig({
	test: {
		globals: false,
		pool: "forks",
		include: ["**/*.test.ts"],
		environment: "node",
	},
});
