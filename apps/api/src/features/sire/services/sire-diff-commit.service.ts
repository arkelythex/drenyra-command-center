import { ArtifactEventAuditService } from "../../governance-audit/artifact-event-audit.service";
import {
	computeSubmitBlockedAfterCommit,
	type SireDiffCommitInput,
	type SireDiffCommitResult,
	validateDiffCommit,
} from "./sire-diff.service";
import { SireDiffLedgerService } from "./sire-diff-ledger.service";

/**
 * Persists accountant SIRE diff resolutions and applies ledger mutations.
 */
export class SireDiffCommitService {
	static async commitResolutions(
		input: SireDiffCommitInput,
	): Promise<SireDiffCommitResult> {
		const validation = validateDiffCommit({
			sunatSource: input.sunatSource,
			rows: input.rows,
		});
		if (!validation.ok) {
			throw new Error(validation.reason);
		}

		const ledgerMutation = await SireDiffLedgerService.applyResolutions({
			companyId: input.companyId,
			period: input.period,
			rows: input.rows,
		});

		const createdAt = new Date().toISOString();
		const audit = await ArtifactEventAuditService.record({
			companyId: input.companyId,
			actorUserId: input.actorUserId,
			actionId: "sire-diff-commit",
			createdAt,
			artifactId: input.artifactId,
			artifactType: "sire.diff.v1",
			traceId: input.traceId,
			message: `SIRE diff resolutions committed for period ${input.period}.`,
			nextStatus: "COMMITTED",
			payload: {
				period: input.period,
				summary: input.summary,
				rows: input.rows,
				ledgerMutation,
			},
			source: "workspace-artifact",
		});

		const gate = computeSubmitBlockedAfterCommit({
			sunatSource: input.sunatSource,
			rows: input.rows,
		});

		return {
			committed: true,
			eventId: audit.eventId,
			storedAt: audit.storedAt,
			submitBlocked: gate.submitBlocked,
			...(gate.submitBlockReason !== undefined
				? { submitBlockReason: gate.submitBlockReason }
				: {}),
			ledgerMutation,
		};
	}
}
