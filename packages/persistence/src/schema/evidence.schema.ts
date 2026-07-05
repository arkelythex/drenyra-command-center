import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies, organizations } from "./core.schema";

export const evidenceStatusEnum = pgEnum("evidence_status", [
	"UPLOADED",
	"EXTRACTING",
	"CLASSIFIED",
	"VALIDATED",
	"REJECTED",
	"ERROR",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
	"INVOICE",
	"RECEIPT",
	"CONTRACT",
	"BANK_STATEMENT",
	"EMAIL",
	"OTHER",
]);

export const evidenceSourceEnum = pgEnum("evidence_source", [
	"UPLOAD",
	"EMAIL",
	"API",
	"SYNC",
]);

export const evidence = pgTable(
	"evidence",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: uuid("organization_id")
			.references(() => organizations.id)
			.notNull(),
		companyId: uuid("company_id").references(() => companies.id),

		filename: varchar("filename", { length: 500 }).notNull(),
		mimeType: varchar("mime_type", { length: 100 }).notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		hash: varchar("hash", { length: 64 }).notNull(),
		hashChain: jsonb("hash_chain").$type<{
			hash: string;
			prevHash: string | null;
			timestamp: string;
		}>(),
		evidenceType: evidenceTypeEnum("evidence_type").notNull(),
		source: evidenceSourceEnum("source").notNull(),
		status: evidenceStatusEnum("status").default("UPLOADED").notNull(),

		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		validations: jsonb("validations").$type<Array<Record<string, unknown>>>(),
		extractedData: jsonb("extracted_data").$type<Record<string, unknown>>(),
		classifierResult:
			jsonb("classifier_result").$type<Record<string, unknown>>(),
		errorMessage: text("error_message"),
		validatedAt: timestamp("validated_at"),
		validatedBy: varchar("validated_by", { length: 255 }),
		tags: text("tags").array(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => ({
		orgStatusIdx: index("evidence_org_status_idx").on(
			t.organizationId,
			t.status,
		),
		orgTypeIdx: index("evidence_org_type_idx").on(
			t.organizationId,
			t.evidenceType,
		),
		hashIdx: index("evidence_hash_idx").on(t.hash),
	}),
);

export const evidenceAuditTrail = pgTable(
	"evidence_audit_trail",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		evidenceId: uuid("evidence_id")
			.references(() => evidence.id, { onDelete: "cascade" })
			.notNull(),
		action: varchar("action", { length: 100 }).notNull(),
		previousStatus: evidenceStatusEnum("previous_status").notNull(),
		newStatus: evidenceStatusEnum("new_status").notNull(),
		hash: varchar("hash", { length: 64 }).notNull(),
		hashChain: jsonb("hash_chain")
			.$type<{
				hash: string;
				prevHash: string | null;
				timestamp: string;
			}>()
			.notNull(),
		actor: varchar("actor", { length: 255 }).notNull(),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
	},
	(t) => ({
		evidenceIdx: index("evidence_audit_trail_evidence_idx").on(t.evidenceId),
	}),
);

export const evidenceRelations = relations(evidence, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [evidence.organizationId],
		references: [organizations.id],
	}),
	company: one(companies, {
		fields: [evidence.companyId],
		references: [companies.id],
	}),
	auditTrails: many(evidenceAuditTrail),
}));

export const evidenceAuditTrailRelations = relations(
	evidenceAuditTrail,
	({ one }) => ({
		evidence: one(evidence, {
			fields: [evidenceAuditTrail.evidenceId],
			references: [evidence.id],
		}),
	}),
);
