import { persistArtifactGovernanceEvent } from "@/features/artifacts/api/artifact-governance-audit.api";
import type { DiscrepancyScenario } from "../components/anomaly/discrepancy-scenario";

interface CommitDiscrepancyResolutionInput {
	commitId: string;
	runId: string;
	scenario: DiscrepancyScenario;
}

export async function commitDiscrepancyResolution({
	commitId,
	runId,
	scenario,
}: CommitDiscrepancyResolutionInput): Promise<void> {
	await persistArtifactGovernanceEvent({
		id: crypto.randomUUID(),
		artifactId: scenario.id,
		artifactType: "sire.diff.v1",
		traceId: runId,
		actionId: "discrepancy-commit",
		message: `Corrección confirmada para ${scenario.title}`,
		nextStatus: "COMMITTED",
		createdAt: new Date().toISOString(),
		payload: {
			commitId,
			command: scenario.command,
			sourceName: scenario.sourceName,
			legalReferences: scenario.legalReferences.map(
				(reference) => reference.id,
			),
			rows: scenario.rows.map((row) => ({
				id: row.id,
				status: row.status,
				record: row.record,
			})),
		},
	});
}
