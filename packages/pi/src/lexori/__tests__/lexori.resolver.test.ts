import { describe, expect, it } from "vitest";
import { LexoriSkillResolver } from "../lexori.resolver";

describe("LexoriSkillResolver", () => {
	const resolver = new LexoriSkillResolver();

	it("resolves context for eviden agent (SUNAT CPE + SIRE)", async () => {
		const result = await resolver.resolveForAgent("eviden", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(2);
		const categories = result.map((r) => r.category);
		expect(categories).toContain("sunat-cpe");
		expect(categories).toContain("sunat-sire");
		for (const ctx of result) {
			expect(ctx.renderedContext).toContain("20123456789");
			expect(ctx.renderedContext).toContain("2026-06");
			expect(ctx.version).toBe("2026.1");
		}
	});

	it("resolves context for vigila agent (IGV + detractions + retentions)", async () => {
		const result = await resolver.resolveForAgent("vigila", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(3);
		const categories = result.map((r) => r.category);
		expect(categories).toContain("fiscal-igv");
		expect(categories).toContain("fiscal-detractions");
		expect(categories).toContain("fiscal-retentions");
	});

	it("resolves context for traza agent (SIRE + NIIF)", async () => {
		const result = await resolver.resolveForAgent("traza", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(2);
		expect(result[0].category).toBe("sunat-sire");
		expect(result[1].category).toBe("niif-pcge");
	});

	it("resolves context for numina agent (NIIF only)", async () => {
		const result = await resolver.resolveForAgent("numina", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(1);
		expect(result[0].category).toBe("niif-pcge");
	});

	it("returns empty array for unknown agent", async () => {
		const result = await resolver.resolveForAgent("unknown", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toEqual([]);
	});
});
