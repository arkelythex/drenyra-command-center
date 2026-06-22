// Public API for Customers Feature
// Enforces FSD isolation boundaries.

// UI Components
export { CustomersView } from './components/CustomersView';
export { CustomerModal } from './components/CustomerModal';
export { CustomerForm } from './components/CustomerForm';

// API Client
export { customersApi } from './api/customers.api';
export { customerKeys } from './api/query-keys';

// Shared Hooks
export { useCustomers } from './hooks/useCustomers';
