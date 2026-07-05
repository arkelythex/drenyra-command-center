import { describe, expect, it } from "vitest";
import { buildVendorFormDefaults } from "../vendor-form-defaults";

describe("buildVendorFormDefaults", () => {
	it("uses the active company as default for new vendors", () => {
		expect(buildVendorFormDefaults("company-55")).toEqual(
			expect.objectContaining({
				companyId: "company-55",
				paymentTerms: 30,
				status: "active",
			}),
		);
	});

	it("preserves an explicit companyId when provided in default values", () => {
		expect(
			buildVendorFormDefaults("company-55", {
				companyId: "company-77",
				legalName: "Proveedor Existente",
			}),
		).toEqual(
			expect.objectContaining({
				companyId: "company-77",
				legalName: "Proveedor Existente",
			}),
		);
	});
});
