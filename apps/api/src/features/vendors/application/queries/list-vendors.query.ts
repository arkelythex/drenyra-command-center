/**
 * List Vendors Query
 *
 * @module vendors/application/queries
 */

import type { Vendor } from "../../domain/vendor";
import type {
	IVendorRepository,
	VendorListFilters,
} from "../../domain/vendor.repository.interface";

export async function listVendors(
	filters: VendorListFilters,
	deps?: { repository?: IVendorRepository },
): Promise<Vendor[]> {
	const repository =
		deps?.repository ??
		new (
			await import("../../infrastructure/vendor.repository")
		).VendorRepository();
	return await repository.list(filters);
}
