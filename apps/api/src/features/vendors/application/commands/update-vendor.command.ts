/**
 * Update Vendor Command (partial update)
 *
 * @module vendors/application/commands
 */

import { Vendor } from "../../domain/vendor";
import type {
	IVendorRepository,
	UpdateVendorInput,
} from "../../domain/vendor.repository.interface";

export async function updateVendor(
	input: UpdateVendorInput,
	deps?: { repository?: IVendorRepository },
): Promise<Vendor> {
	const repository =
		deps?.repository ??
		new (
			await import("../../infrastructure/vendor.repository")
		).VendorRepository();

	if (input.taxId !== undefined && !Vendor.isValidRUC(input.taxId)) {
		throw new Error(
			"El RUC no cumple con el algoritmo de dígito verificador (Módulo 11)",
		);
	}

	if (
		input.vendorRating !== undefined &&
		(input.vendorRating < 0 || input.vendorRating > 100)
	) {
		throw new Error("Vendor rating must be between 0 and 100");
	}

	if (
		input.paymentTermDays !== undefined &&
		(!Number.isInteger(input.paymentTermDays) || input.paymentTermDays < 0)
	) {
		throw new Error("paymentTermDays must be a non-negative integer");
	}

	return await repository.update(input);
}
