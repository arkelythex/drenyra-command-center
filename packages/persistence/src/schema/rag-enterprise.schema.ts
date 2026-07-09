/**
 * RAG Enterprise Schema
 *
 * Document management, chunk storage, and query logging for
 * the enterprise knowledge base feature.
 *
 * Uses jsonb for embedding storage instead of pgvector to avoid
 * requiring the pgvector extension in all environments.
 * The API contract is designed so swapping to real pgvector later
 * is a drop-in change.
 */

import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies, users } from "./core.schema";

// --- KB COLLECTIONS ---

export const kbCollections = pgTable(
	"kb_collections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		icon: varchar("icon", { length: 64 }).default("folder"),
		documentCount: integer("document_count").default(0).notNull(),
		embeddingModel: varchar("embedding_model", { length: 128 }).default(
			"text-embedding-3-small",
		),
		createdById: uuid("created_by_id").references(() => users.id),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyIdx: index("kb_collections_company_idx").on(table.companyId),
		activeIdx: index("kb_collections_active_idx").on(
			table.companyId,
			table.isActive,
		),
	}),
);

export const kbCollectionsRelations = relations(
	kbCollections,
	({ one, many }) => ({
		company: one(companies, {
			fields: [kbCollections.companyId],
			references: [companies.id],
		}),
		createdBy: one(users, {
			fields: [kbCollections.createdById],
			references: [users.id],
		}),
		documents: many(kbDocuments),
	}),
);

// --- KB DOCUMENTS ---

export const kbDocuments = pgTable(
	"kb_documents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		collectionId: uuid("collection_id")
			.references(() => kbCollections.id, { onDelete: "cascade" })
			.notNull(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		title: varchar("title", { length: 512 }).notNull(),
		fileName: varchar("file_name", { length: 512 }).notNull(),
		fileType: varchar("file_type", { length: 32 })
			.$type<"pdf" | "txt" | "csv" | "docx" | "html" | "markdown">()
			.notNull(),
		fileSize: integer("file_size").notNull(),
		source: varchar("source", { length: 32 })
			.$type<"upload" | "email" | "webhook" | "api">()
			.default("upload")
			.notNull(),
		pageCount: integer("page_count"),
		chunkCount: integer("chunk_count").default(0),
		status: varchar("status", { length: 32 })
			.$type<"uploading" | "processing" | "indexing" | "ready" | "error">()
			.default("uploading")
			.notNull(),
		error: text("error"),
		content: text("content"),
		metadata: jsonb("metadata").default({}),
		uploadedById: uuid("uploaded_by_id").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		collectionIdx: index("kb_docs_collection_idx").on(table.collectionId),
		companyIdx: index("kb_docs_company_idx").on(table.companyId),
		statusIdx: index("kb_docs_status_idx").on(table.status),
		collectionStatusIdx: index("kb_docs_collection_status_idx").on(
			table.collectionId,
			table.status,
		),
	}),
);

export const kbDocumentsRelations = relations(kbDocuments, ({ one, many }) => ({
	collection: one(kbCollections, {
		fields: [kbDocuments.collectionId],
		references: [kbCollections.id],
	}),
	company: one(companies, {
		fields: [kbDocuments.companyId],
		references: [companies.id],
	}),
	uploadedBy: one(users, {
		fields: [kbDocuments.uploadedById],
		references: [users.id],
	}),
	chunks: many(kbChunks),
}));

// --- KB CHUNKS ---

export const kbChunks = pgTable(
	"kb_chunks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		documentId: uuid("document_id")
			.references(() => kbDocuments.id, { onDelete: "cascade" })
			.notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		content: text("content").notNull(),
		tokenCount: integer("token_count"),
		embedding: jsonb("embedding"),
		metadata: jsonb("metadata").default({}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		documentIdx: index("kb_chunks_document_idx").on(table.documentId),
		documentChunkIdx: index("kb_chunks_doc_chunk_idx").on(
			table.documentId,
			table.chunkIndex,
		),
	}),
);

export const kbChunksRelations = relations(kbChunks, ({ one }) => ({
	document: one(kbDocuments, {
		fields: [kbChunks.documentId],
		references: [kbDocuments.id],
	}),
}));

// --- KB QUERIES ---

export const kbQueries = pgTable(
	"kb_queries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		collectionId: uuid("collection_id")
			.references(() => kbCollections.id)
			.notNull(),
		query: text("query").notNull(),
		response: text("response"),
		chunksUsed: jsonb("chunks_used").default([]),
		modelUsed: varchar("model_used", { length: 128 }),
		latencyMs: integer("latency_ms"),
		feedback: boolean("feedback"),
		createdById: uuid("created_by_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		companyIdx: index("kb_queries_company_idx").on(table.companyId),
		collectionIdx: index("kb_queries_collection_idx").on(table.collectionId),
		createdAtIdx: index("kb_queries_created_at_idx").on(table.createdAt),
	}),
);

export const kbQueriesRelations = relations(kbQueries, ({ one }) => ({
	company: one(companies, {
		fields: [kbQueries.companyId],
		references: [companies.id],
	}),
	collection: one(kbCollections, {
		fields: [kbQueries.collectionId],
		references: [kbCollections.id],
	}),
}));

// --- INFERRED TYPES ---

export type KbCollection = typeof kbCollections.$inferSelect;
export type NewKbCollection = typeof kbCollections.$inferInsert;

export type KbDocument = typeof kbDocuments.$inferSelect;
export type NewKbDocument = typeof kbDocuments.$inferInsert;

export type KbChunk = typeof kbChunks.$inferSelect;
export type NewKbChunk = typeof kbChunks.$inferInsert;

export type KbQuery = typeof kbQueries.$inferSelect;
export type NewKbQuery = typeof kbQueries.$inferInsert;
