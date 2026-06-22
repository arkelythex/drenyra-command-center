/**
 * Memory Module Types.
 *
 * Domain-agnostic types for the agent memory and session storage module.
 * Zero fiscal imports — all types are generic and reusable across verticals.
 *
 * @module @arkelythex/platform-core/memory
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/**
 * Configuration for agent session management.
 */
export interface SessionConfig {
  /** Maximum number of records per session before condensation */
  maxRecordsPerSession?: number;
  /** TTL for session data in milliseconds */
  sessionTtlMs?: number;
  /** Enable automatic session condensation */
  enableAutoCondense?: boolean;
}

/**
 * Configuration for the underlying storage backend.
 */
export interface StoreConfig {
  /** Storage backend type ("sqlite" | "in-memory" | "postgres") */
  backend: string;
  /** Connection string or file path for persistent stores */
  connectionString?: string;
  /** Maximum number of concurrent read operations */
  maxReadConnections?: number;
}

// ──────────────────────────────────────────────
// Scope — Domain-agnostic tenant isolation
// ──────────────────────────────────────────────

/**
 * A domain-agnostic scope for memory isolation.
 * Every record belongs to a tenant; additional metadata key-value pairs
 * provide finer-grained scoping (e.g., { companyId, projectId }).
 */
export interface MemoryScope {
  /** Primary tenant identifier */
  tenantId: string;
  /** Optional additional scope dimensions */
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Memory Record Types
// ──────────────────────────────────────────────

/**
 * A stored memory record in the agent memory system.
 */
export interface MemoryRecord {
  /** Unique record identifier */
  id: string;
  /** The agent that owns this memory */
  agentId: string;
  /** Optional session association */
  sessionId?: string;
  /** Tenant scope for isolation */
  scope: MemoryScope;
  /** Memory type (e.g., "message", "fact", "decision", "summary") */
  type: string;
  /** The memory content */
  content: string;
  /** Arbitrary metadata attached to this record */
  metadata: Record<string, unknown>;
  /** ISO timestamp of creation */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
}

/**
 * Input for saving a new memory record.
 */
export interface SaveMemoryInput {
  /** The agent that owns this memory */
  agentId: string;
  /** Optional session association */
  sessionId?: string;
  /** Tenant scope */
  scope: MemoryScope;
  /** Memory type */
  type: string;
  /** The memory content */
  content: string;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Search Types
// ──────────────────────────────────────────────

/**
 * Parameters for searching memories.
 */
export interface MemorySearchQuery {
  /** Search text to match against record content, agentId, type, and tags */
  text: string;
  /** Scope to restrict the search to */
  scope: MemoryScope;
  /** Optional agent filter */
  agentId?: string;
  /** Maximum number of results (default: 10) */
  limit?: number;
}

/**
 * A search result with relevance score.
 */
export interface MemorySearchResult {
  /** The matching record */
  record: MemoryRecord;
  /** Relevance score (higher = more relevant) */
  score: number;
}

/**
 * Parameters for building memory context (session + search combination).
 */
export interface MemoryContextQuery {
  /** Scope to restrict context to */
  scope: MemoryScope;
  /** Optional session ID to include session records */
  sessionId?: string;
  /** Optional text to search for in addition to session records */
  text?: string;
  /** Maximum number of records (default: 10) */
  limit?: number;
}

/**
 * Aggregated memory context with records and a condensed summary.
 */
export interface MemoryContext {
  /** Memory records included in this context */
  records: MemoryRecord[];
  /** Condensed summary of the included records */
  summary: string;
}
