/**
 * ValidateElectoralAct — Command handler tests
 *
 * TDD: RED phase — tests written first
 */

import type { DomainEvent } from "@arkelythex/domain";
import type {
	AuditTrailRepository,
	ElectoralActRepository,
	EventEmitter,
} from "@arkelythex/domain-civic";
import {
	type AuditTrail,
	ElectoralAct,
	ValidationStatus,
} from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { ValidateElectoralAct } from "../src/command/ValidateElectoralAct";

// ─── In-memory repository mocks ────────────────────────────────────
class InMemoryElectoralActRepository implements ElectoralActRepository {
	private acts = new Map<string, ElectoralAct>();

	async findById(id: string): Promise<ElectoralAct | null> {
		return this.acts.get(id) ?? null;
	}

	async findByStation(_stationId: string): Promise<ElectoralAct[]> {
		return Array.from(this.acts.values()).filter(
			(a) => a.stationId === _stationId,
		);
	}

	async findByStatus(status: string): Promise<ElectoralAct[]> {
		return Array.from(this.acts.values()).filter(
			(a) => a.validationStatus === status,
		);
	}

	async save(act: ElectoralAct): Promise<void> {
		this.acts.set(act.id, act);
	}

	seed(act: ElectoralAct): void {
		this.acts.set(act.id, act);
	}
}

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
}

// ─── In-memory event emitter ──────────────────────────────────────
class InMemoryEventEmitter implements EventEmitter {
	public emitted: DomainEvent[] = [];

	async emit(event: DomainEvent): Promise<void> {
		this.emitted.push(event);
	}

	async emitMany(events: DomainEvent[]): Promise<void> {
		this.emitted.push(...events);
	}
}

// ─── Fixtures ──────────────────────────────────────────────────────
function createPendingAct(id: string, stationId: string): ElectoralAct {
	return ElectoralAct.create({
		id,
		stationId,
		urnNumber: 1,
		voteTallies: new Map([
			["candidate-1", 100],
			["candidate-2", 80],
			["candidate-3", 20],
		]),
		validationStatus: ValidationStatus.PENDING,
	});
}

function createInvalidAct(id: string, stationId: string): ElectoralAct {
	return ElectoralAct.create({
		id,
		stationId,
		urnNumber: 1,
		voteTallies: new Map([["candidate-1", 50]]),
		validationStatus: ValidationStatus.INVALID,
	});
}

describe("ValidateElectoralAct", () => {
	let actRepo: InMemoryElectoralActRepository;
	let auditRepo: InMemoryAuditTrailRepository;
	let eventEmitter: InMemoryEventEmitter;
	let handler: ValidateElectoralAct;

	beforeEach(() => {
		actRepo = new InMemoryElectoralActRepository();
		auditRepo = new InMemoryAuditTrailRepository();
		eventEmitter = new InMemoryEventEmitter();
		handler = new ValidateElectoralAct(actRepo, auditRepo, eventEmitter);
	});

	it("should validate a pending act and mark it as valid", async () => {
		const act = createPendingAct("act-1", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-1",
			validatorId: "validator-1",
			evidence: [],
		});

		expect(result.outcome).toBe("approved");
		expect(result.actId).toBe("act-1");
		expect(result.validatedBy).toBe("validator-1");
		expect(result.errors).toHaveLength(0);
	});

	it("should create an audit trail entry after validation", async () => {
		const act = createPendingAct("act-2", "station-1");
		actRepo.seed(act);

		await handler.execute({
			actId: "act-2",
			validatorId: "validator-1",
			evidence: [],
		});

		const entries = await auditRepo.findByAct("act-2");
		expect(entries).toHaveLength(1);
		expect(entries[0].action).toBe("VALIDATE_ACT");
		expect(entries[0].actor).toBe("validator-1");
	});

	it("should reject an act with vote tally exceeding registered voters", async () => {
		const act = ElectoralAct.create({
			id: "act-3",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 500],
				["candidate-2", 300],
			]),
			validationStatus: ValidationStatus.PENDING,
		});
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-3",
			validatorId: "validator-1",
			evidence: [],
			registeredVoters: 500, // total votes = 800 > 500
		});

		expect(result.outcome).toBe("rejected");
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain("exceed");
	});

	it("should throw if the act is not pending", async () => {
		const act = createInvalidAct("act-4", "station-1");
		actRepo.seed(act);

		await expect(
			handler.execute({
				actId: "act-4",
				validatorId: "validator-1",
				evidence: [],
			}),
		).rejects.toThrow(/cannot validate|not pending|PENDING/i);
	});

	it("should throw if the act does not exist", async () => {
		await expect(
			handler.execute({
				actId: "nonexistent",
				validatorId: "validator-1",
				evidence: [],
			}),
		).rejects.toThrow(/not found/i);
	});

	it("should return needs-review when fraud indicators are detected", async () => {
		const act = createPendingAct("act-5", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-5",
			validatorId: "validator-1",
			evidence: [],
			registeredVoters: 500,
			detectedFraudIndicators: [
				{
					type: "VOTE_PATTERN_ANOMALY",
					severity: "HIGH",
					description: "Unusual vote pattern detected",
					evidence: [],
					detectedAt: new Date(),
				},
			],
		});

		expect(result.outcome).toBe("needs-review");
		expect(result.fraudIndicators).toHaveLength(1);
		expect(result.fraudIndicators[0].type).toBe("VOTE_PATTERN_ANOMALY");
	});
});
