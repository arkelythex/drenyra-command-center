import { relations } from "drizzle-orm";
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
import { businessPartners } from "./business-partners.schema";
import { companies } from "./core.schema";
import {
	currencyEnum,
	invoiceStatusEnum,
	sunatStatusEnum,
	taxTypeEnum,
} from "./enums";
import { products } from "./products.schema";
export const invoices = pgTable(
	"invoices",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		customerId: uuid("customer_id")
			.references(() => businessPartners.id)
			.notNull(),
		invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
		series: varchar("series", { length: 10 }).notNull(),
		correlative: integer("correlative").notNull(),
		issueDate: timestamp("issue_date").defaultNow().notNull(),
		dueDate: timestamp("due_date").notNull(),
		currency: currencyEnum("currency").default("PEN").notNull(),
		exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 })
			.default("1.0000")
			.notNull(),
		subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
		igvAmount: decimal("igv_amount", { precision: 12, scale: 2 }).notNull(),
		totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
		status: invoiceStatusEnum("status").default("DRAFT").notNull(),
		sunatStatus: sunatStatusEnum("sunat_status").default("DRAFT"),
		paidAmount: decimal("paid_amount", { precision: 12, scale: 2 })
			.default("0")
			.notNull(),
		balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull(),
		paidDate: timestamp("paid_date"),
		xmlUrl: text("xml_url"),
		cdrUrl: text("cdr_url"),
		sunatTicket: text("sunat_ticket"),
		pdfUrl: text("pdf_url"),
		notes: text("notes"),
		tags: jsonb("tags"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		companySeriesIdx: index("invoice_company_series_idx").on(
			t.companyId,
			t.series,
			t.correlative,
		),
		customerIdx: index("invoice_customer_idx").on(t.customerId),
		statusIdx: index("invoice_status_idx").on(t.status),
	}),
);
export const invoiceItems = pgTable(
	"invoice_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		invoiceId: uuid("invoice_id")
			.references(() => invoices.id, { onDelete: "cascade" })
			.notNull(),
		productId: uuid("product_id").references(() => products.id),
		description: varchar("description", { length: 500 }).notNull(),
		quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
		unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
		taxType: taxTypeEnum("tax_type").default("GRAVADO").notNull(),
		igvRate: decimal("igv_rate", { precision: 5, scale: 2 })
			.default("18.00")
			.notNull(),
		subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
		igvAmount: decimal("igv_amount", { precision: 12, scale: 2 }).notNull(),
		totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		invoiceIdx: index("invoice_item_invoice_idx").on(t.invoiceId),
	}),
);
export const bills = pgTable(
	"bills",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		vendorId: uuid("vendor_id")
			.references(() => businessPartners.id)
			.notNull(),
		billNumber: varchar("bill_number", { length: 50 }).notNull(),
		issueDate: timestamp("issue_date").defaultNow().notNull(),
		dueDate: timestamp("due_date").notNull(),
		currency: currencyEnum("currency").default("PEN").notNull(),
		exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 })
			.default("1.0000")
			.notNull(),
		subtotalAmount: decimal("subtotal_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		igvAmount: decimal("igv_amount", { precision: 12, scale: 2 }).notNull(),
		totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
		status: invoiceStatusEnum("status").default("DRAFT").notNull(),
		notes: text("notes"),
		tags: jsonb("tags"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		companyBillIdx: index("bill_company_idx").on(t.companyId),
		vendorIdx: index("bill_vendor_idx").on(t.vendorId),
	}),
);
export const billItems = pgTable(
	"bill_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		billId: uuid("bill_id")
			.references(() => bills.id, { onDelete: "cascade" })
			.notNull(),
		productId: uuid("product_id").references(() => products.id),
		description: varchar("description", { length: 500 }).notNull(),
		quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
		unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
		total: decimal("total", { precision: 12, scale: 2 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		billIdx: index("bill_item_bill_idx").on(t.billId),
	}),
);
export const payments = pgTable(
	"payments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		invoiceId: uuid("invoice_id")
			.references(() => invoices.id, { onDelete: "cascade" })
			.notNull(),
		amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
		paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
		paymentDate: timestamp("payment_date").defaultNow().notNull(),
		reference: varchar("reference", { length: 255 }),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		companyIdx: index("payment_company_idx").on(t.companyId),
		invoiceIdx: index("payment_invoice_idx").on(t.invoiceId),
	}),
);
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	company: one(companies, {
		fields: [invoices.companyId],
		references: [companies.id],
	}),
	customer: one(businessPartners, {
		fields: [invoices.customerId],
		references: [businessPartners.id],
	}),
	items: many(invoiceItems),
}));
export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id],
	}),
	product: one(products, {
		fields: [invoiceItems.productId],
		references: [products.id],
	}),
}));
export const billsRelations = relations(bills, ({ one, many }) => ({
	company: one(companies, {
		fields: [bills.companyId],
		references: [companies.id],
	}),
	vendor: one(businessPartners, {
		fields: [bills.vendorId],
		references: [businessPartners.id],
	}),
	items: many(billItems),
}));
export const billItemsRelations = relations(billItems, ({ one }) => ({
	bill: one(bills, { fields: [billItems.billId], references: [bills.id] }),
	product: one(products, {
		fields: [billItems.productId],
		references: [products.id],
	}),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
	company: one(companies, {
		fields: [payments.companyId],
		references: [companies.id],
	}),
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id],
	}),
}));
