import { describe, expect, it } from "vitest";
import { taxationModule } from "../../index";

describe("taxationModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(taxationModule).toBeDefined();
	});
});
