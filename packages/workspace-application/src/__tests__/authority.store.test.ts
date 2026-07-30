import { describe, it, expect, beforeEach } from "vitest";
import {
	createExecutionId,
	createOperationalState,
} from "@drenyra/workspace-domain";
import {
	InMemoryAuthorityStore,
	type AuthorityStore,
} from "../authority/store";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
	type AuthoritativeStateRecord,
} from "../authority/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(
	overrides: Partial<AuthoritativeStateRecord> = {},
): AuthoritativeStateRecord {
	const now = "2026-07-15T10:00:00.000Z";
	return {
		executionId: createExecutionId(),
		state: createOperationalState(),
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		sequence: 1,
		observedAt: now,
		effectiveAt: now,
		schemaVersion: CURRENT_AUTHORITY_SCHEMA_VERSION,
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemoryAuthorityStore", () => {
	let store: AuthorityStore;

	beforeEach(() => {
		store = new InMemoryAuthorityStore();
	});

	describe("appendRecord + getRecords", () => {
		it("should append a record and retrieve it", () => {
			const record = makeRecord();
			store.appendRecord(record);
			const records = store.getRecords(record.executionId);
			expect(records).toHaveLength(1);
			expect(records[0]!.executionId).toBe(record.executionId);
			expect(records[0]!.sequence).toBe(record.sequence);
		});

		it("should retrieve multiple records for the same executionId", () => {
			const executionId = createExecutionId();
			const r1 = makeRecord({ executionId, sequence: 1 });
			const r2 = makeRecord({ executionId, sequence: 2 });

			store.appendRecord(r1);
			store.appendRecord(r2);

			const records = store.getRecords(executionId);
			expect(records).toHaveLength(2);
		});

		it("should isolate records by executionId", () => {
			const r1 = makeRecord({
				executionId: "exec-a" as ReturnType<typeof createExecutionId>,
			});
			const r2 = makeRecord({
				executionId: "exec-b" as ReturnType<typeof createExecutionId>,
			});

			store.appendRecord(r1);
			store.appendRecord(r2);

			expect(
				store.getRecords("exec-a" as ReturnType<typeof createExecutionId>),
			).toHaveLength(1);
			expect(
				store.getRecords("exec-b" as ReturnType<typeof createExecutionId>),
			).toHaveLength(1);
		});
	});

	describe("getLatestRecord", () => {
		it("should return null when no records exist", () => {
			expect(store.getLatestRecord(createExecutionId())).toBeNull();
		});

		it("should return the most recent record by sequence", () => {
			const executionId = createExecutionId();
			const r1 = makeRecord({ executionId, sequence: 1 });
			const r2 = makeRecord({ executionId, sequence: 5 });
			const r3 = makeRecord({ executionId, sequence: 3 });

			store.appendRecord(r1);
			store.appendRecord(r2);
			store.appendRecord(r3);

			const latest = store.getLatestRecord(executionId);
			expect(latest).not.toBeNull();
			expect(latest!.sequence).toBe(5);
		});
	});
});
