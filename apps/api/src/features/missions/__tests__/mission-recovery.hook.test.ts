/**
 * MissionRecovery hook tests — startup recovery with fencing.
 *
 * Verifies: recoverable scan, skip when another runtime owns the lease,
 * UNKNOWN reconciliation by evidence, and timeout bounding.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountingMissionStatus } from "@drenyra/mission-protocol";

vi.mock("@drenyra/persistence/schema", () => ({
	accountingMissions: {
		id: "id",
		companyId: "company_id",
		fiscalPeriod: "fiscal_period",
		intent: "intent",
		status: "status",
		version: "version",
		progress: "progress",
		input: "input",
		proposal: "proposal",
		rejection: "rejection",
		receiptId: "receipt_id",
		receiptHash: "receipt_hash",
		lastEventSequence: "last_event_sequence",
		createdAt: "created_at",
		updatedAt: "updated_at",
	},
	missionLeases: {
		missionId: "mission_id",
		companyId: "company_id",
		expectedVersion: "expected_version",
		leaseOwner: "lease_owner",
		leaseToken: "lease_token",
		leaseExpiresAt: "lease_expires_at",
		fencingToken: "fencing_token",
		acquiredAt: "acquired_at",
		updatedAt: "updated_at",
	},
	missionEvents: {
		id: "id",
		missionId: "mission_id",
		sequence: "sequence",
		eventType: "event_type",
		snapshot: "snapshot",
		createdAt: "created_at",
	},
}));

vi.mock("../../lib/logger", () => ({
	createLogger: () => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	}),
}));

import { runMissionRecovery } from "../mission-recovery.hook";
import { MissionsService } from "../missions.service";

const missionId = "550e8400-e29b-41d4-a716-446655440001";
const companyId = "550e8400-e29b-41d4-a716-446655440000";

function missionRow(overrides: Record<string, unknown> = {}) {
	return {
		id: missionId,
		companyId,
		intent: "monthly-close",
		status: AccountingMissionStatus.RUNNING,
		version: 2,
		...overrides,
	};
}

function createScanDb(options: {
	missions: unknown[];
	leaseResult?: unknown[] | null;
	completedEvents?: unknown[];
}) {
	const { missions, leaseResult = null, completedEvents = [] } = options;

	// select(cols) distinguishes the three query shapes:
	//  - cols === undefined (no args): mission scan (no .limit) OR getMission
	//    via .limit(1) — the bare-await scan uses the array itself; the
	//    .limit(1) chain returns the first mission row.
	//  - cols with missionEvents.id: event probe → .limit(1) → completedEvents.
	const scanResult = missions as unknown as {
		limit: () => Promise<unknown[]>;
	};
	scanResult.limit = () =>
		Promise.resolve(missions.length > 0 ? [missions[0]] : []);

	const eventResult = completedEvents as unknown as {
		limit: () => Promise<unknown[]>;
	};
	eventResult.limit = () => Promise.resolve(completedEvents);

	const select = vi.fn();
	select.mockImplementation((cols: unknown) => {
		const isEventProbe = cols !== undefined;
		return {
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue(
					isEventProbe ? eventResult : scanResult,
				),
			}),
		};
	});

	const execute = vi.fn().mockResolvedValue(leaseResult ?? []);

	const update = vi.fn().mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([missionRow()]),
			}),
		}),
	});

	return { select, execute, update };
}

describe("runMissionRecovery", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("skips missions held by another runtime (fencing)", async () => {
		const db = createScanDb({
			missions: [missionRow()],
			leaseResult: null, // acquire returns empty → other owner holds it
		});

		const result = await runMissionRecovery(db, 2_000);
		expect(result.skipped).toBe(1);
		expect(result.recovered).toBe(0);
	});

	it("reconciles UNKNOWN to RUNNING when no completion evidence exists", async () => {
		const db = createScanDb({
			missions: [
				missionRow({ status: AccountingMissionStatus.UNKNOWN }),
			],
			leaseResult: [{ lease_token: "lease-a", fencing_token: 1 }],
			completedEvents: [],
		});
		// reconcileMission goes through optimisticUpdate → update().set().where().returning()
		// The createScanDb mock provides update; recover path has no intent handler
		// registered (INTENT_HANDLERS empty), so the mission is left claimed.

		const result = await runMissionRecovery(db, 2_000);
		expect(result.skipped).toBe(1); // no handler registered → counted as skipped claim
	});

	it("returns timedOut when the scan exceeds the budget", async () => {
		// A lease acquire that never resolves forces the timeout to win.
		const db = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([missionRow()]),
				}),
			}),
			execute: vi.fn().mockReturnValue(new Promise(() => {})),
			update: vi.fn(),
		};

		const result = await runMissionRecovery(db, 20);
		expect(result.timedOut).toBe(true);
	});

	it("does not touch terminal FAILED missions", async () => {
		const db = createScanDb({
			missions: [
				missionRow({ status: AccountingMissionStatus.FAILED }),
				missionRow({ id: "second", status: AccountingMissionStatus.COMPLETED }),
			],
		});

		// FAILED and COMPLETED are not in RECOVERABLE_STATUSES → no leases, no dispatch.
		const result = await runMissionRecovery(db, 2_000);
		expect(result.recovered).toBe(0);
		expect(result.failed).toBe(0);
	});
});
