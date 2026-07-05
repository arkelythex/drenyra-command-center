/**
 * Assets Schema
 */

import {
	boolean,
	date,
	decimal,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * fixedAssets const.
 *
 * @example
 * ```ts
 * console.log(fixedAssets);
 * ```
 */
export const fixedAssets = pgTable("fixed_assets", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),

	name: varchar("name", { length: 200 }).notNull(),
	description: text("description"),
	category: varchar("category", { length: 50 }),

	purchaseDate: date("purchase_date").notNull(),
	purchasePrice: decimal("purchase_price", {
		precision: 19,
		scale: 2,
	}).notNull(),
	currentValue: decimal("current_value", { precision: 19, scale: 2 }),

	depreciationMethod: varchar("depreciation_method", { length: 20 }).default(
		"STRAIGHT_LINE",
	),
	usefulLife: decimal("useful_life", { precision: 5, scale: 2 }), // years
	salvageValue: decimal("salvage_value", { precision: 19, scale: 2 }),

	isActive: boolean("is_active").default(true),
	disposalDate: date("disposal_date"),

	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
