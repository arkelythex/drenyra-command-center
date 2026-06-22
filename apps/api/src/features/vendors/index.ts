/**
 * Vendors Feature - Barrel Export
 *
 * Vertical Slice Architecture entry point.
 */

// API Routes
export { vendorRoutes } from "./api/routes";

// Commands
export { createVendor } from "./application/commands/create-vendor.command";
export { deleteVendor } from "./application/commands/delete-vendor.command";
export { updateVendor } from "./application/commands/update-vendor.command";

// Queries
export { getVendor } from "./application/queries/get-vendor.query";
export { listVendors } from "./application/queries/list-vendors.query";
export type { PreferredPaymentMethod, VendorData } from "./domain/vendor";
// Domain
export { Vendor } from "./domain/vendor";
export type {
	CreateVendorInput,
	IVendorRepository,
	UpdateVendorInput,
	VendorListFilters,
} from "./domain/vendor.repository.interface";

// Infrastructure
export { VendorRepository } from "./infrastructure/vendor.repository";
