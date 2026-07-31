/**
 * MissionLeaseService tests — fencing semantics.
 *
 * Covers the multi-instance recovery guarantee:
 *   Runtime A acquires lease (fencing 1) → renews without increment
 *   Lease expires → Runtime B acquires (fencing 2)
 *   Runtime A writes with stale fencing → rejected
 */
import { describe, expect, it, vi } from "vitest";
import { MissionErrorCode } from "@drenyra/mission-domain";

vi.mock("@drenyra/persistence/schema", () => ({
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
}));

import { MissionLeaseService } from "../mission-lease.service";

const missionId = "550e8400-e29b-41d4-a716-446655440001";
const companyId = "550e8400-e29b-41d4-a716-446655440000";

/** Mock db where execute returns queued rows (postgres-js style). */
function createExecuteDb(...responses: unknown[][]) {
	const execute = vi.fn();
	for (const response of responses) {
		execute.mockResolvedValueOnce(response as never);
	}
	return { execute };
}

/** Mock db where select().from().where().limit() returns rows. */
function createSelectDb(row: unknown | null) {
	const limit = vi.fn().mockResolvedValue(row ? [row] : []);
	const where = vi.fn().mockReturnValue({ limit });
	const from = vi.fn().mockReturnValue({ where });
	const select = vi.fn().mockReturnValue({ from });
	return { select };
}

describe("MissionLeaseService", () => {
	it("acquires a first lease with fencing token one", async () => {
		const db = createExecuteDb([{ lease_token: "lease-a", fencing_token: 1 }]);
		const service = new MissionLeaseService(db);

		await expect(
			service.acquire(missionId, companyId, 3, "runtime-a", 30_000),
		).resolves.toEqual({ leaseToken: "lease-a", fencingToken: 1 });
	});

	it("returns null when another owner holds an unexpired lease", async () => {
		// ON CONFLICT DO UPDATE ... WHERE excludes the row → empty result.
		const db = createExecuteDb([]);
		const service = new MissionLeaseService(db);

		await expect(
			service.acquire(missionId, companyId, 3, "runtime-b", 30_000),
		).resolves.toBeNull();
	});

	it("returns a higher fencing token when another owner takes an expired lease", async () => {
		const db = createExecuteDb([{ lease_token: "lease-b", fencing_token: 2 }]);
		const service = new MissionLeaseService(db);

		const lease = await service.acquire(missionId, companyId, 3, "runtime-b", 30_000);

		expect(lease).toMatchObject({ fencingToken: 2 });
	});

	it("renews only for the current owner+token", async () => {
		const db = createExecuteDb([{ mission_id: missionId }], []);
		const service = new MissionLeaseService(db);

		await expect(
			service.renew(missionId, companyId, "runtime-a", "lease-a", 30_000),
		).resolves.toBe(true);
		await expect(
			service.renew(missionId, companyId, "runtime-b", "lease-b", 30_000),
		).resolves.toBe(false);
	});

	it("releases only for the current owner+token", async () => {
		const db = createExecuteDb([{ mission_id: missionId }], []);
		const service = new MissionLeaseService(db);

		await expect(
			service.release(missionId, companyId, "runtime-a", "lease-a"),
		).resolves.toBe(true);
		await expect(
			service.release(missionId, companyId, "runtime-b", "lease-b"),
		).resolves.toBe(false);
	});

	it("rejects a stale fencing token after another runtime acquired the lease", async () => {
		const future = new Date(Date.now() + 60_000);
		const db = createSelectDb({
			leaseOwner: "runtime-a",
			leaseToken: "lease-a",
			leaseExpiresAt: future,
			fencingToken: 2,
		});
		const service = new MissionLeaseService(db);

		await expect(
			service.assertFencing(missionId, companyId, "runtime-a", "lease-a", 1),
		).rejects.toMatchObject({ code: MissionErrorCode.VERSION_CONFLICT });
	});

	it("rejects when the lease belongs to another owner", async () => {
		const future = new Date(Date.now() + 60_000);
		const db = createSelectDb({
			leaseOwner: "runtime-b",
			leaseToken: "lease-b",
			leaseExpiresAt: future,
			fencingToken: 2,
		});
		const service = new MissionLeaseService(db);

		await expect(
			service.assertFencing(missionId, companyId, "runtime-a", "lease-a", 2),
		).rejects.toMatchObject({ code: MissionErrorCode.ALREADY_EXECUTING });
	});

	it("passes when the caller holds the current fencing token", async () => {
		const future = new Date(Date.now() + 60_000);
		const db = createSelectDb({
			leaseOwner: "runtime-a",
			leaseToken: "lease-a",
			leaseExpiresAt: future,
			fencingToken: 2,
		});
		const service = new MissionLeaseService(db);

		await expect(
			service.assertFencing(missionId, companyId, "runtime-a", "lease-a", 2),
		).resolves.toBeUndefined();
	});
});
