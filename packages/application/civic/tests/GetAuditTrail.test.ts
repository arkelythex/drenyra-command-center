/**
 * GetAuditTrail — Query handler tests
 *
 * TDD: RED phase — tests written first
 */

import type { AuditTrailRepository } from "@arkelythex/domain-civic";
import { AuditTrail } from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { GetAuditTrail } from "../src/query/GetAuditTrail";

class InMemoryAuditTrailRepository implements AuditTrailRepository {
	private entries = new Map<string, AuditTrail>();

	async findById(id: string): Promise<AuditTrail | null> {
		return this.entries.get(id) ?? null;
	}

	async findByAct(actId: string): Promise<AuditTrail[]> {
		return Array.from(this.entries.values())
			.filter((e) => e.actId === actId)
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	}

	async save(entry: AuditTrail): Promise<void> {
		this.entries.set(entry.id, entry);
	}

	seed(entry: AuditTrail): void {
		this.entries.set(entry.id, entry);
	}
}

describe("GetAuditTrail", () => {
	let auditRepo: InMemoryAuditTrailRepository;
	let handler: GetAuditTrail;

	beforeEach(() => {
		auditRepo = new InMemoryAuditTrailRepository();
		handler = new GetAuditTrail(auditRepo);
	});

	it("should return chronological audit trail entries for an act", async () => {
		const entry1 = AuditTrail.create({
			id: "audit-1",
			actId: "act-1",
			action: "CREATE_ACT",
			actor: "system",
			timestamp: new Date("2026-04-12T08:00:00Z"),
		});

		const entry2 = AuditTrail.create({
			id: "audit-2",
			actId: "act-1",
			action: "VALIDATE_ACT",
			actor: "validator-1",
			timestamp: new Date("2026-04-12T09:00:00Z"),
		});

		const entry3 = AuditTrail.create({
			id: "audit-3",
			actId: "act-1",
			action: "AUDIT_COMPLETE",
			actor: "auditor-1",
			timestamp: new Date("2026-04-12T10:00:00Z"),
		});

		auditRepo.seed(entry1);
		auditRepo.seed(entry2);
		auditRepo.seed(entry3);

		const result = await handler.execute({ actId: "act-1" });

		expect(result).toHaveLength(3);
		// Chronological order
		expect(result[0].action).toBe("CREATE_ACT");
		expect(result[1].action).toBe("VALIDATE_ACT");
		expect(result[2].action).toBe("AUDIT_COMPLETE");
	});

	it("should return empty array when no audit entries exist", async () => {
		const result = await handler.execute({ actId: "nonexistent-act" });
		expect(result).toHaveLength(0);
	});

	it("should not return entries from other acts", async () => {
		const entry1 = AuditTrail.create({
			id: "audit-other",
			actId: "other-act",
			action: "CREATE_ACT",
			actor: "system",
			timestamp: new Date(),
		});
		auditRepo.seed(entry1);

		const result = await handler.execute({ actId: "different-act" });
		expect(result).toHaveLength(0);
	});

	it("should support pagination with offset and limit", async () => {
		for (let i = 1; i <= 10; i++) {
			const entry = AuditTrail.create({
				id: `audit-page-${i}`,
				actId: "act-paginated",
				action: `EVENT_${i}`,
				actor: "system",
				timestamp: new Date(`2026-04-12T${String(i).padStart(2, "0")}:00:00Z`),
			});
			auditRepo.seed(entry);
		}

		// Get first 3 entries
		const page1 = await handler.execute({
			actId: "act-paginated",
			offset: 0,
			limit: 3,
		});
		expect(page1).toHaveLength(3);
		expect(page1[0].action).toBe("EVENT_1");
		expect(page1[2].action).toBe("EVENT_3");

		// Get next 3 entries
		const page2 = await handler.execute({
			actId: "act-paginated",
			offset: 3,
			limit: 3,
		});
		expect(page2).toHaveLength(3);
		expect(page2[0].action).toBe("EVENT_4");
	});

	it("should include evidence and metadata when present", async () => {
		const entry = AuditTrail.create({
			id: "audit-evidence",
			actId: "act-evidence",
			action: "VALIDATE_ACT",
			actor: "validator-1",
			timestamp: new Date(),
			evidence: ["hash-1", "hash-2"],
			metadata: { validationType: "arithmetic", passed: true },
		});
		auditRepo.seed(entry);

		const result = await handler.execute({ actId: "act-evidence" });

		expect(result[0].evidence).toEqual(["hash-1", "hash-2"]);
		expect(result[0].metadata).toEqual({
			validationType: "arithmetic",
			passed: true,
		});
	});
});
