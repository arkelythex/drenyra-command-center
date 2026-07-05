/**
 * Tests for createPostgresTraceEvidenceStore.
 *
 * Uses a mocked Drizzle client to verify correct SQL generation and
 * data mapping without requiring a real PostgreSQL instance.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	EvidenceTraceBundle,
	TenantCompanyRucScope,
} from "../../src/control-plane/trace-evidence";
import { createPostgresTraceEvidenceStore } from "../../src/control-plane/trace-evidence";

// ============================================================================
// Helpers
// ============================================================================

const defaultScope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

const otherScope: TenantCompanyRucScope = {
	tenantId: "tenant-2",
	organizationId: "org-2",
	companyId: "company-2",
	ruc: "20987654321",
};

function createSampleBundle(
	overrides: Partial<EvidenceTraceBundle> = {},
): EvidenceTraceBundle {
	return {
		traceId: "trace-test-1",
		tenantScope: defaultScope,
		redactionStatus: "redacted",
		toolCalls: ["ledger.read"],
		rationale: "Test evidence bundle",
		evidence: [
			{
				sourceRef: "source://test",
				hash: "hash-test-1",
				scope: "ledger-entry",
				isRedacted: true,
			},
		],
		...overrides,
	};
}

// ============================================================================
// Mock Drizzle client
// ============================================================================

function createMockDb() {
	const store = new Map<string, Record<string, unknown>>();

	const mockQuery = {
		then: vi.fn(),
		catch: vi.fn(),
	};

	return {
		insert: vi.fn(() => ({
			values: vi.fn((values: Record<string, unknown>) => {
				store.set(values.traceId as string, { ...values });
				const returningPromise = Promise.resolve([]);
				// Use native Promise.prototype.catch to avoid recursion
				const nativeCatch = returningPromise.catch.bind(returningPromise);
				return Object.assign(returningPromise, {
					returning: vi.fn(() => {
						const rp = Promise.resolve([]);
						const nc = rp.catch.bind(rp);
						return Object.assign(rp, { catch: nc });
					}),
					catch: nativeCatch,
				});
			}),
		})),
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn((_n: number) => {
						const row = store.get("trace-test-1");
						return Promise.resolve(row ? [row] : []);
					}),
					then: vi.fn(),
					catch: vi.fn(),
				})),
				then: vi.fn().mockResolvedValue(Array.from(store.values())),
				catch: vi.fn(),
				orderBy: vi.fn(),
				limit: vi.fn(),
				_: mockQuery,
			})),
			_: mockQuery,
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => Promise.resolve()),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(() => Promise.resolve()),
		})),
		_: mockQuery,
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("createPostgresTraceEvidenceStore", () => {
	let db: ReturnType<typeof createMockDb>;

	beforeEach(() => {
		db = createMockDb();
	});

	describe("save + getScoped", () => {
		it("should save a bundle and retrieve it with matching scope", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			const bundle = createSampleBundle();

			store.save(bundle);

			// Should have called db.insert
			expect(db.insert).toHaveBeenCalled();

			const result = store.getScoped({
				traceId: "trace-test-1",
				tenantScope: defaultScope,
			});

			expect(result.found).toBe(true);
			if (result.found) {
				expect(result.bundle.traceId).toBe("trace-test-1");
				expect(result.bundle.rationale).toBe("Test evidence bundle");
			}
		});

		it("should return scope-mismatch for different tenant scope", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			store.save(createSampleBundle());

			const result = store.getScoped({
				traceId: "trace-test-1",
				tenantScope: otherScope,
			});

			expect(result.found).toBe(false);
			if (!result.found) {
				expect(result.reason).toBe("scope-mismatch");
			}
		});

		it("should return not-found for non-existent traceId", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			const result = store.getScoped({
				traceId: "non-existent-trace",
				tenantScope: defaultScope,
			});

			expect(result.found).toBe(false);
			if (!result.found) {
				expect(result.reason).toBe("not-found");
			}
		});

		it("should save multiple bundles independently", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			store.save(createSampleBundle({ traceId: "trace-1" }));
			store.save(
				createSampleBundle({
					traceId: "trace-2",
					tenantScope: otherScope,
				}),
			);

			const r1 = store.getScoped({
				traceId: "trace-1",
				tenantScope: defaultScope,
			});
			expect(r1.found).toBe(true);

			const r2 = store.getScoped({
				traceId: "trace-2",
				tenantScope: otherScope,
			});
			expect(r2.found).toBe(true);

			// Cross-tenant isolation
			const cross = store.getScoped({
				traceId: "trace-2",
				tenantScope: defaultScope,
			});
			expect(cross.found).toBe(false);
		});

		it("should enforce cross-tenant isolation with same traceId", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			store.save(createSampleBundle({ traceId: "shared-trace" }));

			const ownResult = store.getScoped({
				traceId: "shared-trace",
				tenantScope: defaultScope,
			});
			expect(ownResult.found).toBe(true);

			const otherResult = store.getScoped({
				traceId: "shared-trace",
				tenantScope: otherScope,
			});
			expect(otherResult.found).toBe(false);
			if (!otherResult.found) {
				expect(otherResult.reason).toBe("scope-mismatch");
			}
		});
	});

	describe("updateApprovalLineage", () => {
		it("should update the approval lineage on an existing bundle", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			store.save(createSampleBundle());

			const result = store.updateApprovalLineage({
				traceId: "trace-test-1",
				tenantScope: defaultScope,
				approvalLineage: {
					approvalId: "approval-1",
					approvalStatus: "approved",
					decision: "approved",
				},
			});

			expect(result.found).toBe(true);
			if (result.found) {
				expect(result.bundle.approvalLineage).toBeDefined();
				expect(result.bundle.approvalLineage?.approvalStatus).toBe("approved");
				expect(result.bundle.approvalLineage?.decision).toBe("approved");
			}
		});

		it("should return not-found for non-existent trace", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			const result = store.updateApprovalLineage({
				traceId: "non-existent",
				tenantScope: defaultScope,
				approvalLineage: {
					approvalId: "approval-1",
					approvalStatus: "approved",
					decision: "approved",
				},
			});

			expect(result.found).toBe(false);
		});

		it("should return scope-mismatch for wrong scope", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			store.save(createSampleBundle());

			const result = store.updateApprovalLineage({
				traceId: "trace-test-1",
				tenantScope: otherScope,
				approvalLineage: {
					approvalId: "approval-1",
					approvalStatus: "approved",
					decision: "approved",
				},
			});

			expect(result.found).toBe(false);
		});
	});

	describe("appendAuditEvent", () => {
		it("should append an audit event to an existing bundle", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			store.save(createSampleBundle());

			const result = store.appendAuditEvent({
				traceId: "trace-test-1",
				tenantScope: defaultScope,
				event: {
					eventType: "policy.evaluated",
					status: "success",
					recordedAt: new Date().toISOString(),
					actorId: "system",
					actorRole: "system",
					reasonCode: "POLICY_CHECK_PASSED",
				},
			});

			expect(result.found).toBe(true);
			if (result.found) {
				expect(result.bundle.auditTrail).toHaveLength(1);
				expect(result.bundle.auditTrail?.[0]?.eventType).toBe(
					"policy.evaluated",
				);
			}
		});

		it("should append multiple audit events in sequence", () => {
			const store = createPostgresTraceEvidenceStore(db as never);
			store.save(createSampleBundle());

			store.appendAuditEvent({
				traceId: "trace-test-1",
				tenantScope: defaultScope,
				event: {
					eventType: "first",
					status: "success",
					recordedAt: "2026-01-01T00:00:00.000Z",
					actorId: "system",
					actorRole: "system",
					reasonCode: "FIRST",
				},
			});

			const result = store.appendAuditEvent({
				traceId: "trace-test-1",
				tenantScope: defaultScope,
				event: {
					eventType: "second",
					status: "success",
					recordedAt: "2026-01-01T00:01:00.000Z",
					actorId: "admin",
					actorRole: "supervisor",
					reasonCode: "SECOND",
				},
			});

			expect(result.found).toBe(true);
			if (result.found) {
				expect(result.bundle.auditTrail).toHaveLength(2);
			}
		});

		it("should return not-found for non-existent trace", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			const result = store.appendAuditEvent({
				traceId: "non-existent",
				tenantScope: defaultScope,
				event: {
					eventType: "test",
					status: "success",
					recordedAt: "2026-01-01T00:00:00.000Z",
					actorId: "system",
					actorRole: "system",
					reasonCode: "TEST",
				},
			});

			expect(result.found).toBe(false);
		});
	});

	describe("save returns parsed bundle", () => {
		it("should validate and return the parsed bundle on save", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			const result = store.save(createSampleBundle());

			expect(result.traceId).toBe("trace-test-1");
			expect(result.redactionStatus).toBe("redacted");
			expect(result.rationale).toBe("Test evidence bundle");
		});

		it("should reject invalid bundles", () => {
			const store = createPostgresTraceEvidenceStore(db as never);

			expect(() =>
				store.save({
					traceId: "bad-trace",
					// Missing required fields
				} as unknown as EvidenceTraceBundle),
			).toThrow();
		});
	});
});
