import { describe, expect, it } from "vitest";
import { reportsModule } from "../../index";

describe("reportsModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(reportsModule).toBeDefined();
	});
});
