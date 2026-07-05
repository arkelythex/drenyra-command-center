import { useCallback, useState } from "react";
import type {
	CognitiveMessage,
	HubArtifact,
} from "@/features/cognitive-hub/types/hub.types";

const STORAGE_PREFIX = "drenyra:chat:";

export function useDrenyraChatState(companyId: string) {
	const [chatStreaming, setChatStreaming] = useState(false);
	const [chatLastArtifact, setChatLastArtifact] = useState<HubArtifact | null>(
		null,
	);
	const [pinnedArtifacts, setPinnedArtifacts] = useState<HubArtifact[]>([]);

	const loadChatMessages = useCallback((): CognitiveMessage[] => {
		try {
			const raw = localStorage.getItem(`${STORAGE_PREFIX}${companyId}`);
			if (!raw) return [];
			return (JSON.parse(raw) as CognitiveMessage[]).map((msg) => ({
				...msg,
				timestamp: new Date(msg.timestamp),
			}));
		} catch {
			return [];
		}
	}, [companyId]);

	const handleChatContextChange = useCallback(
		(ctx: {
			isStreaming: boolean;
			lastArtifact?: HubArtifact | null;
			pinnedArtifacts?: HubArtifact[];
		}) => {
			setChatStreaming(ctx.isStreaming);
			setChatLastArtifact(ctx.lastArtifact ?? null);
			if (ctx.pinnedArtifacts) setPinnedArtifacts(ctx.pinnedArtifacts);
		},
		[],
	);

	return {
		chatStreaming,
		chatLastArtifact,
		pinnedArtifacts,
		handleChatContextChange,
		loadChatMessages,
	};
}
