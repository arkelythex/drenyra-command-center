import { describe, expect, it } from "vitest";
import { complianceModule } from "../../index";

describe("complianceModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(complianceModule).toBeDefined();
	});
});
