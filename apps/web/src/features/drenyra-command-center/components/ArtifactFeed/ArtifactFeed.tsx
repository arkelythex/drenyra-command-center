import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";
import { type ArtifactFeedEntry, collectArtifacts } from "./ArtifactFeed.data";
import { ArtifactFeedCard } from "./ArtifactFeedCard";

interface ArtifactFeedProps {
	messages: CognitiveMessage[];
}

export function ArtifactFeed({ messages }: ArtifactFeedProps) {
	const entries: ArtifactFeedEntry[] = collectArtifacts(messages);

	if (entries.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<div className="max-w-64 space-y-2 text-center">
					<p className="text-xs font-semibold text-[var(--text-secondary)]">
						No fiscal artifacts yet
					</p>
					<p className="text-2xs leading-relaxed text-[var(--text-tertiary)]">
						Run an agent or attach evidence. Reconciliations, SIRE reviews,
						audit notes, and approval-ready outputs will appear here with RUC,
						period, source, and review state.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="mb-4 flex items-center gap-2">
				<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					Fiscal artifacts ({entries.length})
				</p>
			</div>

			<div className="space-y-2">
				{entries.map((entry) => (
					<ArtifactFeedCard key={entry.artifact.id} artifact={entry.artifact} />
				))}
			</div>
		</div>
	);
}
