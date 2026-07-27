/**
 * PLE Schema — Programa de Libros Electrónicos
 *
 * Almacena generaciones de PLE (Libro Diario, Mayor, Compras, Ventas)
 * con estado de validación y hash CDR.
 */

import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const pleGenerations = pgTable(
	"ple_generations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),

		// Book identification
		bookType: varchar("book_type", { length: 20 }).notNull(), // LE-DIARIO, LE-MAYOR, LE-COMPRAS, LE-VENTAS
		period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
		ruc: varchar("ruc", { length: 11 }).notNull(),

		// Status lifecycle
		status: varchar("status", { length: 20 }).notNull().default("generated"), // generated, validated, validation_failed, filed

		// Content (only stored when validated)
		fileContent: text("file_content"),
		fileSizeBytes: integer("file_size_bytes"),

		// CDR hash
		cdrHash: varchar("cdr_hash", { length: 64 }),

		// SUNAT response (filed only)
		sunatResponse: jsonb("sunat_response"),

		// Error tracking
		validationErrors: jsonb("validation_errors"),

		// Metadata
		generatedBy: uuid("generated_by"),
		generatedAt: timestamp("generated_at").defaultNow().notNull(),
		validatedAt: timestamp("validated_at"),
		filedAt: timestamp("filed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		// Unique constraint: one generation per book/period/ruc
		bookPeriodRucUniq: uniqueIndex("ple_generations_book_period_ruc_uniq").on(
			table.companyId,
			table.bookType,
			table.period,
		),
		// Index for listing by company
		companyBookPeriodIdx: index("idx_ple_generations_company_book_period").on(
			table.companyId,
			table.bookType,
			table.period,
		),
		// Index for status queries
		statusIdx: index("idx_ple_generations_status").on(table.status),
	}),
);

export const pleGenerationsRelations = relations(pleGenerations, () => ({}));
