import type { ExecutionId } from "@drenyra/workspace-domain";
import type { AuthoritativeStateRecord } from "./types";

// ─── Authority Store Interface ───────────────────────────────────────────────

export interface AuthorityStore {
	getRecords(executionId: ExecutionId): readonly AuthoritativeStateRecord[];
	appendRecord(record: AuthoritativeStateRecord): void;
	getLatestRecord(executionId: ExecutionId): AuthoritativeStateRecord | null;
}

// ─── In-Memory Implementation ────────────────────────────────────────────────

export class InMemoryAuthorityStore implements AuthorityStore {
	private readonly records: Map<string, AuthoritativeStateRecord[]> = new Map();

	getRecords(executionId: ExecutionId): readonly AuthoritativeStateRecord[] {
		return this.records.get(executionId) ?? [];
	}

	appendRecord(record: AuthoritativeStateRecord): void {
		const existing = this.records.get(record.executionId) ?? [];
		existing.push(record);
		this.records.set(record.executionId, existing);
	}

	getLatestRecord(executionId: ExecutionId): AuthoritativeStateRecord | null {
		const records = this.records.get(executionId);
		if (!records || records.length === 0) {
			return null;
		}

		// Sort by sequence descending, return highest
		const sorted = [...records].sort((a, b) => b.sequence - a.sequence);
		return sorted[0] ?? null;
	}
}
