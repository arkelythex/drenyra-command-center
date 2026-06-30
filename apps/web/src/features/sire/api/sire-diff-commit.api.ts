import type { RowDecision } from "@/features/artifacts/components/sire-diff-card/types";
import type { SireDiffRow } from "@/features/artifacts/types/artifact.types";
import { extractOkData } from "@/lib/api-helpers";
import type { SireDiffApiPayload } from "../mapSireDiffResponseToArtifact";

export interface CommitSireDiffInput {
	companyId: string;
	period: string;
	artifactId: string;
	traceId: string;
	sunatSource: NonNullable<SireDiffApiPayload["sunatSource"]>;
	summary: SireDiffApiPayload["summary"];
	rows: SireDiffRow[];
	decisions: Record<string, RowDecision>;
}

export interface CommitSireDiffResult {
	committed: true;
	eventId: string;
	storedAt: string;
	submitBlocked: boolean;
	submitBlockReason?: string;
	ledgerMutation?: {
		updatedInvoices: number;
		updatedBills: number;
		createdInvoices: number;
		createdBills: number;
	};
}

/**
 * Persists accountant row decisions via POST /api/sire/diff/commit.
 */
export async function commitSireDiffResolutions(
	input: CommitSireDiffInput,
): Promise<CommitSireDiffResult> {
	const params = new URLSearchParams({ companyId: input.companyId });
	const response = await fetch(`/api/sire/diff/commit?${params.toString()}`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			"X-Company-Id": input.companyId,
		},
		body: JSON.stringify({
			period: input.period,
			artifactId: input.artifactId,
			traceId: input.traceId,
			sunatSource: input.sunatSource,
			summary: input.summary,
			rows: input.rows.map((row) => ({
				rowId: row.id,
				status: row.status,
				decision: input.decisions[row.id] ?? "PENDING",
				localRecord: row.localRecord,
				sunatRecord: row.sunatRecord,
			})),
		}),
	});

	return extractOkData(
		await response.json(),
		"Failed to commit SIRE diff resolutions",
	) as CommitSireDiffResult;
}
