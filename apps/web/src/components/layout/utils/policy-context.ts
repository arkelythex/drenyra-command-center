import type { ArtifactInteractionEvent } from "@/features/artifacts/types/artifact.types";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function extractPolicyContext(
	payload: ArtifactInteractionEvent["payload"],
): { key: string; riskLevel: string } | null {
	if (!isRecord(payload)) {
		return null;
	}

	const candidate = payload.policy;
	if (!isRecord(candidate)) {
		return null;
	}

	const key = typeof candidate.key === "string" ? candidate.key : null;
	const riskLevel =
		typeof candidate.riskLevel === "string" ? candidate.riskLevel : null;
	if (!key || !riskLevel) {
		return null;
	}

	return { key, riskLevel };
}
