// Public API for Vendors Feature
// Enforces FSD isolation boundaries.

// UI Components
export { VendorsView } from './components/VendorsView';
export { VendorModal } from './components/VendorModal';
export { VendorForm } from './components/VendorForm';

// API Client
export { vendorsApi } from './api/vendors.api';
export { vendorKeys } from './api/query-keys';

// Hooks
export {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from './hooks/useVendors';
