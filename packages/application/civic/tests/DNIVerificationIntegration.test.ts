/**
 * DNIVerificationIntegration — Tests for DNI verification in ValidateElectoralAct flow
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

class InMemoryEventEmitter implements EventEmitter {
	public emitted: DomainEvent[] = [];

	async emit(event: DomainEvent): Promise<void> {
		this.emitted.push(event);
	}

	async emitMany(events: DomainEvent[]): Promise<void> {
		this.emitted.push(...events);
	}
}

function createPendingAct(id: string, stationId: string): ElectoralAct {
	return ElectoralAct.create({
		id,
		stationId,
		urnNumber: 1,
		voteTallies: new Map([["candidate-1", 100]]),
		validationStatus: ValidationStatus.PENDING,
	});
}

describe("DNIVerification in ValidateElectoralAct", () => {
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

	it("should verify a list of valid voter DNIs", async () => {
		const act = createPendingAct("act-voter-1", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-1",
			validatorId: "validator-1",
			evidence: [],
			voterDnis: ["12345678", "87654321"],
		});

		expect(result.voterVerificationResults).toBeDefined();
		expect(result.voterVerificationResults).toHaveLength(2);
	});

	it("should mark verified DNIs with VERIFIED status when checksum is valid", async () => {
		const act = createPendingAct("act-voter-2", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-2",
			validatorId: "validator-2",
			evidence: [],
			voterDnis: ["12345678"],
		});

		expect(result.voterVerificationResults?.[0].dni).toBe("12345678");
		expect(result.voterVerificationResults?.[0].status).toBe("VERIFIED");
	});

	it("should return verification results for each DNI", async () => {
		const act = createPendingAct("act-voter-3", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-3",
			validatorId: "validator-3",
			evidence: [],
			voterDnis: ["12345678", "11111111", "87654321"],
		});

		expect(result.voterVerificationResults).toHaveLength(3);
	});

	it("should not include voterVerificationResults when no DNIs provided", async () => {
		const act = createPendingAct("act-voter-4", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-4",
			validatorId: "validator-4",
			evidence: [],
		});

		expect(result.voterVerificationResults).toBeUndefined();
	});

	it("should emit ActValidatedEvent on validation", async () => {
		const act = createPendingAct("act-event-1", "station-1");
		actRepo.seed(act);

		await handler.execute({
			actId: "act-event-1",
			validatorId: "validator-1",
			evidence: [],
		});

		expect(eventEmitter.emitted.length).toBeGreaterThan(0);
		const validatedEvent = eventEmitter.emitted.find(
			(e) => e.eventName === "civic.act.validated",
		);
		expect(validatedEvent).toBeDefined();
	});

	it("should emit ActValidatedEvent with correct outcome", async () => {
		const act = createPendingAct("act-event-2", "station-1");
		actRepo.seed(act);

		await handler.execute({
			actId: "act-event-2",
			validatorId: "validator-1",
			evidence: [],
			detectedFraudIndicators: [
				{
					type: "VOTE_PATTERN_ANOMALY",
					severity: "LOW",
					description: "Minor anomaly",
					evidence: [],
					detectedAt: new Date(),
				},
			],
		});

		const validatedEvent = eventEmitter.emitted.find(
			(e) => e.eventName === "civic.act.validated",
		);
		expect(validatedEvent).toBeDefined();
	});

	it("should not include voterVerificationResults when voter DNIs array is empty", async () => {
		const act = createPendingAct("act-voter-5", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-5",
			validatorId: "validator-5",
			evidence: [],
			voterDnis: [],
		});

		// Empty array is treated as "no DNIs provided" — field is undefined
		expect(result.voterVerificationResults).toBeUndefined();
	});

	it("should include verifierId for verified DNIs", async () => {
		const act = createPendingAct("act-voter-6", "station-1");
		actRepo.seed(act);

		const result = await handler.execute({
			actId: "act-voter-6",
			validatorId: "validator-6",
			evidence: [],
			voterDnis: ["12345678"],
		});

		const verification = result.voterVerificationResults?.[0];
		expect(verification.verifierId).toBe("validator-6");
		expect(verification.verifiedAt).toBeDefined();
	});
});
