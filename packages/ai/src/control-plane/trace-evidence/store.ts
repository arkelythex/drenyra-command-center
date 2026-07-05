import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { aiTraceEvidence } from "@drenyra/persistence/schema";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { TenantCompanyRucScope } from "../contracts";
import {
	type EvidenceTraceBundle,
	EvidenceTraceBundleSchema,
	type TraceEvidenceStore,
	type TraceLookupInput,
	type TraceLookupResult,
} from "./types";

const scopeMatches = (
	left: TenantCompanyRucScope,
	right: TenantCompanyRucScope,
): boolean => {
	return (
		left.tenantId === right.tenantId &&
		left.organizationId === right.organizationId &&
		left.companyId === right.companyId &&
		left.ruc === right.ruc
	);
};

const createBaseStore = (
	setBundle: (bundle: EvidenceTraceBundle) => void,
	getBundle: (traceId: string) => EvidenceTraceBundle | undefined,
): TraceEvidenceStore => {
	const getScoped = (input: TraceLookupInput): TraceLookupResult => {
		const bundle = getBundle(input.traceId);
		if (!bundle) {
			return { found: false, reason: "not-found" };
		}

		if (!scopeMatches(bundle.tenantScope, input.tenantScope)) {
			return { found: false, reason: "scope-mismatch" };
		}

		return { found: true, bundle };
	};

	return {
		save(bundle: EvidenceTraceBundle): EvidenceTraceBundle {
			const parsed = EvidenceTraceBundleSchema.parse(bundle);
			setBundle(parsed);
			return parsed;
		},
		getScoped(input: TraceLookupInput): TraceLookupResult {
			return getScoped(input);
		},
		updateApprovalLineage(input): TraceLookupResult {
			const lookup = getScoped({
				traceId: input.traceId,
				tenantScope: input.tenantScope,
			});

			if (!lookup.found) {
				return lookup;
			}

			const updated = EvidenceTraceBundleSchema.parse({
				...lookup.bundle,
				approvalLineage: input.approvalLineage,
			});

			setBundle(updated);
			return { found: true, bundle: updated };
		},
		appendAuditEvent(input): TraceLookupResult {
			const lookup = getScoped({
				traceId: input.traceId,
				tenantScope: input.tenantScope,
			});

			if (!lookup.found) {
				return lookup;
			}

			const updated = EvidenceTraceBundleSchema.parse({
				...lookup.bundle,
				auditTrail: [...(lookup.bundle.auditTrail ?? []), input.event],
			});

			setBundle(updated);
			return { found: true, bundle: updated };
		},
	};
};

export const createInMemoryTraceEvidenceStore = () => {
	const store = new Map<string, EvidenceTraceBundle>();
	return createBaseStore(
		(bundle) => {
			store.set(bundle.traceId, bundle);
		},
		(traceId) => store.get(traceId),
	);
};

type TraceStoreEvent = {
	type: "upsert";
	bundle: EvidenceTraceBundle;
};

const safeParseTraceStoreEvent = (line: string): TraceStoreEvent | null => {
	try {
		const parsed: unknown = JSON.parse(line);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			"type" in parsed &&
			(parsed as { type: unknown }).type === "upsert" &&
			"bundle" in parsed
		) {
			const bundle = EvidenceTraceBundleSchema.safeParse(
				(parsed as { bundle: unknown }).bundle,
			);
			if (bundle.success) {
				return { type: "upsert", bundle: bundle.data };
			}
		}
		return null;
	} catch {
		return null;
	}
};

export const createAppendOnlyTraceEvidenceStore = (input: {
	filePath: string;
}): TraceEvidenceStore => {
	const store = new Map<string, EvidenceTraceBundle>();

	if (existsSync(input.filePath)) {
		const content = readFileSync(input.filePath, "utf-8");
		for (const line of content.split("\n")) {
			if (!line.trim()) {
				continue;
			}
			const event = safeParseTraceStoreEvent(line);
			if (event) {
				store.set(event.bundle.traceId, event.bundle);
			}
		}
	}

	const append = (bundle: EvidenceTraceBundle): void => {
		mkdirSync(dirname(input.filePath), { recursive: true });
		const event: TraceStoreEvent = { type: "upsert", bundle };
		appendFileSync(input.filePath, `${JSON.stringify(event)}\n`, "utf-8");
	};

	return createBaseStore(
		(bundle) => {
			store.set(bundle.traceId, bundle);
			append(bundle);
		},
		(traceId) => store.get(traceId),
	);
};

// ============================================================================
// PostgreSQL-backed TraceEvidenceStore
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = PostgresJsDatabase<any>;

/**
 * Create a PostgreSQL-backed TraceEvidenceStore.
 *
 * Uses an in-memory Map cache for synchronous reads (matching the
 * TraceEvidenceStore interface contract), and writes to both the
 * in-memory cache + PostgreSQL on each mutation.
 *
 * On creation, the store hydrates its cache by reading all rows from
 * the `ai_trace_evidence` table. The full EvidenceTraceBundle is
 * serialized into the `policy_result` JSONB column.
 */
export function createPostgresTraceEvidenceStore(
	db: DrizzleDb,
	/** Default TTL for evidence in days (default: 90). */
	ttlDays: number = 90,
): TraceEvidenceStore {
	const cache = new Map<string, EvidenceTraceBundle>();

	// Hydrate cache from DB on construction
	hydrateCacheFromDb(db, cache);

	return createBaseStore(
		(bundle: EvidenceTraceBundle) => {
			cache.set(bundle.traceId, bundle);
			// Fire-and-forget DB write (non-blocking)
			void db
				.insert(aiTraceEvidence)
				.values({
					traceId: bundle.traceId,
					agentId: null,
					decision: bundle.approvalLineage?.approvalStatus ?? "proposed",
					policyResult: bundle as unknown as Record<string, unknown>,
					tenantScope: bundle.tenantScope as unknown as Record<string, unknown>,
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
				})
				.returning()
				.catch((err: Error) => {
					console.error(
						`[PostgresTraceEvidenceStore] Failed to save trace ${bundle.traceId}:`,
						err,
					);
				});
		},
		(traceId: string) => cache.get(traceId),
	);
}

/**
 * Hydrate in-memory cache from the ai_trace_evidence table.
 * Reads all rows and deserializes the EvidenceTraceBundle from policyResult.
 */
function hydrateCacheFromDb(
	db: DrizzleDb,
	cache: Map<string, EvidenceTraceBundle>,
): void {
	try {
		void db
			.select()
			.from(aiTraceEvidence)
			.then((rows) => {
				for (const row of rows) {
					const bundle = row.policyResult as EvidenceTraceBundle | null;
					if (bundle && bundle.traceId) {
						cache.set(bundle.traceId, bundle);
					}
				}
			})
			.catch((err: Error) => {
				console.error(
					"[PostgresTraceEvidenceStore] Failed to hydrate cache from DB:",
					err,
				);
			});
	} catch {
		// Silently ignore hydration errors — cache starts empty
	}
}
