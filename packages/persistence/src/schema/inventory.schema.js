import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { products } from "./index";
export const inventory = pgTable("inventory", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	productId: uuid("product_id").notNull(),
	warehouseId: uuid("warehouse_id"),
	quantity: decimal("quantity", { precision: 19, scale: 4 })
		.notNull()
		.default("0"),
	minStock: decimal("min_stock", { precision: 19, scale: 4 }),
	maxStock: decimal("max_stock", { precision: 19, scale: 4 }),
	unitCost: decimal("unit_cost", { precision: 19, scale: 4 }),
	totalValue: decimal("total_value", { precision: 19, scale: 4 }),
	lastUpdated: timestamp("last_updated").defaultNow(),
	createdAt: timestamp("created_at").defaultNow(),
});
export const inventoryMovements = pgTable("inventory_movements", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	productId: uuid("product_id").notNull(),
	warehouseId: uuid("warehouse_id"),
	type: varchar("type", { length: 20 }).notNull(),
	quantity: decimal("quantity", { precision: 19, scale: 4 }).notNull(),
	unitCost: decimal("unit_cost", { precision: 19, scale: 4 }),
	totalCost: decimal("total_cost", { precision: 19, scale: 4 }),
	reference: varchar("reference", { length: 100 }),
	referenceId: uuid("reference_id"),
	referenceNumber: varchar("reference_number", { length: 50 }),
	notes: text("notes"),
	reason: varchar("reason", { length: 100 }),
	createdAt: timestamp("created_at").defaultNow(),
	createdBy: uuid("created_by"),
});
export const warehouses = pgTable("warehouses", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	name: varchar("name", { length: 200 }).notNull(),
	code: varchar("code", { length: 50 }),
	address: text("address"),
	city: varchar("city", { length: 100 }),
	country: varchar("country", { length: 2 }).default("PE"),
	phone: varchar("phone", { length: 20 }),
	email: varchar("email", { length: 100 }),
	manager: varchar("manager", { length: 100 }),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
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
export const inventoryMovementsRelations = relations(
	inventoryMovements,
	({ one }) => ({
		product: one(products, {
			fields: [inventoryMovements.productId],
			references: [products.id],
		}),
		warehouse: one(warehouses, {
			fields: [inventoryMovements.warehouseId],
			references: [warehouses.id],
		}),
	}),
);

