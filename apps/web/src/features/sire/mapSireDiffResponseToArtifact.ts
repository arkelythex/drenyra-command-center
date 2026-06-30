import {
	ARTIFACT_TYPES,
	type ArtifactAction,
	type SireDiffArtifact,
	type SireDiffRow,
} from "@/features/artifacts/types/artifact.types";

export interface SireDiffApiPayload {
	period: string;
	currency: "PEN" | "USD";
	summary: SireDiffArtifact["data"]["summary"];
	rows: SireDiffRow[];
	sunatSource?: "upload" | "persisted" | "unavailable";
	sunatMessage?: string;
	approvable?: boolean;
	submitBlocked?: boolean;
	submitBlockReason?: string;
}

const SIRE_DIFF_ACTIONS: ArtifactAction[] = [
	{
		id: "accept-sunat-batch",
		label: "Accept SUNAT (batch)",
		type: "PRIMARY",
		requiresConfirmation: true,
		riskLevel: "HIGH",
		policyGate: {
			policyKey: "SIRE_BATCH_COMMIT",
			requiresReason: true,
			requiresDualApproval: true,
		},
	},
	{ id: "keep-local-batch", label: "Keep Local (batch)", type: "SECONDARY" },
];

/**
 * Maps POST /api/sire/diff payload into a workspace SIRE diff artifact.
 */
export function mapSireDiffResponseToArtifact(
	payload: SireDiffApiPayload,
): SireDiffArtifact {
	const traceId = `tr_${crypto.randomUUID().slice(0, 8)}`;

	return {
		id: `art_sire_${payload.period.replace("-", "")}_${Date.now().toString(36)}`,
		type: ARTIFACT_TYPES.SIRE_DIFF,
		version: "1.2.0",
		status: "PREVIEW",
		title: `SIRE reconciliation ${payload.period}`,
		description:
			payload.sunatMessage ??
			"Three-way diff between local ledger, SUNAT proposal, and optional CPE.",
		metadata: {
			traceId,
			correlationId: `corr_${traceId}`,
			source: "SUNAT",
			createdAt: new Date().toISOString(),
			actor: "SireDiffPage",
		},
		data: {
			period: payload.period,
			currency: payload.currency,
			summary: payload.summary,
			rows: payload.rows,
			sunatSource: payload.sunatSource,
			sunatMessage: payload.sunatMessage,
			submitBlocked: payload.submitBlocked,
			submitBlockReason: payload.submitBlockReason,
		},
		actions: SIRE_DIFF_ACTIONS,
	};
}
