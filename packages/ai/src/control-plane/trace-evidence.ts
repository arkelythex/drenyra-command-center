import { z } from "zod";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { aiTraceEvidence } from "@arkelythex/persistence/schema";
import {
	TenantCompanyRucScopeSchema,
	type TenantCompanyRucScope,
} from "./contracts";

const nonEmpty = z.string().min(1);

export const EvidenceScopeSchema = z.enum([
	"ledger-entry",
	"policy-artifact",
	"fiscal-document",
]);

export const TraceEvidenceItemSchema = z
	.object({
		sourceRef: nonEmpty,
		hash: nonEmpty,
		scope: EvidenceScopeSchema,
		isRedacted: z.boolean(),
	})
	.refine(
		(item) => item.scope !== "fiscal-document" || item.isRedacted,
		"fiscal-document evidence must be redacted",
	);

export const EvidenceTraceBundleSchema = z
	.object({
		traceId: nonEmpty,
		tenantScope: TenantCompanyRucScopeSchema,
		redactionStatus: z.enum(["redacted", "partially-redacted"]),
		toolCalls: z.array(nonEmpty),
		rationale: nonEmpty,
		evidence: z.array(TraceEvidenceItemSchema),
		approvalLineage: z
			.object({
				approvalId: nonEmpty,
				approvalStatus: z.enum([
					"proposed",
					"validated",
					"approved",
					"rejected",
				]),
				decision: z.enum(["pending", "approved", "rejected"]),
				decisionEvidenceRef: z.string().min(1).optional(),
				decisionEvidenceRedacted: z.boolean().optional(),
			})
			.optional(),
		auditTrail: z
			.array(
				z.object({
					eventType: nonEmpty,
					status: z.enum(["success", "failure"]),
					recordedAt: nonEmpty,
					actorId: nonEmpty,
					actorRole: z.enum(["system", "supervisor", "financial-controller"]),
					reasonCode: nonEmpty,
				}),
			)
			.optional(),
	})
	.refine(
		(bundle) =>
			bundle.redactionStatus === "redacted" ||
			bundle.evidence.every((item) => item.isRedacted),
		"partially-redacted traces cannot contain unredacted evidence",
	)
	.refine((bundle) => {
		const lineage = bundle.approvalLineage;
		if (!lineage || !lineage.decisionEvidenceRef) {
			return true;
		}

		if (lineage.decisionEvidenceRef.startsWith("doc://")) {
			return lineage.decisionEvidenceRedacted === true;
		}

		return true;
	}, "approval lineage fiscal-document evidence must be redacted");

export type EvidenceTraceBundle = z.infer<typeof EvidenceTraceBundleSchema>;

export type TraceLookupInput = {
	traceId: string;
	tenantScope: TenantCompanyRucScope;
};

export type TraceLookupResult =
	| { found: true; bundle: EvidenceTraceBundle }
	| { found: false; reason: "not-found" | "scope-mismatch" };

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

export type TraceEvidenceStore = {
	save(bundle: EvidenceTraceBundle): EvidenceTraceBundle;
	getScoped(input: TraceLookupInput): TraceLookupResult;
	updateApprovalLineage(input: {
		traceId: string;
		tenantScope: TenantCompanyRucScope;
		approvalLineage: NonNullable<EvidenceTraceBundle["approvalLineage"]>;
	}): TraceLookupResult;
	appendAuditEvent(input: {
		traceId: string;
		tenantScope: TenantCompanyRucScope;
		event: NonNullable<EvidenceTraceBundle["auditTrail"]>[number];
	}): TraceLookupResult;
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
					decision:
						bundle.approvalLineage?.approvalStatus ?? "proposed",
					policyResult: bundle as unknown as Record<string, unknown>,
					tenantScope:
						bundle.tenantScope as unknown as Record<string, unknown>,
					createdAt: new Date(),
					expiresAt: new Date(
						Date.now() + ttlDays * 24 * 60 * 60 * 1000,
					),
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
