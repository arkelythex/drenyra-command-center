import type {
	ArtifactFieldPatch,
	ArtifactRiskLevel,
	SireDiffRow,
} from "../types/artifact.types";

export function buildSireInlinePatches(
	previous: SireDiffRow,
	next: SireDiffRow,
	rationale: string,
): ArtifactFieldPatch[] {
	const patches: ArtifactFieldPatch[] = [];

	pushPatch(
		patches,
		"localRecord.total",
		previous.localRecord?.total ?? null,
		next.localRecord?.total ?? null,
		rationale,
	);
	pushPatch(
		patches,
		"sunatRecord.total",
		previous.sunatRecord?.total ?? null,
		next.sunatRecord?.total ?? null,
		rationale,
	);
	pushPatch(
		patches,
		"difference",
		previous.difference,
		next.difference,
		rationale,
	);
	pushPatch(patches, "status", previous.status, next.status, rationale);
	pushPatch(patches, "reason", previous.reason, next.reason, rationale);

	return patches;
}

function pushPatch(
	patches: ArtifactFieldPatch[],
	path: string,
	before: string | number | null,
	after: string | number | null,
	rationale: string,
): void {
	if (before === after) {
		return;
	}

	patches.push({
		op: "replace",
		path,
		before,
		after,
		rationale,
		confidence: 0.82,
		riskLevel: inferRiskLevel(path),
	});
}

function inferRiskLevel(path: string): ArtifactRiskLevel {
	if (path === "status") {
		return "HIGH";
	}
	if (path.endsWith(".total") || path === "difference") {
		return "MEDIUM";
	}
	return "LOW";
}
