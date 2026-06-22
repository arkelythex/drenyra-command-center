/**
 * Create Vendor Command
 *
 * @module vendors/application/commands
 */

import { Vendor } from "../../domain/vendor";
import type {
	CreateVendorInput,
	IVendorRepository,
} from "../../domain/vendor.repository.interface";

export async function createVendor(
	input: CreateVendorInput,
	deps?: { repository?: IVendorRepository },
): Promise<Vendor> {
	const repository =
		deps?.repository ??
		new (
			await import("../../infrastructure/vendor.repository")
		).VendorRepository();

	if (!Vendor.isValidRUC(input.taxId)) {
		throw new Error(
			"El RUC no cumple con el algoritmo de dígito verificador (Módulo 11)",
		);
	}

	const rating = input.vendorRating ?? 100;
	if (rating < 0 || rating > 100)
		throw new Error("Vendor rating must be between 0 and 100");

	const paymentDays = input.paymentTermDays ?? 30;
	if (!Number.isInteger(paymentDays) || paymentDays < 0) {
		throw new Error("paymentTermDays must be a non-negative integer");
	}

	const exists = await repository.existsByTaxId(input.companyId, input.taxId);
	if (exists)
		throw new Error("Ya existe un proveedor con ese RUC en la empresa");

	return await repository.create(input);
}
