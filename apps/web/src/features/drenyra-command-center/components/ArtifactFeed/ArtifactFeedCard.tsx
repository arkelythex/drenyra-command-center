import type { HubArtifact } from "@drenyra/shared/artifacts";
import { ARTIFACT_TYPE_COLORS, artifactSummary } from "./ArtifactFeed.data";

interface ArtifactFeedCardProps {
	artifact: HubArtifact;
}

export function ArtifactFeedCard({ artifact }: ArtifactFeedCardProps) {
	const isEmpty =
		!artifact.title &&
		(artifact.type === "explanation" ? !artifact.content : true);
	if (isEmpty) return null;

	const badgeColor =
		ARTIFACT_TYPE_COLORS[artifact.type] ?? "bg-gray-500/10 text-gray-500";
	const summary = artifactSummary(artifact);

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<span
					className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${badgeColor}`}
				>
					{artifact.type}
				</span>
			</div>

			{artifact.title && (
				<p className="text-xs font-bold text-[var(--text-primary)] truncate">
					{artifact.title}
				</p>
			)}

			{summary && (
				<p className="text-2xs text-[var(--text-tertiary)] line-clamp-2">
					{summary}
				</p>
			)}
		</div>
	);
}
