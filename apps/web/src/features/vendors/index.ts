// Public API for Vendors Feature
// Enforces FSD isolation boundaries.

export { vendorKeys } from "./api/query-keys";
// API Client
export { vendorsApi } from "./api/vendors.api";
export { VendorForm } from "./components/VendorForm";
export { VendorModal } from "./components/VendorModal";
// UI Components
export { VendorsView } from "./components/VendorsView";

// Hooks
export {
	useCreateVendor,
	useDeleteVendor,
	useUpdateVendor,
	useVendors,
} from "./hooks/useVendors";
