/**
 * MissionLeaseService — multi-instance fencing for mission recovery.
 *
 * Each mission can be owned by exactly one runtime instance at a time.
 * A lease records the owner, an opaque token, an expiry, and a monotonic
 * fencing token. When a lease expires and another runtime acquires it,
 * the fencing token increments; the previous owner's writes are rejected
 * as stale (fencing violation) instead of racing the new owner.
 *
 * Fencing flow:
 *   Runtime A acquires lease (fencing 41)
 *   Runtime B acquires lease after expiry (fencing 42)
 *   Runtime A tries to write with 41 → rejected (stale fencing)
 */

import { and, eq, sql } from "drizzle-orm";
import { missionLeases } from "@drenyra/persistence/schema";
import { MissionError, MissionErrorCode } from "@drenyra/mission-domain";
import { randomBytes } from "node:crypto";

/** A successfully acquired lease. */
export interface AcquiredLease {
	leaseToken: string;
	fencingToken: number;
}

/** Current lease state read back for fencing assertions. */
export interface LeaseState {
	leaseOwner: string;
	leaseToken: string;
	leaseExpiresAt: Date;
	fencingToken: number;
}

export class MissionLeaseService {
	constructor(private readonly db: any) {}

	/**
	 * Atomically acquire (or renew) the lease for a mission.
	 *
	 * First acquisition: fencing token 1.
	 * Same owner renews: fencing token unchanged.
	 * Another owner after expiry: fencing token = previous + 1.
	 *
	 * Returns null when the lease is held by another owner and not expired
	 * (the caller must skip, never fail).
	 */
	async acquire(
		missionId: string,
		companyId: string,
		expectedVersion: number,
		leaseOwner: string,
		ttlMs: number,
	): Promise<AcquiredLease | null> {
		const leaseToken = randomBytes(16).toString("hex");
		// ISO string (not Date): postgres-js in this stack fails to serialize
		// Date objects as timestamptz parameters.
		const expiresAt = new Date(Date.now() + ttlMs).toISOString();

		const rows = await this.db.execute(sql`
			INSERT INTO mission_leases (
				mission_id, company_id, expected_version, lease_owner,
				lease_token, lease_expires_at, fencing_token
			)
			VALUES (
				${missionId}, ${companyId}, ${expectedVersion}, ${leaseOwner},
				${leaseToken}, ${expiresAt}, 1
			)
			ON CONFLICT (mission_id) DO UPDATE SET
				lease_owner = EXCLUDED.lease_owner,
				lease_token = EXCLUDED.lease_token,
				lease_expires_at = EXCLUDED.lease_expires_at,
				fencing_token = mission_leases.fencing_token + 1,
				updated_at = now()
			WHERE
				mission_leases.lease_expires_at < now()
				OR mission_leases.lease_owner = EXCLUDED.lease_owner
			RETURNING lease_token, fencing_token
		`);

		const row = rows[0] as { lease_token: string; fencing_token: number } | undefined;
		if (!row) return null;
		return { leaseToken: row.lease_token, fencingToken: row.fencing_token };
	}

	/**
	 * Extend an existing lease, only for the current owner+token.
	 * Returns false when the lease changed hands (caller must stop work).
	 */
	async renew(
		missionId: string,
		companyId: string,
		leaseOwner: string,
		leaseToken: string,
		ttlMs: number,
	): Promise<boolean> {
		const expiresAt = new Date(Date.now() + ttlMs);
		const rows = await this.db.execute(sql`
			UPDATE mission_leases SET
				lease_expires_at = ${expiresAt},
				updated_at = now()
			WHERE
				mission_id = ${missionId}
				AND company_id = ${companyId}
				AND lease_owner = ${leaseOwner}
				AND lease_token = ${leaseToken}
			RETURNING mission_id
		`);
		return rows.length > 0;
	}

	/**
	 * Release a lease, only for the current owner+token.
	 * Returns false when the lease changed hands (caller must stop work).
	 */
	async release(
		missionId: string,
		companyId: string,
		leaseOwner: string,
		leaseToken: string,
	): Promise<boolean> {
		const rows = await this.db.execute(sql`
			DELETE FROM mission_leases
			WHERE
				mission_id = ${missionId}
				AND company_id = ${companyId}
				AND lease_owner = ${leaseOwner}
				AND lease_token = ${leaseToken}
			RETURNING mission_id
		`);
		return rows.length > 0;
	}

	/**
	 * Assert that the caller still holds a valid, current lease.
	 *
	 * Throws when:
	 *   - another owner holds the lease (ALREADY_EXECUTING)
	 *   - the lease is expired (VERSION_CONFLICT — fence moved on)
	 *   - the caller's fencing token is stale (VERSION_CONFLICT)
	 */
	async assertFencing(
		missionId: string,
		companyId: string,
		leaseOwner: string,
		leaseToken: string,
		fencingToken: number,
	): Promise<void> {
		const rows = await this.db
			.select({
				leaseOwner: missionLeases.leaseOwner,
				leaseToken: missionLeases.leaseToken,
				leaseExpiresAt: missionLeases.leaseExpiresAt,
				fencingToken: missionLeases.fencingToken,
			})
			.from(missionLeases)
			.where(
				and(
					eq(missionLeases.missionId, missionId),
					eq(missionLeases.companyId, companyId),
				),
			)
			.limit(1);

		const lease = rows[0] as LeaseState | undefined;
		if (!lease) {
			throw new MissionError(
				MissionErrorCode.ALREADY_EXECUTING,
				409,
				"Lease is held by another owner",
				{ missionId },
			);
		}
		if (lease.fencingToken !== fencingToken) {
			throw new MissionError(
				MissionErrorCode.VERSION_CONFLICT,
				409,
				"Stale fencing token; another runtime owns this mission",
				{ missionId, expectedFencing: fencingToken, currentFencing: lease.fencingToken },
			);
		}
		if (lease.leaseOwner !== leaseOwner || lease.leaseToken !== leaseToken) {
			throw new MissionError(
				MissionErrorCode.ALREADY_EXECUTING,
				409,
				"Lease is held by another owner",
				{ missionId },
			);
		}
		if (new Date(lease.leaseExpiresAt).getTime() < Date.now()) {
			throw new MissionError(
				MissionErrorCode.VERSION_CONFLICT,
				409,
				"Lease expired; fencing has moved on",
				{ missionId },
			);
		}
	}
}
