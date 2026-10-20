/**
 * Approve and reject leave an append-only row in mission_receipts, written in
 * the same transaction as the mission's state change.
 *
 * Opt-in (RUN_DB_TESTS=1) because it needs PostgreSQL. It applies
 * 0034_mission_receipts_append_only.sql itself (idempotent). Rows written here
 * stay: the table refuses DELETE by design.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeEvidenceBundleHash } from "@drenyra/domain";
import { MissionErrorCode } from "@drenyra/mission-domain";
import {
	accountingMissions,
	companies,
	missionReceipts,
} from "@drenyra/persistence/schema";
import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../../lib/db";
import { MissionsService } from "../../missions.service";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

const MIGRATION = resolve(
	__dirname,
	"../../../../../../../packages/infrastructure/drizzle/0034_mission_receipts_append_only.sql",
);

const ACTOR = "user-accountant-1";
// Deliberately not in jsonb's key order: the canonical hash must survive it.
const evidence = [
	{ type: "BANK_STATEMENT", label: "Extracto BCP", id: "ev-1" },
];
let evidenceHash: string;

let companyId: string;
let service: MissionsService;

async function missionAwaitingApproval() {
	const created = await service.createMission(companyId, {
		companyId,
		fiscalPeriod: "2026-09",
		intent: "monthly-close",
		input: { instruction: "Cierre septiembre" },
	});
	const proposalId = randomUUID();
	await db
		.update(accountingMissions)
		.set({
			status: "AWAITING_APPROVAL",
			version: 2,
			proposal: {
				id: proposalId,
				missionId: created.id,
				version: 1,
				evidence,
				evidenceHash,
				summary: "Asientos de cierre",
				riskLevel: "LOW",
				generatedAt: "2026-10-01T00:00:00.000Z",
			},
		})
		.where(eq(accountingMissions.id, created.id));
	return { missionId: created.id, proposalId };
}

/** Drizzle wraps the PostgreSQL error; the trigger's message is in `cause`. */
async function expectAppendOnly(query: PromiseLike<unknown>) {
	const error = await Promise.resolve(query).then(
		() => null,
		(err: unknown) => err as { message?: string; cause?: { message?: string } },
	);
	expect(error?.cause?.message ?? error?.message).toMatch(
		/mission_receipts is append-only/,
	);
}

function receiptsOf(missionId: string) {
	return db
		.select()
		.from(missionReceipts)
		.where(eq(missionReceipts.missionId, missionId));
}

describeDb("mission decision log (PostgreSQL)", () => {
	beforeAll(async () => {
		evidenceHash = await computeEvidenceBundleHash(evidence);
		await db.execute(sql.raw(readFileSync(MIGRATION, "utf8")));
		// Applying it twice must be harmless.
		await db.execute(sql.raw(readFileSync(MIGRATION, "utf8")));
	});

	beforeEach(async () => {
		companyId = randomUUID();
		await db.insert(companies).values({
			id: companyId,
			ownerId: randomUUID(),
			ruc: `20${String(Date.now()).slice(-9)}`,
			businessName: "Decision Log Fixture",
		});
		service = new MissionsService(db);
	});

	it("records an approval with the session actor and the mission's receipt hash", async () => {
		const { missionId, proposalId } = await missionAwaitingApproval();

		const approved = await service.approveMission(missionId, companyId, ACTOR, {
			proposalId,
			proposalVersion: 1,
			evidenceHash,
			expectedMissionVersion: 2,
		});

		const rows = await receiptsOf(missionId);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			companyId,
			actorId: ACTOR,
			decision: "APPROVE",
			proposalVersion: 1,
			evidenceHash,
			previousStatus: "AWAITING_APPROVAL",
			newStatus: "APPROVED",
			receiptHash: approved.receiptHash,
			receiptType: "DECISION",
		});
	});

	it("records a rejection with the session actor", async () => {
		const { missionId, proposalId } = await missionAwaitingApproval();

		await service.rejectMission(missionId, companyId, ACTOR, {
			proposalId,
			proposalVersion: 1,
			reason: "Faltan sustentos bancarios",
			expectedMissionVersion: 2,
		});

		const rows = await receiptsOf(missionId);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			actorId: ACTOR,
			decision: "REJECT",
			evidenceHash,
			previousStatus: "AWAITING_APPROVAL",
			newStatus: "REJECTED",
		});
		expect(rows[0]?.receiptHash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("writes no decision when the mission version is stale", async () => {
		const { missionId, proposalId } = await missionAwaitingApproval();

		await expect(
			service.approveMission(missionId, companyId, ACTOR, {
				proposalId,
				proposalVersion: 1,
				evidenceHash,
				expectedMissionVersion: 1,
			}),
		).rejects.toMatchObject({ code: MissionErrorCode.VERSION_CONFLICT });

		expect(await receiptsOf(missionId)).toHaveLength(0);
	});

	it("refuses to change or delete a recorded decision", async () => {
		const { missionId, proposalId } = await missionAwaitingApproval();
		await service.rejectMission(missionId, companyId, ACTOR, {
			proposalId,
			proposalVersion: 1,
			reason: "Faltan sustentos",
			expectedMissionVersion: 2,
		});

		await expectAppendOnly(
			db
				.update(missionReceipts)
				.set({ actorId: "someone-else" })
				.where(eq(missionReceipts.missionId, missionId)),
		);
		await expectAppendOnly(
			db
				.delete(missionReceipts)
				.where(eq(missionReceipts.missionId, missionId)),
		);
		await expectAppendOnly(db.execute(sql`TRUNCATE mission_receipts`));

		const rows = await receiptsOf(missionId);
		expect(rows[0]?.actorId).toBe(ACTOR);
	});
});
