/**
 * GetFraudAnalysis — Query handler tests
 *
 * TDD: RED phase — tests written first
 */

import type { FraudIndicatorRepository } from "@arkelythex/domain-civic";
import {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "@arkelythex/domain-civic";
import { beforeEach, describe, expect, it } from "vitest";
import { GetFraudAnalysis } from "../src/query/GetFraudAnalysis";

class InMemoryFraudIndicatorRepository implements FraudIndicatorRepository {
	private indicators = new Map<string, FraudIndicator>();
	private electionMap = new Map<string, string[]>(); // electionId → keys

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
		const key = `${indicator.type}-${indicator.detectedAt.getTime()}-${Math.random()}`;
		this.indicators.set(key, indicator);
	}

	seed(electionId: string, indicator: FraudIndicator, key?: string): void {
		const k = key ?? `${indicator.type}-${indicator.detectedAt.getTime()}`;
		this.indicators.set(k, indicator);
		const ids = this.electionMap.get(electionId) ?? [];
		ids.push(k);
		this.electionMap.set(electionId, ids);
	}
}

describe("GetFraudAnalysis", () => {
	let indicatorRepo: InMemoryFraudIndicatorRepository;
	let handler: GetFraudAnalysis;

	beforeEach(() => {
		indicatorRepo = new InMemoryFraudIndicatorRepository();
		handler = new GetFraudAnalysis(indicatorRepo);
	});

	it("should return fraud indicators grouped by type and severity", async () => {
		indicatorRepo.seed(
			"election-1",
			FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.HIGH,
				description: "Unusual vote distribution in station 1",
				evidence: ["tally-report-1"],
				detectedAt: new Date("2026-04-12T10:00:00Z"),
			}),
		);

		indicatorRepo.seed(
			"election-1",
			FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.CRITICAL,
				description: "Turnout spike in station 5",
				evidence: ["turnout-report-5"],
				detectedAt: new Date("2026-04-12T11:00:00Z"),
			}),
		);

		indicatorRepo.seed(
			"election-1",
			FraudIndicator.create({
				type: FraudIndicatorType.DUPLICATE_VOTER,
				severity: FraudSeverity.CRITICAL,
				description: "Duplicate voter detected in station 3",
				evidence: ["voter-log-3"],
				detectedAt: new Date("2026-04-12T12:00:00Z"),
			}),
		);

		indicatorRepo.seed(
			"election-1",
			FraudIndicator.create({
				type: FraudIndicatorType.TIMESTAMP_IRREGULARITY,
				severity: FraudSeverity.LOW,
				description: "Minor timestamp anomaly in station 2",
				evidence: ["timestamp-log-2"],
				detectedAt: new Date("2026-04-12T09:00:00Z"),
			}),
		);

		const result = await handler.execute({ electionId: "election-1" });

		expect(result.electionId).toBe("election-1");
		expect(result.indicators).toHaveLength(4);
		expect(result.summary.totalIndicators).toBe(4);
		expect(result.summary.criticalCount).toBe(2);
		expect(result.summary.highCount).toBe(1);
		expect(result.summary.mediumCount).toBe(0);
		expect(result.summary.lowCount).toBe(1);
	});

	it("should return empty analysis when no indicators exist", async () => {
		const result = await handler.execute({ electionId: "clean-election" });

		expect(result.indicators).toHaveLength(0);
		expect(result.summary.totalIndicators).toBe(0);
	});

	it("should filter by fraud type when specified", async () => {
		indicatorRepo.seed(
			"election-filter",
			FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.HIGH,
				description: "Pattern anomaly",
				evidence: [],
				detectedAt: new Date(),
			}),
		);

		indicatorRepo.seed(
			"election-filter",
			FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.MEDIUM,
				description: "Turnout spike",
				evidence: [],
				detectedAt: new Date(),
			}),
		);

		const result = await handler.execute({
			electionId: "election-filter",
			type: "VOTE_PATTERN_ANOMALY",
		});

		expect(result.indicators).toHaveLength(1);
		expect(result.indicators[0].type).toBe("VOTE_PATTERN_ANOMALY");
	});

	it("should filter by severity when specified", async () => {
		indicatorRepo.seed(
			"election-severity",
			FraudIndicator.create({
				type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
				severity: FraudSeverity.CRITICAL,
				description: "Critical anomaly",
				evidence: [],
				detectedAt: new Date(),
			}),
		);

		indicatorRepo.seed(
			"election-severity",
			FraudIndicator.create({
				type: FraudIndicatorType.DUPLICATE_VOTER,
				severity: FraudSeverity.LOW,
				description: "Minor issue",
				evidence: [],
				detectedAt: new Date(),
			}),
		);

		const result = await handler.execute({
			electionId: "election-severity",
			severity: "CRITICAL",
		});

		expect(result.indicators).toHaveLength(1);
		expect(result.indicators[0].severity).toBe("CRITICAL");
	});
});
