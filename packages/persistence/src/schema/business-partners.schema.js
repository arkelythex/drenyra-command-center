import {
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
export const businessPartners = pgTable(
	"business_partners",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		taxId: varchar("tax_id", { length: 20 }).notNull(),
		partnerDocumentType: varchar("partner_document_type", { length: 10 }),
		legalName: varchar("legal_name", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }),
		phone: varchar("phone", { length: 20 }),
		address: text("address"),
		complianceScore: integer("compliance_score").default(100),
		sunatCondition: varchar("sunat_condition", { length: 50 }).default(
			"HABIDO",
		),
		logoUrl: text("logo_url"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		companyTaxIdIdx: index("bp_company_tax_id_idx").on(t.companyId, t.taxId),
	}),
);
export const vendorProfiles = pgTable(
	"vendor_profiles",
	{
		id: uuid("id")
			.primaryKey()
			.references(() => businessPartners.id, { onDelete: "cascade" })
			.notNull(),
		paymentTermDays: integer("payment_term_days").default(30).notNull(),
		preferredPaymentMethod: varchar("preferred_payment_method", { length: 50 })
			.default("TRANSFER")
			.notNull(),
		bankAccount: text("bank_account"),
		purchaseCategories: jsonb("purchase_categories"),
		vendorRating: integer("vendor_rating").default(100),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		vendorRatingIdx: index("vendor_profiles_rating_idx").on(t.vendorRating),
	}),
);
export const customerProfiles = pgTable(
	"customer_profiles",
	{
		id: uuid("id")
			.primaryKey()
			.references(() => businessPartners.id, { onDelete: "cascade" })
			.notNull(),
		creditLimit: decimal("credit_limit", { precision: 19, scale: 2 })
			.default("0")
			.notNull(),
		creditDays: integer("credit_days").default(30).notNull(),
		customerSegment: varchar("customer_segment", { length: 50 })
			.default("RETAIL")
			.notNull(),
		paymentBehaviorScore: integer("payment_behavior_score").default(100),
		lastPurchaseDate: timestamp("last_purchase_date"),
		totalPurchases: decimal("total_purchases", {
			precision: 19,
			scale: 2,
		}).default("0"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		customerSegmentIdx: index("customer_profiles_segment_idx").on(
			t.customerSegment,
		),
		paymentScoreIdx: index("customer_profiles_payment_score_idx").on(
			t.paymentBehaviorScore,
		),
	}),
);
