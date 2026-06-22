/**
 * Infrastructure Package - Main Exports (safe core)
 *
 * Keep this entrypoint dependency-light. Optional adapters (Next.js, Better Auth, NATS, Upstash, etc.)
 * should be exposed via subpath imports instead of being re-exported here.
 */

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
// Always import these from @arkelythex/infrastructure, never directly from drizzle-orm/pg-core.
export {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
// AI (minimal surface used by the API)
export { createAIProvider } from "./ai/ai-provider.factory";
// Database (re-exports from @arkelythex/persistence)
export { db } from "@arkelythex/persistence/client";
export * from "@arkelythex/persistence/query";
export * from "@arkelythex/persistence/schema";
export * from "@arkelythex/persistence/unit-of-work";
export { seedDatabase } from "./db/seed";
// SUNAT Knowledge Base (RAG)
export {
	SunatKnowledgeService,
	sunatKnowledgeService,
	SUNAT_2026_SEED,
} from "./services/sunat-knowledge";
export type {
	KnowledgeCategory,
	KnowledgeChunk,
	KnowledgeContext,
	KnowledgeQuery,
} from "./services/sunat-knowledge";
// Logger
export { logger, loggers } from "./logger";
// Repositories (explicit)
export { PostgresChatRepository } from "./repositories/chat.repository";
export { PostgresEvidenceGraphRepository } from "@arkelythex/persistence/repositories/postgres-evidence-graph.repository";
export { PostgresFiscalTruthRepository } from "@arkelythex/persistence/repositories/postgres-fiscal-truth.repository";
export { PostgresDrenyraRepository } from "@arkelythex/persistence/repositories/postgres-drenyra.repository";
export { PostgresReplayRepository } from "@arkelythex/persistence/repositories/postgres-replay.repository";
export { SireSubmissionRepository } from "@arkelythex/persistence/repositories/sire-submission.repository";
export {
	documentSyncProcessorAdapter,
	expenseClassifierAdapter,
	invoiceOCRServiceAdapter,
	ublInvoiceParserAdapter,
} from "./adapters/document-processing.adapter";

// OSE - SUNAT Electronic Invoice Submission
export * from "./ose";

// Security
export * from "./security/security-service";
export { PostgresPlatformMcpAuditSink } from "@arkelythex/persistence/repositories/postgres-platform-mcp-audit.repository";

// Civic
export { createDigitalPublicPeruProxy, getDefaultDigitalPublicPeruProxy } from "./civic/digital-public-peru.proxy";
export type { DigitalPublicPeruProxyConfig } from "./civic/digital-public-peru.proxy";
