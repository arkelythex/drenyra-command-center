/**
 * Delete Vendor Command (soft delete)
 *
 * Marks vendor as inactive (sunatCondition = INACTIVO).
 *
 * @module vendors/application/commands
 */

import type { Vendor as VendorEntity } from "../../domain/vendor";
import type {
	IVendorRepository,
	Vendor,
} from "../../domain/vendor.repository.interface";

export interface DeleteVendorInput {
	id: string;
	companyId: string;
}

export async function deleteVendor(
	input: DeleteVendorInput,
	deps?: { repository?: IVendorRepository },
): Promise<VendorEntity> {
	const repository =
		deps?.repository ??
		new (
			await import("../../infrastructure/vendor.repository")
		).VendorRepository();
	return await repository.softDelete(input.id, input.companyId);
}
