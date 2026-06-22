import { describe, expect, it } from "vitest";
import { invoiceRoutes } from "../../api/routes";

describe("invoiceRoutes (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(invoiceRoutes).toBeDefined();
	});
});
