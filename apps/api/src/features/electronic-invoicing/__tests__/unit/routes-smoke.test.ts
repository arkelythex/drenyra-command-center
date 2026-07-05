import { describe, expect, it } from "vitest";
import { electronicInvoicingModule } from "../../index";

describe("electronicInvoicingModule (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(electronicInvoicingModule).toBeDefined();
	});
});
