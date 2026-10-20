/**
 * DrizzleMonthlyCloseMissionStore — PostgreSQL adapter for the monthly-close
 * pipeline's MonthlyCloseMissionStore port.
 *
 * Every read and write is scoped by company, and every transition only
 * applies to a mission that is still RUNNING: a mission cancelled or decided
 * meanwhile is never overwritten by a late pipeline result. Each transition
 * bumps the mission version so optimistic-concurrency clients see the change.
 */

import type {
	ClosingProposal,
	EvidenceRef,
	MissionBlocker,
	MonthlyCloseMissionRecord,
	MonthlyCloseMissionStore,
} from "@drenyra/application/use-cases/monthly-close";
import { and, eq, sql } from "@drenyra/persistence/query";
import { accountingMissions } from "@drenyra/persistence/schema";
import { SecureLogger } from "@drenyra/shared/secure-logger";

const logger = SecureLogger.namespace("MonthlyCloseMissionStore");

const EVIDENCE_LABELS: Record<string, string> = {
	"input-snapshot": "Datos congelados del período",
	"gate-results": "Resultado de los controles previos",
	"closing-proposal": "Propuesta de cierre",
};

/**
 * The proposal as the mission API serves it: the pipeline's ClosingProposal
 * plus the `evidence` list and `summary` the approval screen shows. The
 * evidence hash stays computed over `sourceEvidence`.
 */
export function toPersistedProposal(
	proposal: ClosingProposal,
): Record<string, unknown> {
	return {
		...proposal,
		evidence: proposal.sourceEvidence.map((item: EvidenceRef) => ({
			id: item.id,
			type: item.type,
			label: EVIDENCE_LABELS[item.type] ?? item.type,
		})),
		summary: `Cierre ${proposal.fiscalPeriod}: ${proposal.entryCount} asientos propuestos`,
	};
}

export class DrizzleMonthlyCloseMissionStore
	implements MonthlyCloseMissionStore
{
	// biome-ignore lint/suspicious/noExplicitAny: drizzle client type varies by driver
	constructor(private readonly db: any) {}

	async load(
		missionId: string,
		companyId: string,
	): Promise<MonthlyCloseMissionRecord | null> {
		const rows = await this.db
			.select({
				id: accountingMissions.id,
				companyId: accountingMissions.companyId,
				fiscalPeriod: accountingMissions.fiscalPeriod,
			})
			.from(accountingMissions)
			.where(
				and(
					eq(accountingMissions.id, missionId),
					eq(accountingMissions.companyId, companyId),
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async markBlocked(
		missionId: string,
		companyId: string,
		blockers: MissionBlocker[],
	): Promise<void> {
		// No blockers column yet: the blockers live in the BLOCKER_ADDED event.
		await this.transitionFromRunning(
			missionId,
			companyId,
			"BLOCKED",
			{},
			{
				blockers: blockers.length,
			},
		);
	}

	async markFailed(
		missionId: string,
		companyId: string,
		reason: string,
	): Promise<void> {
		await this.transitionFromRunning(
			missionId,
			companyId,
			"FAILED",
			{},
			{
				reason,
			},
		);
	}

	async markAwaitingApproval(
		missionId: string,
		companyId: string,
		proposal: ClosingProposal,
	): Promise<void> {
		await this.transitionFromRunning(
			missionId,
			companyId,
			"AWAITING_APPROVAL",
			{ proposal: toPersistedProposal(proposal) },
			{ evidenceHash: proposal.evidenceHash },
		);
	}

	private async transitionFromRunning(
		missionId: string,
		companyId: string,
		status: string,
		fields: Record<string, unknown>,
		logContext: Record<string, unknown>,
	): Promise<void> {
		const updated = await this.db
			.update(accountingMissions)
			.set({
				...fields,
				status,
				version: sql`${accountingMissions.version} + 1`,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(accountingMissions.id, missionId),
					eq(accountingMissions.companyId, companyId),
					eq(accountingMissions.status, "RUNNING"),
				),
			)
			.returning({ id: accountingMissions.id });

		if (updated.length === 0) {
			logger.warn(
				"Monthly close result not applied: mission is no longer RUNNING",
				{
					missionId,
					status,
					...logContext,
				},
			);
		}
	}
}
