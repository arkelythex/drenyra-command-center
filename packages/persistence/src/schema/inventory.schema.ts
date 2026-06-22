/**
 * Inventory Schema
 * Stock management, warehouses, and movements
 */

import { pgTable, uuid, varchar, decimal, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './index';

/**
 * Inventory - Current stock levels
 * @example
 * ```ts
 * console.log(inventory);
 * ```
 */

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  productId: uuid('product_id').notNull(),
  warehouseId: uuid('warehouse_id'),
  
  // Stock levels
  quantity: decimal('quantity', { precision: 19, scale: 4 }).notNull().default('0'),
  minStock: decimal('min_stock', { precision: 19, scale: 4 }),
  maxStock: decimal('max_stock', { precision: 19, scale: 4 }),
  
  // Costing
  unitCost: decimal('unit_cost', { precision: 19, scale: 4 }),
  totalValue: decimal('total_value', { precision: 19, scale: 4 }),
  
  // Metadata
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Inventory Movements - Stock transactions
 * @example
 * ```ts
 * console.log(inventoryMovements);
 * ```
 */

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  productId: uuid('product_id').notNull(),
  warehouseId: uuid('warehouse_id'),
  
  // Movement details
  type: varchar('type', { length: 20 }).notNull(), // IN, OUT, ADJUSTMENT, TRANSFER
  quantity: decimal('quantity', { precision: 19, scale: 4 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 19, scale: 4 }),
  totalCost: decimal('total_cost', { precision: 19, scale: 4 }),
  
  // Reference
  reference: varchar('reference', { length: 100 }), // Invoice, Bill, etc.
  referenceId: uuid('reference_id'),
  referenceNumber: varchar('reference_number', { length: 50 }),
  
  // Additional info
  notes: text('notes'),
  reason: varchar('reason', { length: 100 }), // Sale, Purchase, Adjustment, etc.
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by'),
});

/**
 * Warehouses - Storage locations
 * @example
 * ```ts
 * console.log(warehouses);
 * ```
 */

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  
  // Warehouse details
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }).default('PE'),
  
  // Contact
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  manager: varchar('manager', { length: 100 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Relations
 * @example
 * ```ts
 * console.log(inventoryRelations);
 * ```
 */

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventory.warehouseId],
    references: [warehouses.id],
  }),
}));

/**
 * inventoryMovementsRelations const.
 *
 * @example
 * ```ts
 * console.log(inventoryMovementsRelations);
 * ```
 */
export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryMovements.warehouseId],
    references: [warehouses.id],
  }),
}));
