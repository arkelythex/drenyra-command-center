/**
 * Products schema: product catalog with inventory and tax fields.
 */

import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
import { taxTypeEnum } from "./enums";

// --- PRODUCTS ---
export const products = pgTable(
	"products",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		sku: varchar("sku", { length: 50 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		category: varchar("category", { length: 100 }),
		unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
		costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
		taxType: taxTypeEnum("tax_type").default("GRAVADO").notNull(),
		unit: varchar("unit", { length: 20 }).default("UND").notNull(),
		stockQuantity: decimal("stock_quantity", {
			precision: 12,
			scale: 2,
		}).default("0"),
		minStock: decimal("min_stock", { precision: 12, scale: 2 }),
		maxStock: decimal("max_stock", { precision: 12, scale: 2 }),
		imageUrl: text("image_url"),
		isActive: boolean("is_active").default(true),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		companySkuIdx: index("product_company_sku_idx").on(t.companyId, t.sku),
	}),
);

// --- RELATIONS ---
export const productsRelations = relations(products, ({ one }) => ({
	company: one(companies, {
		fields: [products.companyId],
		references: [companies.id],
	}),
}));
