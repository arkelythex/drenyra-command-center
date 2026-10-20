/**
 * The real monthly-close pipeline, end to end against PostgreSQL:
 * create → execute → the pipeline runs in the background → the mission
 * persists AWAITING_APPROVAL with a sealed proposal → approval verifies the
 * evidence hash read back from jsonb and records the decision.
 *
 * Opt-in (RUN_DB_TESTS=1). Posting entries stays off: approval only records
 * the decision (applyEntries is not wired in the MVP).
 */
import { randomUUID } from "node:crypto";
import { computeEvidenceBundleHash } from "@drenyra/domain";
import {
	accountingMissions,
	companies,
	missionEvents,
} from "@drenyra/persistence/schema";
import { and, asc, eq } from "drizzle-orm";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { db } from "../../../../lib/db";
import { INTENT_HANDLERS } from "../../intent-handlers/intent-handlers.registry";
import { DrizzleMonthlyCloseMissionStore } from "../../intent-handlers/monthly-close-mission.store";
import {
	MONTHLY_CLOSE_PIPELINE_FLAG,
	wireMonthlyCloseHandler,
} from "../../intent-handlers/wire-monthly-close";
import { MissionsService } from "../../missions.service";
import { MissionEventStore } from "../../sse/mission-event-store";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

let companyId: string;
let service: MissionsService;

async function createCompany(): Promise<string> {
	const id = randomUUID();
	await db.insert(companies).values({
		id,
		ownerId: randomUUID(),
		ruc: `20${String(Date.now()).slice(-9)}`,
		businessName: "Monthly Close Pipeline Fixture",
	});
	return id;
}

async function readMission(missionId: string) {
	const [row] = await db
		.select()
		.from(accountingMissions)
		.where(
			and(
				eq(accountingMissions.id, missionId),
				eq(accountingMissions.companyId, companyId),
			),
		);
	return row;
}

async function runToApproval() {
	const created = await service.createMission(companyId, {
		fiscalPeriod: "2026-09",
		intent: "monthly-close",
		input: { instruction: "Cierre septiembre" },
	});
	await service.executeMission(created.id, companyId, {
		expectedMissionVersion: created.version,
	});
	await vi.waitFor(
		async () => {
			expect((await readMission(created.id))?.status).toBe("AWAITING_APPROVAL");
		},
		{ timeout: 15_000, interval: 100 },
	);
	return created.id;
}

describeDb("monthly-close pipeline (PostgreSQL)", () => {
	const previousFlag = process.env[MONTHLY_CLOSE_PIPELINE_FLAG];

	beforeAll(() => {
		process.env[MONTHLY_CLOSE_PIPELINE_FLAG] = "true";
		expect(wireMonthlyCloseHandler(db, new MissionEventStore(db))).toBe(true);
		service = new MissionsService(db);
	});

	afterAll(() => {
		INTENT_HANDLERS.delete("monthly-close");
		if (previousFlag === undefined)
			delete process.env[MONTHLY_CLOSE_PIPELINE_FLAG];
		else process.env[MONTHLY_CLOSE_PIPELINE_FLAG] = previousFlag;
	});

	beforeEach(async () => {
		companyId = await createCompany();
	});

	it("persists AWAITING_APPROVAL with a proposal sealed over its evidence", async () => {
		const missionId = await runToApproval();
		const mission = await readMission(missionId);
		const proposal = mission?.proposal as {
			version: number;
			sourceEvidence: unknown[];
			evidence: Array<{ id: string; label: string }>;
			evidenceHash: string;
		};

		expect(proposal.version).toBe(1);
		expect(proposal.sourceEvidence.length).toBeGreaterThan(0);
		expect(proposal.evidence).toHaveLength(proposal.sourceEvidence.length);
		// Read back from jsonb, keys reordered: the canonical hash still matches.
		expect(await computeEvidenceBundleHash(proposal.sourceEvidence)).toBe(
			proposal.evidenceHash,
		);
		expect(mission?.version).toBeGreaterThan(2);
	});

	it("logs the run's events with gap-free sequences", async () => {
		const missionId = await runToApproval();
		const events = await db
			.select({
				sequence: missionEvents.sequence,
				type: missionEvents.eventType,
			})
			.from(missionEvents)
			.where(eq(missionEvents.missionId, missionId))
			.orderBy(asc(missionEvents.sequence));

		expect(events.length).toBeGreaterThan(10);
		expect(events.map((e) => e.sequence)).toEqual(events.map((_, i) => i + 1));
		expect(events.map((e) => e.type)).toContain("PROPOSAL_CREATED");
	});

	it("approves with the hash the API served and records the decision", async () => {
		const missionId = await runToApproval();
		const served = await service.getMission(missionId, companyId);
		const proposal = served.proposal as unknown as {
			id: string;
			version: number;
			evidenceHash: string;
		};

		const approved = await service.approveMission(
			missionId,
			companyId,
			"user-accountant-1",
			{
				proposalId: proposal.id,
				proposalVersion: proposal.version,
				evidenceHash: proposal.evidenceHash,
				expectedMissionVersion: served.version,
			},
		);

		expect(approved.status).toBe("APPROVED");
		expect(approved.receiptHash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("never moves another company's mission", async () => {
		const missionId = await runToApproval();
		const store = new DrizzleMonthlyCloseMissionStore(db);
		const otherCompany = randomUUID();

		expect(await store.load(missionId, otherCompany)).toBeNull();
		await store.markFailed(missionId, otherCompany, "cross-tenant attempt");
		expect((await readMission(missionId))?.status).toBe("AWAITING_APPROVAL");
	});

	it("does not overwrite a mission that already left RUNNING", async () => {
		const missionId = await runToApproval();
		const store = new DrizzleMonthlyCloseMissionStore(db);

		await store.markFailed(missionId, companyId, "late crash report");
		expect((await readMission(missionId))?.status).toBe("AWAITING_APPROVAL");
	});
});
