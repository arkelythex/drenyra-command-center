/**
 * Infrastructure Package - Main Exports (safe core)
 *
 * Keep this entrypoint dependency-light. Optional adapters (Next.js, Better Auth, NATS, Upstash, etc.)
 * should be exposed via subpath imports instead of being re-exported here.
 */

// Database (re-exports from @drenyra/persistence)
export { db } from "@drenyra/persistence/client";
export * from "@drenyra/persistence/query";
export { PostgresCloseChecklistRepository } from "@drenyra/persistence/repositories/postgres-close-checklist.repository";
export { PostgresDrenyraRepository } from "@drenyra/persistence/repositories/postgres-drenyra.repository";
export { PostgresEvidenceGraphRepository } from "@drenyra/persistence/repositories/postgres-evidence-graph.repository";
export { PostgresFiscalTruthRepository } from "@drenyra/persistence/repositories/postgres-fiscal-truth.repository";
export { PostgresPlatformMcpAuditSink } from "@drenyra/persistence/repositories/postgres-platform-mcp-audit.repository";
export { PostgresReplayRepository } from "@drenyra/persistence/repositories/postgres-replay.repository";
export { SireSubmissionRepository } from "@drenyra/persistence/repositories/sire-submission.repository";
export * from "@drenyra/persistence/schema";
export * from "@drenyra/persistence/unit-of-work";
// Re-export commonly used items from drizzle-orm
export {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	like,
	lt,
	lte,
	not,
	or,
	sql,
} from "drizzle-orm";
// Re-export pg-core primitives — ensures single drizzle-orm instance across the monorepo.
// Always import these from @drenyra/infrastructure, never directly from drizzle-orm/pg-core.
export {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
export {
	documentSyncProcessorAdapter,
	expenseClassifierAdapter,
	invoiceOCRServiceAdapter,
	ublInvoiceParserAdapter,
} from "./adapters/document-processing.adapter";
// AI (minimal surface used by the API)
export { createAIProvider } from "./ai/ai-provider.factory";

export { seedDatabase } from "./db/seed";
// Logger
export { logger, loggers } from "./logger";

// OSE - SUNAT Electronic Invoice Submission
export * from "./ose";
// Repositories (explicit)
export { PostgresChatRepository } from "./repositories/chat.repository";
// Security
export * from "./security/security-service";
export type {
	KnowledgeCategory,
	KnowledgeChunk,
	KnowledgeContext,
	KnowledgeQuery,
} from "./services/sunat-knowledge";
// SUNAT Knowledge Base (RAG)
export {
	SUNAT_2026_SEED,
	SunatKnowledgeService,
	sunatKnowledgeService,
} from "./services/sunat-knowledge";
