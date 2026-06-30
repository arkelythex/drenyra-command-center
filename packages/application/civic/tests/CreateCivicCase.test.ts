/**
 * CreateCivicCase — Integration tests
 *
 * Tests for CreateCivicCase, EscalateCivicCase, AddFraudEvidence, GetCivicCase
 */

import type { DomainEvent } from "@arkelythex/domain";
import type {
	CivicCase,
	CivicCaseRepository,
	EventEmitter,
} from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { AddFraudEvidence } from "../src/command/AddFraudEvidence";
import { CreateCivicCase } from "../src/command/CreateCivicCase";
import { EscalateCivicCase } from "../src/command/EscalateCivicCase";
import { GetCivicCase } from "../src/query/GetCivicCase";

// ─── In-memory repository mock ─────────────────────────────────────
class InMemoryCivicCaseRepository implements CivicCaseRepository {
	private cases = new Map<string, CivicCase>();

	async findById(id: string): Promise<CivicCase | null> {
		return this.cases.get(id) ?? null;
	}

	async findByStatus(status: string): Promise<CivicCase[]> {
		return Array.from(this.cases.values()).filter((c) => c.status === status);
	}

	async save(civicCase: CivicCase): Promise<void> {
		this.cases.set(civicCase.id, civicCase);
	}

	async delete(id: string): Promise<void> {
		this.cases.delete(id);
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

describe("CivicCase Integration", () => {
	let repo: InMemoryCivicCaseRepository;
	let emitter: InMemoryEventEmitter;
	let createHandler: CreateCivicCase;
	let escalateHandler: EscalateCivicCase;
	let addEvidenceHandler: AddFraudEvidence;
	let getHandler: GetCivicCase;

	beforeEach(() => {
		repo = new InMemoryCivicCaseRepository();
		emitter = new InMemoryEventEmitter();
		createHandler = new CreateCivicCase(repo);
		escalateHandler = new EscalateCivicCase(repo, emitter);
		addEvidenceHandler = new AddFraudEvidence(repo, emitter);
		getHandler = new GetCivicCase(repo);
	});

	it("should create a civic case", async () => {
		const result = await createHandler.execute({
			name: "Fraud Investigation Case 2026",
			electionIds: ["election-1"],
		});

		expect(result.name).toBe("Fraud Investigation Case 2026");
		expect(result.status).toBe("DRAFT");
		expect(result.electionIds).toEqual(["election-1"]);
		expect(result.fraudIndicators).toHaveLength(0);
		expect(result.timeline).toHaveLength(0);
		expect(result.escalationReason).toBeUndefined();
	});

	it("should escalate a completed civic case", async () => {
		const created = await createHandler.execute({
			name: "Escalatable Case",
		});

		// The case is DRAFT — to escalate we need it COMPLETED
		// Manually transition through the required states via domain entity
		const caseEntity = await repo.findById(created.id);
		const activated = caseEntity?.activate();
		await repo.save(activated);
		const completed = activated.complete();
		await repo.save(completed);

		const result = await escalateHandler.execute({
			caseId: created.id,
			reason: "Requires judicial intervention",
			escalatedTo: "Fiscalía Anticorrupción",
		});

		expect(result.status).toBe("ESCALATED");
		expect(result.escalationReason).toBe("Requires judicial intervention");
	});

	it("should emit CaseEscalatedEvent on escalation", async () => {
		const created = await createHandler.execute({
			name: "Event Test Case",
		});

		const caseEntity = await repo.findById(created.id);
		await repo.save(caseEntity?.activate());
		await repo.save(caseEntity?.activate().complete());

		await escalateHandler.execute({
			caseId: created.id,
			reason: "New evidence found",
			escalatedTo: "Juzgado Electoral",
		});

		expect(emitter.emitted.length).toBeGreaterThan(0);
		const escalatedEvent = emitter.emitted.find(
			(e) => e.eventName === "civic.case.escalated",
		);
		expect(escalatedEvent).toBeDefined();
	});

	it("should add fraud evidence to a civic case", async () => {
		const created = await createHandler.execute({
			name: "Fraud Evidence Case",
			electionIds: ["election-1"],
		});

		const result = await addEvidenceHandler.execute({
			caseId: created.id,
			actId: "act-001",
			electionId: "election-1",
			fraudIndicators: [
				{
					type: "VOTE_PATTERN_ANOMALY",
					severity: "HIGH",
					description: "Suspicious vote pattern detected",
					evidence: ["ev-001", "ev-002"],
				},
			],
		});

		expect(result.fraudIndicators).toHaveLength(1);
		expect(result.fraudIndicators[0].type).toBe("VOTE_PATTERN_ANOMALY");
		expect(result.fraudIndicators[0].severity).toBe("HIGH");
	});

	it("should emit FraudDetectedEvent when evidence is added", async () => {
		const created = await createHandler.execute({
			name: "Evidence Event Case",
		});

		await addEvidenceHandler.execute({
			caseId: created.id,
			actId: "act-002",
			electionId: "election-1",
			fraudIndicators: [
				{
					type: "TURNOUT_SPIKE",
					severity: "CRITICAL",
					description: "Abnormal turnout spike",
					evidence: ["ev-003"],
				},
			],
		});

		const fraudEvent = emitter.emitted.find(
			(e) => e.eventName === "civic.fraud.detected",
		);
		expect(fraudEvent).toBeDefined();
	});

	it("should get a civic case by id", async () => {
		const created = await createHandler.execute({
			name: "Retrievable Case",
			electionIds: ["election-1", "election-2"],
		});

		const result = await getHandler.execute({ caseId: created.id });

		expect(result.id).toBe(created.id);
		expect(result.name).toBe("Retrievable Case");
		expect(result.electionIds).toHaveLength(2);
	});

	it("should throw when getting a non-existent case", async () => {
		await expect(getHandler.execute({ caseId: "nonexistent" })).rejects.toThrow(
			/not found/i,
		);
	});

	it("should throw when escalating a non-existent case", async () => {
		await expect(
			escalateHandler.execute({
				caseId: "nonexistent",
				reason: "reason",
				escalatedTo: "authority",
			}),
		).rejects.toThrow(/not found/i);
	});

	it("should create a case with fraud indicators", async () => {
		const result = await createHandler.execute({
			name: "Case With Initial Indicators",
			electionIds: ["election-1"],
		});

		expect(result.fraudIndicators).toHaveLength(0);

		// Add multiple fraud indicators
		const withEvidence = await addEvidenceHandler.execute({
			caseId: result.id,
			actId: "act-003",
			electionId: "election-1",
			fraudIndicators: [
				{
					type: "VOTE_PATTERN_ANOMALY",
					severity: "MEDIUM",
					description: "Pattern anomaly 1",
					evidence: [],
				},
				{
					type: "TURNOUT_SPIKE",
					severity: "HIGH",
					description: "Turnout spike",
					evidence: ["ev-004"],
				},
			],
		});

		expect(withEvidence.fraudIndicators).toHaveLength(2);
		expect(withEvidence.fraudIndicators[0].description).toBe(
			"Pattern anomaly 1",
		);
		expect(withEvidence.fraudIndicators[1].description).toBe("Turnout spike");
	});
});
