import { describe, expect, it } from "vitest";
import { buildProductDefaultValues } from "../constants";

describe("buildProductDefaultValues", () => {
	it("uses the active company for new products", () => {
		expect(buildProductDefaultValues("company-products-1")).toEqual(
			expect.objectContaining({
				companyId: "company-products-1",
				taxType: "GRAVADO",
				unit: "UND",
				status: "active",
			}),
		);
	});

	it("preserves an explicit companyId when editing an existing product", () => {
		expect(
			buildProductDefaultValues("company-products-1", {
				companyId: "company-products-2",
				name: "Producto existente",
			}),
		).toEqual(
			expect.objectContaining({
				companyId: "company-products-2",
				name: "Producto existente",
			}),
		);
	});
});
