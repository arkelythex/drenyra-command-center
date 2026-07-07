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
			<div className="flex items-center justify-center h-full">
				<p className="text-2xs text-[var(--text-tertiary)]">
					Sin artifacts en esta sesión
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="mb-4 flex items-center gap-2">
				<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					Artefactos ({entries.length})
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
