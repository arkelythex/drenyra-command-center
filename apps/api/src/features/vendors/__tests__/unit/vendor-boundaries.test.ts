import { describe, expect, it } from "vitest";
import { Vendor } from "../../domain/vendor";

function createVendor(overrides: Partial<ConstructorParameters<typeof Vendor>[0]> = {}) {
	return new Vendor({
		id: "ven-1",
		companyId: "cmp-1",
		taxId: "20123456786",
		legalName: "Proveedor SAC",
		email: "billing@proveedor.pe",
		sunatCondition: "HABIDO",
		vendorRating: 80,
		paymentTermDays: 30,
		preferredPaymentMethod: "TRANSFER",
		bankAccount: "001-123",
		purchaseCategories: ["SERVICES"],
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-02T00:00:00.000Z"),
		...overrides,
	});
}

describe("Vendor boundary rules", () => {
	it.each([
		[79, false],
		[80, true],
		[100, true],
	])("rates %s as good: %s", (vendorRating, expected) => {
		expect(createVendor({ vendorRating }).hasGoodRating()).toBe(expected);
	});

	it("does not mark a bill overdue on its due date", () => {
		const vendor = createVendor({ paymentTermDays: 30 });
		const billDate = new Date("2026-01-01T00:00:00.000Z");

		expect(vendor.isPaymentOverdue(billDate, new Date("2026-01-31T00:00:00.000Z"))).toBe(false);
	});

	it("marks a zero-term bill overdue only after its issue date", () => {
		const vendor = createVendor({ paymentTermDays: 0 });
		const billDate = new Date("2026-01-01T00:00:00.000Z");

		expect(vendor.isPaymentOverdue(billDate, billDate)).toBe(false);
		expect(vendor.isPaymentOverdue(billDate, new Date("2026-01-01T00:00:00.001Z"))).toBe(true);
	});

	it("serializes derived activity and rating state", () => {
		const payload = createVendor({ sunatCondition: "INACTIVO", vendorRating: 79 }).toJSON();

		expect(payload).toMatchObject({
			id: "ven-1",
			isActive: false,
			hasGoodRating: false,
			purchaseCategories: ["SERVICES"],
		});
	});
});
