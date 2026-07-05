// Public API for Customers Feature
// Enforces FSD isolation boundaries.

// API Client
export { customersApi } from "./api/customers.api";
export { customerKeys } from "./api/query-keys";
export { CustomerForm } from "./components/CustomerForm";
export { CustomerModal } from "./components/CustomerModal";
// UI Components
export { CustomersView } from "./components/CustomersView";

// Shared Hooks
export { useCustomers } from "./hooks/useCustomers";
