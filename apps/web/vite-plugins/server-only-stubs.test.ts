import { describe, expect, it } from "vitest";
import { serverOnlyStubsPlugin } from "./server-only-stubs";

const plugin = serverOnlyStubsPlugin();
const resolveId = plugin.resolveId as (id: string) => string | null;
const load = plugin.load as (id: string) => string | null;

describe("serverOnlyStubsPlugin", () => {
	it("only runs on the dev server; the build drops these imports instead", () => {
		expect(plugin.apply).toBe("serve");
	});

	it.each(["node:crypto", "crypto"])("stands in for %s", (id) => {
		const stub = resolveId(id);
		expect(stub).toBeTruthy();
		expect(load(stub as string)).toContain("export function createHash");
	});

	it("leaves every other import alone", () => {
		expect(resolveId("react")).toBeNull();
		expect(load("/src/main.tsx")).toBeNull();
	});

	it("fails loudly if the browser really calls the server-only code", async () => {
		const source = load(resolveId("node:crypto") as string) as string;
		const mod = await import(
			`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
		);
		expect(() => mod.createHash("sha256")).toThrow(
			/solo.*servidor|server-only/i,
		);
	});
});
