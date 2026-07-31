/**
 * Durable missions against a real PostgreSQL database.
 *
 * These tests are opt-in because they require the local PostgreSQL compose service.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../../lib/db";
import {
	accountingMissions,
	companies,
	missionEvents,
	missionLeases,
	missionReceipts,
} from "@drenyra/persistence/schema";
import {
	MissionErrorCode,
	verifySignedReceipt,
	type ReceiptContent,
} from "@drenyra/mission-domain";
import { MissionLeaseService } from "../../mission-lease.service";
import { runMissionRecovery } from "../../mission-recovery.hook";
import { MissionsService } from "../../missions.service";
import { ReceiptSigningService } from "../../receipt-signing.service";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

interface Fixture {
	companyId: string;
	ownerId: string;
}

let fixture: Fixture;

function fixtureRuc(): string {
	return `20${String(Date.now()).slice(-9)}`;
}

async function createFixture(): Promise<Fixture> {
	const ownerId = randomUUID();
	const companyId = randomUUID();

	// companies.owner_id is NOT NULL but has no FK in the current schema;
	// auth_users MFA columns are not migrated in the local compose DB, so we
	// skip the owner row and use an arbitrary UUID.
	await db.insert(companies).values({
		id: companyId,
		ownerId,
		ruc: fixtureRuc(),
		businessName: "Missions E2E Fixture",
	});

	return { companyId, ownerId };
}

async function createMission() {
	const service = new MissionsService(db);
	return service.createMission(fixture.companyId, {
		fiscalPeriod: "2026-07",
		intent: "monthly-close",
		input: { instruction: "Exercise durable mission recovery" },
	});
}

async function cleanupFixture(): Promise<void> {
	if (!fixture) return;

	await db.delete(missionLeases).where(eq(missionLeases.companyId, fixture.companyId));
	await db.delete(missionReceipts).where(eq(missionReceipts.companyId, fixture.companyId));
	await db.delete(accountingMissions).where(
		eq(accountingMissions.companyId, fixture.companyId),
	);
	await db.delete(companies).where(eq(companies.id, fixture.companyId));
}

describeDb("durable mission recovery (PostgreSQL)", () => {
	beforeEach(async () => {
		fixture = await createFixture();
	});

	afterEach(async () => {
		await cleanupFixture();
	});

	it("recovers an abruptly stopped RUNNING mission without duplicate events and persists a verifiable receipt", async () => {
		const service = new MissionsService(db);
		const created = await createMission();
		const running = await service.executeMission(created.id, fixture.companyId, {
			expectedMissionVersion: created.version,
		});
		expect(running.status).toBe("RUNNING");

		await db.insert(missionEvents).values({
			missionId: created.id,
			sequence: 1,
			eventType: "RUNNING",
			snapshot: { status: "RUNNING" },
		});

		await runMissionRecovery(db);

		const eventsAfterRecovery = await db
			.select({ sequence: missionEvents.sequence, eventType: missionEvents.eventType })
			.from(missionEvents)
			.where(eq(missionEvents.missionId, created.id));
		const eventKeys = eventsAfterRecovery.map((event) =>
			`${event.sequence}:${event.eventType}`,
		);
		expect(new Set(eventKeys).size).toBe(eventKeys.length);
		expect(eventKeys).toEqual(["1:RUNNING"]);

		await db
			.update(accountingMissions)
			.set({ status: "COMPLETED", version: running.version + 1 })
			.where(
				and(
					eq(accountingMissions.id, created.id),
					eq(accountingMissions.companyId, fixture.companyId),
				),
			);
		await db.insert(missionEvents).values({
			missionId: created.id,
			sequence: 2,
			eventType: "COMPLETED",
			snapshot: { status: "COMPLETED" },
		});

		const signer = new ReceiptSigningService();
		const content: ReceiptContent = {
			missionId: created.id,
			companyId: fixture.companyId,
			actorId: fixture.ownerId,
			decision: "APPROVE",
			proposalVersion: 1,
			evidenceHash: "e2e-evidence-hash",
			previousStatus: "RUNNING",
			newStatus: "COMPLETED",
			payloadHash: "e2e-payload-hash",
			timestamp: new Date().toISOString(),
		};
		const signed = signer.sign(content);
		expect(verifySignedReceipt(signed)).toMatchObject({
			valid: true,
			hashValid: true,
			signatureValid: true,
		});

		await db.insert(missionReceipts).values({
			missionId: created.id,
			companyId: fixture.companyId,
			actorId: fixture.ownerId,
			decision: content.decision,
			proposalVersion: content.proposalVersion,
			evidenceHash: content.evidenceHash,
			previousStatus: content.previousStatus,
			newStatus: content.newStatus,
			payloadHash: content.payloadHash,
			receiptHash: signed.receiptHash,
			receiptType: signed.receiptType,
			signature: signed.signature,
			signatureAlgorithm: signed.algorithm,
			signingKeyId: signed.signerKeyId,
			issuedAt: new Date(signed.issuedAt),
			protocolVersion: signed.protocolVersion,
		});

		const [receipt] = await db
			.select()
			.from(missionReceipts)
			.where(eq(missionReceipts.receiptHash, signed.receiptHash));
		expect(receipt).toMatchObject({
			receiptHash: signed.receiptHash,
			signature: signed.signature,
			signingKeyId: signer.keyId,
			protocolVersion: signed.protocolVersion,
		});
	});

	it("rejects a stale runtime after lease expiry advances the PostgreSQL fencing token", async () => {
		const mission = await createMission();
		const leases = new MissionLeaseService(db);
		const runtimeA = await leases.acquire(
			mission.id,
			fixture.companyId,
			mission.version,
			"runtime-a",
			-10_000,
		);
		expect(runtimeA).not.toBeNull();

		const runtimeB = await leases.acquire(
			mission.id,
			fixture.companyId,
			mission.version,
			"runtime-b",
			60_000,
		);
		expect(runtimeB).not.toBeNull();
		expect(runtimeB!.fencingToken).toBe(runtimeA!.fencingToken + 1);

		await expect(
			leases.assertFencing(
				mission.id,
				fixture.companyId,
				"runtime-a",
				runtimeA!.leaseToken,
				runtimeA!.fencingToken,
			),
		).rejects.toMatchObject({ code: MissionErrorCode.VERSION_CONFLICT });
	});

	it("reconciles UNKNOWN to COMPLETED from persisted completion evidence", async () => {
		const mission = await createMission();
		await db
			.update(accountingMissions)
			.set({ status: "UNKNOWN", version: mission.version + 1 })
			.where(
				and(
					eq(accountingMissions.id, mission.id),
					eq(accountingMissions.companyId, fixture.companyId),
				),
			);
		await db.insert(missionEvents).values({
			missionId: mission.id,
			sequence: 1,
			eventType: "COMPLETED",
			snapshot: { status: "COMPLETED" },
		});

		await runMissionRecovery(db);

		const [reconciled] = await db
			.select({ status: accountingMissions.status })
			.from(accountingMissions)
			.where(
				and(
					eq(accountingMissions.id, mission.id),
					eq(accountingMissions.companyId, fixture.companyId),
				),
			);
		expect(reconciled?.status).toBe("COMPLETED");
	});
});
