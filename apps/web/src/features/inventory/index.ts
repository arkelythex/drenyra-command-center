// Public API for Inventory Feature
// Enforces FSD isolation boundaries.

// UI Components
export { InventoryView } from './components/InventoryView';

// API Client
export { inventoryApi } from './api/inventory.api';
export { inventoryKeys } from './api/query-keys';

// Hooks
export { useInventory } from './hooks/useInventory';
export { usePredictions } from './hooks/usePredictions';
