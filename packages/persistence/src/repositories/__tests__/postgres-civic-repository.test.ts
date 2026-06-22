/**
 * Civic Repository — Integration Tests
 *
 * Tests for all four Postgres civic repository adapters.
 * Uses the domain entities and port interfaces from @arkelythex/domain-civic.
 *
 * NOTE: These tests require a real DB connection (DATABASE_URL).
 * They are skipped by default unless INTEGRATION=true is set.
 */

import {
	AuditTrail,
	Election,
	ElectionStatus,
	ElectoralAct,
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
	PollingStation,
	ValidationStatus,
} from "@arkelythex/domain-civic";
import { describe, expect, it } from "vitest";
import { PostgresAuditTrailRepository } from "../postgres-audit-trail.repository";
import { PostgresElectionRepository } from "../postgres-election.repository";
import { PostgresElectoralActRepository } from "../postgres-electoral-act.repository";
import { PostgresFraudIndicatorRepository } from "../postgres-fraud-indicator.repository";

const runIntegration = process.env.INTEGRATION === "true";

describe.runIf(runIntegration)("PostgresElectionRepository", () => {
	const repo = new PostgresElectionRepository();

	it("saves and retrieves an election by id", async () => {
		const election = Election.create({
			name: "Test Election 2026",
			date: new Date("2026-04-12"),
			region: "Lima",
		});

		await repo.save(election);
		const found = await repo.findById(election.id);

		expect(found).not.toBeNull();
		expect(found!.id).toBe(election.id);
		expect(found!.name).toBe("Test Election 2026");
		expect(found!.region).toBe("Lima");
	});

	it("finds elections by region", async () => {
		const election = Election.create({
			name: "Regional Test",
			date: new Date("2026-04-12"),
			region: "Arequipa",
		});
		await repo.save(election);

		const found = await repo.findByRegion("Arequipa");
		expect(found.length).toBeGreaterThanOrEqual(1);
		expect(found.some((e) => e.id === election.id)).toBe(true);
	});

	it("finds elections by status", async () => {
		const election = Election.create({
			name: "Status Test",
			date: new Date("2026-04-12"),
			region: "Cusco",
			status: ElectionStatus.ACTIVE,
		});
		await repo.save(election);

		const found = await repo.findByStatus(ElectionStatus.ACTIVE);
		expect(found.some((e) => e.id === election.id)).toBe(true);
	});

	it("returns null for non-existent id", async () => {
		const found = await repo.findById("00000000-0000-0000-0000-000000000000");
		expect(found).toBeNull();
	});

	it("deletes an election", async () => {
		const election = Election.create({
			name: "Delete Test",
			date: new Date("2026-04-12"),
			region: "Piura",
		});
		await repo.save(election);
		await repo.delete(election.id);

		const found = await repo.findById(election.id);
		expect(found).toBeNull();
	});
});

describe.runIf(runIntegration)("PostgresElectoralActRepository", () => {
	const electionRepo = new PostgresElectionRepository();
	const stationRepo = new (class {
		// We'll use a temporary approach for the station
		store: Map<string, { id: string; electionId: string }> = new Map();
		async save(station: PollingStation): Promise<void> {
			this.store.set(station.id, {
				id: station.id,
				electionId: station.electionId,
			});
		}
		async findById(id: string) {
			return this.store.get(id) || null;
		}
	})();
	const repo = new PostgresElectoralActRepository();

	let stationId: string;
	let _electionId: string;

	it("saves and retrieves an electoral act", async () => {
		const election = Election.create({
			name: "Act Test Election",
			date: new Date("2026-04-12"),
			region: "Lima",
		});
		await electionRepo.save(election);
		_electionId = election.id;

		const station = PollingStation.create({
			code: "PS001",
			name: "Polling Station 1",
			location: "Location 1",
			urnCount: 5,
			registeredVoters: 1000,
			electionId: election.id,
		});
		await stationRepo.save(station);
		stationId = station.id;

		const act = ElectoralAct.create({
			stationId: station.id,
			urnNumber: 1,
			voteTallies: new Map([
				["candidate-1", 500],
				["candidate-2", 300],
			]),
		});
		await repo.save(act);

		const found = await repo.findById(act.id);
		expect(found).not.toBeNull();
		expect(found!.id).toBe(act.id);
		expect(found!.urnNumber).toBe(1);
		expect(found!.stationId).toBe(station.id);
	});

	it("finds acts by station", async () => {
		const acts = await repo.findByStation(stationId);
		expect(acts.length).toBeGreaterThanOrEqual(1);
	});

	it("finds acts by validation status", async () => {
		const acts = await repo.findByStatus(ValidationStatus.PENDING);
		expect(acts.length).toBeGreaterThanOrEqual(1);
	});
});

describe.runIf(runIntegration)("PostgresAuditTrailRepository", () => {
	const repo = new PostgresAuditTrailRepository();

	it("saves and retrieves an audit trail entry", async () => {
		const entry = AuditTrail.create({
			actId: "00000000-0000-0000-0000-000000000001",
			action: "VALIDATE_ACT",
			actor: "validator-1",
			timestamp: new Date(),
			evidence: ["hash-1"],
			metadata: { outcome: "approved" },
		});
		await repo.save(entry);

		const found = await repo.findById(entry.id);
		expect(found).not.toBeNull();
		expect(found!.id).toBe(entry.id);
		expect(found!.action).toBe("VALIDATE_ACT");
	});

	it("finds entries by act id", async () => {
		const entries = await repo.findByAct(
			"00000000-0000-0000-0000-000000000001",
		);
		expect(entries.length).toBeGreaterThanOrEqual(1);
	});
});

describe.runIf(runIntegration)("PostgresFraudIndicatorRepository", () => {
	const repo = new PostgresFraudIndicatorRepository();

	it("saves and retrieves a fraud indicator", async () => {
		const indicator = FraudIndicator.create({
			type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
			severity: FraudSeverity.HIGH,
			description: "Suspicious voting pattern detected",
			evidence: ["evidence-hash-1"],
			detectedAt: new Date(),
		});
		await repo.save(indicator);

		const found = await repo.findById(indicator.id);
		expect(found).not.toBeNull();
		expect(found!.type).toBe(FraudIndicatorType.VOTE_PATTERN_ANOMALY);
	});

	it("finds indicators by severity", async () => {
		const indicators = await repo.findBySeverity(FraudSeverity.HIGH);
		expect(indicators.length).toBeGreaterThanOrEqual(1);
	});
});
