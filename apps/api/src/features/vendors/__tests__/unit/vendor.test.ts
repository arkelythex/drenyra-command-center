/**
 * Vendor Entity + CQRS Tests
 */

import { describe, expect, it } from "vitest";
import { createVendor } from "../../application/commands/create-vendor.command";
import { deleteVendor } from "../../application/commands/delete-vendor.command";
import { updateVendor } from "../../application/commands/update-vendor.command";
import { getVendor } from "../../application/queries/get-vendor.query";
import { listVendors } from "../../application/queries/list-vendors.query";
import { Vendor } from "../../domain/vendor";
import type {
	CreateVendorInput,
	IVendorRepository,
	UpdateVendorInput,
	VendorListFilters,
} from "../../domain/vendor.repository.interface";

function buildValidRucFromFirst10Digits(first10: string): string {
	if (!/^\d{10}$/.test(first10))
		throw new Error("first10 must be exactly 10 digits");

	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 10; i++) sum += Number(first10[i]) * weights[i];

	const mod = sum % 11;
	const checkDigit = 11 - mod;
	let finalCheckDigit = checkDigit;
	if (checkDigit === 10) finalCheckDigit = 0;
	if (checkDigit === 11) finalCheckDigit = 1;
	return `${first10}${finalCheckDigit}`;
}

class FakeVendorRepository implements IVendorRepository {
	private readonly vendors = new Map<string, Vendor>();

	async create(input: CreateVendorInput) {
		const id = `ven_${this.vendors.size + 1}`;
		const now = new Date("2026-02-04T00:00:00.000Z");
		const vendor = new Vendor({
			id,
			companyId: input.companyId,
			taxId: input.taxId,
			legalName: input.legalName,
			email: input.email,
			sunatCondition: "HABIDO",
			vendorRating: input.vendorRating ?? 100,
			paymentTermDays: input.paymentTermDays ?? 30,
			preferredPaymentMethod: input.preferredPaymentMethod ?? "TRANSFER",
			bankAccount: input.bankAccount,
			purchaseCategories: input.purchaseCategories ?? [],
			createdAt: now,
			updatedAt: now,
		});

		this.vendors.set(id, vendor);
		return vendor;
	}

	async update(input: UpdateVendorInput) {
		const existing = await this.findByIdForCompany(input.id, input.companyId);
		if (!existing) throw new Error("Proveedor no encontrado");

		const now = new Date("2026-02-04T00:00:00.000Z");
		const updated = new Vendor({
			id: existing.id,
			companyId: existing.companyId,
			taxId: input.taxId ?? existing.taxId,
			legalName: input.legalName ?? existing.legalName,
			email: input.email ?? existing.email,
			sunatCondition: existing.sunatCondition,
			vendorRating: input.vendorRating ?? existing.vendorRating,
			paymentTermDays: input.paymentTermDays ?? existing.paymentTermDays,
			preferredPaymentMethod:
				input.preferredPaymentMethod ?? existing.preferredPaymentMethod,
			bankAccount: input.bankAccount ?? existing.bankAccount,
			purchaseCategories:
				input.purchaseCategories ?? existing.purchaseCategories,
			createdAt: existing.createdAt,
			updatedAt: now,
		});

		this.vendors.set(input.id, updated);
		return updated;
	}

	async softDelete(id: string, companyId: string) {
		const existing = await this.findByIdForCompany(id, companyId);
		if (!existing) throw new Error("Proveedor no encontrado");

		const now = new Date("2026-02-04T00:00:00.000Z");
		const updated = new Vendor({
			id: existing.id,
			companyId: existing.companyId,
			taxId: existing.taxId,
			legalName: existing.legalName,
			email: existing.email,
			sunatCondition: "INACTIVO",
			vendorRating: existing.vendorRating,
			paymentTermDays: existing.paymentTermDays,
			preferredPaymentMethod: existing.preferredPaymentMethod,
			bankAccount: existing.bankAccount,
			purchaseCategories: existing.purchaseCategories,
			createdAt: existing.createdAt,
			updatedAt: now,
		});
		this.vendors.set(id, updated);
		return updated;
	}

	async findById(id: string) {
		return this.vendors.get(id) ?? null;
	}

	async findByIdForCompany(id: string, companyId: string) {
		const vendor = this.vendors.get(id) ?? null;
		return vendor?.companyId === companyId ? vendor : null;
	}

	async list(filters: VendorListFilters) {
		const all = Array.from(this.vendors.values()).filter(
			(v: Vendor) => v.companyId === filters.companyId,
		);
		return all.filter((v: Vendor) => {
			if (!filters.includeInactive && v.isInactive) return false;
			if (filters.minRating !== undefined && v.vendorRating < filters.minRating)
				return false;
			if (filters.category)
				return v.purchaseCategories
					.map((c) => c.toLowerCase())
					.includes(filters.category.toLowerCase());
			return true;
		});
	}

	async existsByTaxId(companyId: string, taxId: string) {
		return Array.from(this.vendors.values()).some(
			(v: Vendor) => v.companyId === companyId && v.taxId === taxId,
		);
	}
}

describe("Vendor", () => {
	it("validates RUC (Módulo 11)", () => {
		const valid = buildValidRucFromFirst10Digits("2012345678");
		expect(Vendor.isValidRUC(valid)).toBe(true);
		expect(Vendor.isValidRUC("20123456789")).toBe(false);
	});

	it("hasGoodRating returns true for rating >= 80", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
				vendorRating: 80,
			},
			{ repository: repo },
		);
		expect(vendor.hasGoodRating()).toBe(true);
	});

	it("isPaymentOverdue uses paymentTermDays", async () => {
		const vendor = new Vendor({
			id: "ven_1",
			companyId: "cmp_1",
			taxId: buildValidRucFromFirst10Digits("2012345678"),
			legalName: "Proveedor 1 SAC",
			email: undefined,
			sunatCondition: "HABIDO",
			vendorRating: 100,
			paymentTermDays: 10,
			preferredPaymentMethod: "TRANSFER",
			bankAccount: undefined,
			purchaseCategories: [],
			createdAt: new Date("2026-02-01"),
			updatedAt: new Date("2026-02-01"),
		});

		const billDate = new Date("2026-01-01");
		expect(vendor.isPaymentOverdue(billDate, new Date("2026-01-10"))).toBe(
			false,
		);
		expect(vendor.isPaymentOverdue(billDate, new Date("2026-01-12"))).toBe(
			true,
		);
	});
});

describe("Vendors CQRS", () => {
	it("create vendor succeeds", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
				vendorRating: 90,
				purchaseCategories: ["SERVICIOS"],
			},
			{ repository: repo },
		);
		expect(vendor.id).toBeTruthy();
		expect(vendor.companyId).toBe("cmp_1");
		expect(vendor.vendorRating).toBe(90);
	});

	it("create vendor rejects invalid RUC", async () => {
		const repo = new FakeVendorRepository();
		await expect(
			createVendor(
				{
					companyId: "cmp_1",
					taxId: "20123456789",
					legalName: "Proveedor 1 SAC",
				},
				{ repository: repo },
			),
		).rejects.toThrow(/RUC/);
	});

	it("create vendor rejects duplicate RUC in company", async () => {
		const repo = new FakeVendorRepository();
		const taxId = buildValidRucFromFirst10Digits("2012345678");

		await createVendor(
			{ companyId: "cmp_1", taxId, legalName: "Proveedor 1 SAC" },
			{ repository: repo },
		);
		await expect(
			createVendor(
				{ companyId: "cmp_1", taxId, legalName: "Proveedor 2 SAC" },
				{ repository: repo },
			),
		).rejects.toThrow(/Ya existe/);
	});

	it("update vendor works (partial)", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
			},
			{ repository: repo },
		);

		const updated = await updateVendor(
			{
				id: vendor.id,
				companyId: "cmp_1",
				legalName: "Proveedor 1 Actualizado SAC",
				paymentTermDays: 45,
			},
			{ repository: repo },
		);

		expect(updated.legalName).toBe("Proveedor 1 Actualizado SAC");
		expect(updated.paymentTermDays).toBe(45);
	});

	it("update vendor rejects invalid rating", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
			},
			{ repository: repo },
		);

		await expect(
			updateVendor(
				{ id: vendor.id, companyId: "cmp_1", vendorRating: 101 },
				{ repository: repo },
			),
		).rejects.toThrow(/between 0 and 100/);
	});

	it("soft delete sets inactive", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
			},
			{ repository: repo },
		);

		const deleted = await deleteVendor(
			{ id: vendor.id, companyId: "cmp_1" },
			{ repository: repo },
		);
		expect(deleted.isInactive).toBe(true);
	});

	it("list vendors filters by active/rating/category", async () => {
		const repo = new FakeVendorRepository();

		const v1 = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
				vendorRating: 90,
				purchaseCategories: ["SERVICIOS"],
			},
			{ repository: repo },
		);

		const v2 = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2045678901"),
				legalName: "Proveedor 2 SAC",
				vendorRating: 70,
				purchaseCategories: ["INSUMOS"],
			},
			{ repository: repo },
		);

		await deleteVendor({ id: v2.id, companyId: "cmp_1" }, { repository: repo });

		const activeOnly = await listVendors(
			{ companyId: "cmp_1" },
			{ repository: repo },
		);
		expect(activeOnly).toHaveLength(1);
		expect(activeOnly[0].id).toBe(v1.id);

		const byRating = await listVendors(
			{ companyId: "cmp_1", includeInactive: true, minRating: 80 },
			{ repository: repo },
		);
		expect(byRating).toHaveLength(1);

		const byCategory = await listVendors(
			{ companyId: "cmp_1", category: "SERVICIOS" },
			{ repository: repo },
		);
		expect(byCategory).toHaveLength(1);
	});

	it("get vendor returns vendor, errors if missing", async () => {
		const repo = new FakeVendorRepository();
		const vendor = await createVendor(
			{
				companyId: "cmp_1",
				taxId: buildValidRucFromFirst10Digits("2012345678"),
				legalName: "Proveedor 1 SAC",
			},
			{ repository: repo },
		);

		const fetched = await getVendor(
			{ id: vendor.id, companyId: "cmp_1" },
			{ repository: repo },
		);
		expect(fetched.id).toBe(vendor.id);

		await expect(
			getVendor({ id: "missing", companyId: "cmp_1" }, { repository: repo }),
		).rejects.toThrow(/no encontrado/);
	});
});
