import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const testDir = resolve(import.meta.dirname ?? ".");

describe("docs index redirect", () => {
	it("next.config declara /docs → /api permanente", () => {
		const configPath = join(testDir, "../../../next.config.mjs");
		const source = readFileSync(configPath, "utf8");
		expect(source).toContain('source: "/docs"');
		expect(source).toContain('destination: "/api"');
	});

	it("app/docs/page.tsx redirige a /api", () => {
		const pagePath = join(testDir, "../../../app/docs/page.tsx");
		const source = readFileSync(pagePath, "utf8");
		expect(source).toContain('redirect("/api")');
	});
});
