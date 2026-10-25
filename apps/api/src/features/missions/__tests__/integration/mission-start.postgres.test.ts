/**
 * Starting a monthly close twice for the same period points at the mission
 * that already exists instead of failing with a 500, and a mission whose
 * pipeline is not enabled is refused instead of being left RUNNING forever.
 *
 * Opt-in (RUN_DB_TESTS=1) because it needs PostgreSQL.
 */
import { randomUUID } from "node:crypto";
import { MissionErrorCode } from "@drenyra/mission-domain";
import { accountingMissions, companies } from "@drenyra/persistence/schema";
import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../../../lib/db";
import { INTENT_HANDLERS } from "../../intent-handlers/intent-handlers.registry";
import { MissionsService } from "../../missions.service";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

const COMMAND = {
	fiscalPeriod: "2026-08",
	intent: "monthly-close" as const,
	input: { instruction: "Cerrar agosto" },
};

describeDb("starting a mission (postgres)", () => {
	const service = new MissionsService(db);
	const companyIds: string[] = [];

	async function company(): Promise<string> {
		const id = randomUUID();
		await db.insert(companies).values({
			id,
			ownerId: randomUUID(),
			ruc: `20${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`,
			businessName: "Mission Start Fixture",
		});
		companyIds.push(id);
		return id;
	}

	beforeEach(() => {
		INTENT_HANDLERS.delete("monthly-close");
	});

	afterEach(async () => {
		INTENT_HANDLERS.delete("monthly-close");
		if (companyIds.length === 0) return;
		await db
			.delete(accountingMissions)
			.where(inArray(accountingMissions.companyId, companyIds));
		await db.delete(companies).where(inArray(companies.id, companyIds));
		companyIds.length = 0;
	});

	it("answers 409 with the existing mission for the same period", async () => {
		const companyId = await company();
		const first = await service.createMission(companyId, {
			companyId,
			...COMMAND,
		});

		const second = service.createMission(companyId, { companyId, ...COMMAND });

		await expect(second).rejects.toMatchObject({
			code: MissionErrorCode.MISSION_STATE_CONFLICT,
			statusCode: 409,
			details: { missionId: first.id, status: "DRAFT" },
		});
	});

	it("lets another company close the same period", async () => {
		const a = await company();
		const b = await company();
		await service.createMission(a, { companyId: a, ...COMMAND });

		const other = await service.createMission(b, { companyId: b, ...COMMAND });

		expect(other.companyId).toBe(b);
	});

	it("refuses to run a mission whose pipeline is off and leaves it as it was", async () => {
		const companyId = await company();
		const created = await service.createMission(companyId, {
			companyId,
			...COMMAND,
		});

		const run = service.executeMission(created.id, companyId, {
			expectedMissionVersion: created.version,
		});

		await expect(run).rejects.toMatchObject({
			code: MissionErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
			statusCode: 503,
		});
		const [row] = await db
			.select({
				status: accountingMissions.status,
				version: accountingMissions.version,
			})
			.from(accountingMissions)
			.where(eq(accountingMissions.id, created.id));
		expect(row).toEqual({ status: "DRAFT", version: created.version });
	});
});
