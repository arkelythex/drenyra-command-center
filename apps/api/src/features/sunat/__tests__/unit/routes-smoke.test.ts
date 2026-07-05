import { describe, expect, it } from "vitest";
import { sunatApiModule } from "../../index";

describe("sunatApiModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(sunatApiModule).toBeDefined();
	});
});
