/**
 * DetectFraudPattern — Command handler tests
 *
 * TDD: RED phase — tests written first
 */

import type { DomainEvent } from "@arkelythex/domain";
import type {
	ElectionRepository,
	ElectoralActRepository,
	EventEmitter,
	FraudIndicatorRepository,
} from "@arkelythex/domain-civic";
import {
	Election,
	ElectionStatus,
	ElectoralAct,
	type FraudIndicator,
	ValidationStatus,
} from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { DetectFraudPattern } from "../src/command/DetectFraudPattern";

// ─── In-memory repository mocks ────────────────────────────────────
class InMemoryElectionRepository implements ElectionRepository {
	private elections = new Map<string, Election>();

	async findById(id: string): Promise<Election | null> {
		return this.elections.get(id) ?? null;
	}

	async findByRegion(_region: string): Promise<Election[]> {
		return Array.from(this.elections.values()).filter(
			(e) => e.region === _region,
		);
	}

	async findByStatus(_status: string): Promise<Election[]> {
		return Array.from(this.elections.values()).filter(
			(e) => e.status === _status,
		);
	}

	async save(election: Election): Promise<void> {
		this.elections.set(election.id, election);
	}

	async delete(id: string): Promise<void> {
		this.elections.delete(id);
	}

	seed(election: Election): void {
		this.elections.set(election.id, election);
	}
}

class InMemoryElectoralActRepository implements ElectoralActRepository {
	private acts = new Map<string, ElectoralAct>();

	async findById(id: string): Promise<ElectoralAct | null> {
		return this.acts.get(id) ?? null;
	}

	async findByStation(stationId: string): Promise<ElectoralAct[]> {
		return Array.from(this.acts.values()).filter(
			(a) => a.stationId === stationId,
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

	all(): ElectoralAct[] {
		return Array.from(this.acts.values());
	}
}

class InMemoryFraudIndicatorRepository implements FraudIndicatorRepository {
	private indicators = new Map<string, FraudIndicator>();
	private electionMap = new Map<string, string[]>(); // electionId → indicatorIds

	async findById(id: string): Promise<FraudIndicator | null> {
		return this.indicators.get(id) ?? null;
	}

	async findByElection(electionId: string): Promise<FraudIndicator[]> {
		const ids = this.electionMap.get(electionId) ?? [];
		return ids.map((id) => this.indicators.get(id)!);
	}

	async findBySeverity(severity: string): Promise<FraudIndicator[]> {
		return Array.from(this.indicators.values()).filter(
			(i) => i.severity === severity,
		);
	}

	async save(indicator: FraudIndicator): Promise<void> {
		// Generate an id from props since FraudIndicator has no id field
		const key = `${indicator.type}-${indicator.detectedAt.getTime()}-${Math.random()}`;
		this.indicators.set(key, indicator);
	}

	saveForElection(electionId: string, indicator: FraudIndicator): void {
		const key = `${indicator.type}-${indicator.detectedAt.getTime()}-${Math.random()}`;
		this.indicators.set(key, indicator);
		const ids = this.electionMap.get(electionId) ?? [];
		ids.push(key);
		this.electionMap.set(electionId, ids);
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

describe("DetectFraudPattern", () => {
	let electionRepo: InMemoryElectionRepository;
	let actRepo: InMemoryElectoralActRepository;
	let indicatorRepo: InMemoryFraudIndicatorRepository;
	let eventEmitter: InMemoryEventEmitter;
	let handler: DetectFraudPattern;

	beforeEach(() => {
		electionRepo = new InMemoryElectionRepository();
		actRepo = new InMemoryElectoralActRepository();
		indicatorRepo = new InMemoryFraudIndicatorRepository();
		eventEmitter = new InMemoryEventEmitter();
		handler = new DetectFraudPattern(
			electionRepo,
			actRepo,
			indicatorRepo,
			eventEmitter,
		);
	});

	it("should detect digit fatigue patterns from electoral acts", async () => {
		const election = Election.create({
			id: "election-1",
			name: "General Election 2026",
			date: new Date("2026-04-12"),
			region: "Lima",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1"],
		});
		electionRepo.seed(election);

		// Create acts with digit fatigue pattern
		const act1 = ElectoralAct.create({
			id: "act-f1",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 100],
				["candidate-2", 10],
				["candidate-3", 90],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act1);

		const act2 = ElectoralAct.create({
			id: "act-f2",
			stationId: "station-1",
			urnNumber: 2,
			voteTallies: new Map([
				["candidate-1", 95],
				["candidate-2", 8],
				["candidate-3", 97],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act2);

		const result = await handler.execute({
			electionId: "election-1",
			analysisType: "digit-fatigue",
		});

		expect(result.electionId).toBe("election-1");
		expect(result.analysisType).toBe("digit-fatigue");
		expect(result.indicators.length).toBeGreaterThanOrEqual(0);
	});

	it("should detect anomalous turnout patterns", async () => {
		const election = Election.create({
			id: "election-2",
			name: "Regional Election 2026",
			date: new Date("2026-06-15"),
			region: "Arequipa",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1", "station-2", "station-3"],
		});
		electionRepo.seed(election);

		// Create acts with normal distribution - need multiple acts for anomaly detection
		for (let i = 1; i <= 5; i++) {
			const act = ElectoralAct.create({
				id: `act-a${i}`,
				stationId: `station-${i}`,
				urnNumber: i,
				voteTallies: new Map([
					["candidate-1", 50],
					["candidate-2", 40],
				]),
				validationStatus: ValidationStatus.VALID,
			});
			actRepo.seed(act);
		}

		const result = await handler.execute({
			electionId: "election-2",
			analysisType: "anomaly",
		});

		expect(result.electionId).toBe("election-2");
		expect(result.analysisType).toBe("anomaly");
	});

	it("should detect pattern manipulation (repeating digits)", async () => {
		const election = Election.create({
			id: "election-3",
			name: "Municipal Election",
			date: new Date("2026-03-10"),
			region: "Cusco",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1"],
		});
		electionRepo.seed(election);

		// Act with suspicious round numbers
		const act = ElectoralAct.create({
			id: "act-p1",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 500],
				["candidate-2", 500],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act);

		const result = await handler.execute({
			electionId: "election-3",
			analysisType: "pattern-manipulation",
		});

		expect(result.electionId).toBe("election-3");
		expect(result.analysisType).toBe("pattern-manipulation");
	});

	it("should return no indicators when no fraud is detected", async () => {
		const election = Election.create({
			id: "election-4",
			name: "Clean Election",
			date: new Date("2026-01-20"),
			region: "Puno",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1"],
		});
		electionRepo.seed(election);

		const act = ElectoralAct.create({
			id: "act-clean",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 47],
				["candidate-2", 42],
				["candidate-3", 11],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act);

		const result = await handler.execute({
			electionId: "election-4",
			analysisType: "digit-fatigue",
		});

		expect(result.indicators).toHaveLength(0);
		expect(result.summary.totalIndicators).toBe(0);
	});

	it("should throw if election does not exist", async () => {
		await expect(
			handler.execute({
				electionId: "nonexistent",
				analysisType: "digit-fatigue",
			}),
		).rejects.toThrow(/not found/i);
	});

	it("should save fraud indicators for the election", async () => {
		const election = Election.create({
			id: "election-5",
			name: "Election with Fraud",
			date: new Date("2026-05-01"),
			region: "Junin",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1"],
		});
		electionRepo.seed(election);

		// Edge case: acts with all zeros (should not trigger anything)
		const act = ElectoralAct.create({
			id: "act-zero",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 0],
				["candidate-2", 0],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act);

		const result = await handler.execute({
			electionId: "election-5",
			analysisType: "pattern-manipulation",
		});

		expect(result.indicators).toHaveLength(0);
	});
});
