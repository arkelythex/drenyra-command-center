// Public API for Inventory Feature
// Enforces FSD isolation boundaries.

// API Client
export { inventoryApi } from "./api/inventory.api";
export { inventoryKeys } from "./api/query-keys";
// UI Components
export { InventoryView } from "./components/InventoryView";

// Hooks
export { useInventory } from "./hooks/useInventory";
export { usePredictions } from "./hooks/usePredictions";
