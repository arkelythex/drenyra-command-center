import { describe, expect, it } from "vitest";

/**
 * Smoke test: every module that imports the shared logger must be loadable.
 * These nine modules used to import `../logger`, which does not exist
 * (the logger lives in `src/services/logger.ts`), so importing them threw.
 */
const MODULES = [
	"../src/gateway/credential.manager",
	"../src/gateway/budget-enforcer",
	"../src/gateway/service",
	"../src/gateway/gateway.service",
	"../src/gateway/rate-limiter",
	"../src/gateway/failover.service",
	"../src/agents/index",
	"../src/context-monitor/context-monitor",
	"../src/context-monitor/context-pruner",
];

describe("packages/ai module resolution", () => {
	it.each(MODULES)("%s can be imported", async (path) => {
		await expect(import(/* @vite-ignore */ path)).resolves.toBeDefined();
	});
});

describe("logger imports", () => {
	it("no module imports a logger path that does not exist", async () => {
		const { readdirSync, readFileSync, statSync, existsSync } = await import(
			"node:fs"
		);
		const { dirname, join, resolve } = await import("node:path");
		const root = resolve(__dirname, "../src");
		const bad: string[] = [];
		const walk = (dir: string): void => {
			for (const name of readdirSync(dir)) {
				const full = join(dir, name);
				if (statSync(full).isDirectory()) walk(full);
				else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) {
					for (const m of readFileSync(full, "utf8").matchAll(
						/from "(\.[^"]*logger)"/g,
					)) {
						const target = resolve(dirname(full), m[1]);
						if (
							!existsSync(`${target}.ts`) &&
							!existsSync(join(target, "index.ts"))
						)
							bad.push(`${full} -> ${m[1]}`);
					}
				}
			}
		};
		walk(root);
		expect(bad).toEqual([]);
	});
});
