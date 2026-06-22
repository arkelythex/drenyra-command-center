/**
 * Inventory Types
 * Stock management and warehouse operations
 */

import type { Money } from '@arkelythex/domain';

/**
 * Movement Types
 */
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

/**
 * Movement Reasons
 */
export type MovementReason = 
  | 'SALE'           // Sale to customer
  | 'PURCHASE'       // Purchase from vendor
  | 'ADJUSTMENT'     // Stock adjustment
  | 'TRANSFER'       // Transfer between warehouses
  | 'RETURN'         // Customer return
  | 'DAMAGED'        // Damaged goods
  | 'LOST'           // Lost/stolen
  | 'INITIAL'        // Initial stock
  | 'OTHER';         // Other reason

/**
 * Inventory Item
 */
export interface InventoryItem {
  id: string;
  companyId: string;
  productId: string;
  warehouseId?: string;
  quantity: string;
  minStock?: string;
  maxStock?: string;
  unitCost?: string;
  totalValue?: string;
  lastUpdated: Date;
  
  // Relations
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code?: string;
  };
}

/**
 * Inventory Movement
 */
export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  warehouseId?: string;
  type: MovementType;
  quantity: string;
  unitCost?: string;
  totalCost?: string;
  reference?: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  reason?: MovementReason;
  createdAt: Date;
  createdBy?: string;
  
  // Relations
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

/**
 * Warehouse
 */
export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Kardex Entry (SUNAT requirement)
 */
export interface KardexEntry {
  date: Date;
  type: MovementType;
  reason: MovementReason;
  reference?: string;
  quantityIn: string;
  quantityOut: string;
  balance: string;
  unitCost: string;
  totalValue: string;
}

/**
 * Stock Alert
 */
export interface StockAlert {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: string;
  minStock: string;
  warehouseId?: string;
  warehouseName?: string;
  alertLevel: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

/**
 * Inventory Valuation
 */
export interface InventoryValuation {
  productId: string;
  productName: string;
  sku?: string;
  quantity: string;
  unitCost: string;
  totalValue: string;
  method: 'FIFO' | 'AVERAGE' | 'LIFO';
}

/**
 * Inventory Summary
 */
export interface InventorySummary {
  totalProducts: number;
  totalQuantity: string;
  totalValue: string;
  lowStockItems: number;
  outOfStockItems: number;
  warehouseCount: number;
}

/**
 * Create Movement DTO
 */
export interface CreateMovementDTO {
  productId: string;
  warehouseId?: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  reason?: MovementReason;
}

/**
 * Update Inventory DTO
 */
export interface UpdateInventoryDTO {
  minStock?: number;
  maxStock?: number;
  unitCost?: number;
}
