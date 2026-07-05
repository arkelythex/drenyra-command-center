import { describe, expect, it } from "vitest";
import { transactionsRoutes } from "../../index";

describe("transactionsRoutes (smoke)", () => {
	it("should export an Elysia module", () => {
		expect(transactionsRoutes).toBeDefined();
	});
});
