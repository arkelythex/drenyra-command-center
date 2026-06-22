import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS_CSS_PATH = join(
	import.meta.dirname,
	"..",
	"generated",
	"tokens.css",
);
const TOKENS_DTCG_PATH = join(import.meta.dirname, "..", "tokens.dtcg.json");

function readTokensCss(): string {
	return readFileSync(TOKENS_CSS_PATH, "utf-8");
}

describe("design tokens contract", () => {
	it("defines primitive, semantic, and legacy alias tiers in generated CSS", () => {
		const css = readTokensCss();

		expect(css).toContain("--color-primitive-onyx-0");
		expect(css).toContain("--color-bg-0");
		expect(css).toContain("--color-surface-1");
		expect(css).toContain("--text-primary");
		expect(css).toContain("--background:");
		expect(css).toContain("--foreground:");
	});

	it("exposes fiscal semantic state tokens", () => {
		const css = readTokensCss();

		for (const token of [
			"--color-success",
			"--color-warning",
			"--color-danger",
			"--color-info",
			"--color-sunat-success",
			"--color-sunat-warning",
			"--color-sunat-danger",
		]) {
			expect(css).toContain(token);
		}
	});

	it("keeps DTCG source with primitive and semantic sections", () => {
		const raw = readFileSync(TOKENS_DTCG_PATH, "utf-8");
		const dtcg = JSON.parse(raw) as {
			primitive?: Record<string, unknown>;
			semantic?: Record<string, unknown>;
		};

		expect(dtcg.primitive).toBeDefined();
		expect(dtcg.semantic).toBeDefined();
		expect(Object.keys(dtcg.primitive ?? {}).length).toBeGreaterThan(10);
		expect(Object.keys(dtcg.semantic ?? {}).length).toBeGreaterThan(5);
	});
});
