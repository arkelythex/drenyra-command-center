/**
 * Get Vendor Query
 *
 * @module vendors/application/queries
 */

import type { Vendor } from "../../domain/vendor";
import type { IVendorRepository } from "../../domain/vendor.repository.interface";

export interface GetVendorInput {
	id: string;
	companyId: string;
}

export async function getVendor(
	input: GetVendorInput,
	deps?: { repository?: IVendorRepository },
): Promise<Vendor> {
	const repository =
		deps?.repository ??
		new (
			await import("../../infrastructure/vendor.repository")
		).VendorRepository();
	const vendor = await repository.findByIdForCompany(input.id, input.companyId);
	if (!vendor) throw new Error("Proveedor no encontrado");
	return vendor;
}
