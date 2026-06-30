/**
 * GetElectionResults — Query handler tests
 *
 * TDD: RED phase — tests written first
 */

import type {
	ElectionRepository,
	ElectoralActRepository,
} from "@arkelythex/domain-civic";
import {
	Election,
	ElectionStatus,
	ElectoralAct,
	ValidationStatus,
} from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { GetElectionResults } from "../src/query/GetElectionResults";

// ─── In-memory repository mocks ────────────────────────────────────
class InMemoryElectionRepository implements ElectionRepository {
	private elections = new Map<string, Election>();

	async findById(id: string): Promise<Election | null> {
		return this.elections.get(id) ?? null;
	}

	async findByRegion(region: string): Promise<Election[]> {
		return Array.from(this.elections.values()).filter(
			(e) => e.region === region,
		);
	}

	async findByStatus(status: string): Promise<Election[]> {
		return Array.from(this.elections.values()).filter(
			(e) => e.status === status,
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

	all(): ElectoralAct[] {
		return Array.from(this.acts.values());
	}

	seed(act: ElectoralAct): void {
		this.acts.set(act.id, act);
	}
}

describe("GetElectionResults", () => {
	let electionRepo: InMemoryElectionRepository;
	let actRepo: InMemoryElectoralActRepository;
	let handler: GetElectionResults;

	beforeEach(() => {
		electionRepo = new InMemoryElectionRepository();
		actRepo = new InMemoryElectoralActRepository();
		handler = new GetElectionResults(electionRepo, actRepo);
	});

	it("should return aggregated results grouped by candidate", async () => {
		const election = Election.create({
			id: "election-1",
			name: "General Election 2026",
			date: new Date("2026-04-12"),
			region: "Lima",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1", "station-2"],
		});
		electionRepo.seed(election);

		// Two acts with same candidates
		const act1 = ElectoralAct.create({
			id: "act-1",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 100],
				["candidate-2", 80],
				["candidate-3", 20],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act1);

		const act2 = ElectoralAct.create({
			id: "act-2",
			stationId: "station-2",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 120],
				["candidate-2", 70],
				["candidate-3", 10],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act2);

		const result = await handler.execute({ electionId: "election-1" });

		expect(result.electionId).toBe("election-1");
		expect(result.electionName).toBe("General Election 2026");
		expect(result.totalVotes).toBe(400); // 100+80+20+120+70+10
		expect(result.results).toHaveLength(3);

		// Check candidate-1 has 220 votes (100+120)
		const c1 = result.results.find((r) => r.candidateId === "candidate-1");
		expect(c1).toBeDefined();
		expect(c1?.votes).toBe(220);
		expect(c1?.percentage).toBeCloseTo(55, 0);
	});

	it("should return empty results for an election with no acts", async () => {
		const election = Election.create({
			id: "election-empty",
			name: "Empty Election",
			date: new Date("2026-04-12"),
			region: "Ica",
			status: ElectionStatus.ACTIVE,
		});
		electionRepo.seed(election);

		const result = await handler.execute({ electionId: "election-empty" });

		expect(result.results).toHaveLength(0);
		expect(result.totalVotes).toBe(0);
		expect(result.metadata.reportedPollingStations).toBe(0);
	});

	it("should throw if election does not exist", async () => {
		await expect(
			handler.execute({ electionId: "nonexistent" }),
		).rejects.toThrow(/not found/i);
	});

	it("should calculate turnout percentage", async () => {
		const election = Election.create({
			id: "election-turnout",
			name: "Turnout Test",
			date: new Date("2026-04-12"),
			region: "Lima",
			status: ElectionStatus.COMPLETED,
			pollingStationIds: ["station-1"],
		});
		electionRepo.seed(election);

		const act = ElectoralAct.create({
			id: "act-turnout",
			stationId: "station-1",
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 150],
				["candidate-2", 100],
				["candidate-3", 50],
			]),
			validationStatus: ValidationStatus.VALID,
		});
		actRepo.seed(act);

		const result = await handler.execute({
			electionId: "election-turnout",
			registeredVoters: 500,
		});

		expect(result.turnout).toBeCloseTo(0.6, 1); // 300 / 500 = 60%
	});
});
