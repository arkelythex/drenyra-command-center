import { describe, expect, it } from "vitest";
import { reconciliationsModule } from "../../index";

describe("reconciliationsModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(reconciliationsModule).toBeDefined();
	});
});
