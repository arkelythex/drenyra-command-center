import { createContext, useCallback, useContext, useState } from "react";
import type {
	ArtifactInteractionEvent,
	WorkspaceArtifact,
} from "@/features/artifacts/types/artifact.types";

interface ArtifactEventContextType {
	activeTraceId: string | null;
	setActiveTraceId: (v: string | null) => void;
	activeArtifact: WorkspaceArtifact | null;
	setActiveArtifact: (v: WorkspaceArtifact | null) => void;
	lastArtifactEvent: ArtifactInteractionEvent | null;
	setLastArtifactEvent: (v: ArtifactInteractionEvent | null) => void;
	artifactEvents: ArtifactInteractionEvent[];
	pushArtifactEvent: (event: ArtifactInteractionEvent) => void;
	syncArtifactEvents: (events: ArtifactInteractionEvent[]) => void;
	clearArtifactEvents: () => void;
}

const ArtifactEventContext = createContext<
	ArtifactEventContextType | undefined
>(undefined);

export const ArtifactEventProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
	const [activeArtifact, setActiveArtifact] =
		useState<WorkspaceArtifact | null>(null);
	const [lastArtifactEvent, setLastArtifactEvent] =
		useState<ArtifactInteractionEvent | null>(null);
	const [artifactEvents, setArtifactEvents] = useState<
		ArtifactInteractionEvent[]
	>([]);

	const syncArtifactEvents = useCallback(
		(events: ArtifactInteractionEvent[]) => {
			setArtifactEvents((previous) => {
				const map = new Map<string, ArtifactInteractionEvent>();
				for (const event of [...events, ...previous]) {
					map.set(event.id, event);
				}
				return [...map.values()]
					.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
					.slice(0, 50);
			});
		},
		[],
	);

	const pushArtifactEvent = useCallback(
		(event: ArtifactInteractionEvent) => {
			syncArtifactEvents([event]);
		},
		[syncArtifactEvents],
	);

	const clearArtifactEvents = useCallback(() => setArtifactEvents([]), []);

	return (
		<ArtifactEventContext.Provider
			value={{
				activeTraceId,
				setActiveTraceId,
				activeArtifact,
				setActiveArtifact,
				lastArtifactEvent,
				setLastArtifactEvent,
				artifactEvents,
				pushArtifactEvent,
				syncArtifactEvents,
				clearArtifactEvents,
			}}
		>
			{children}
		</ArtifactEventContext.Provider>
	);
};

export const useArtifactEvents = (): ArtifactEventContextType => {
	const context = useContext(ArtifactEventContext);
	if (!context) {
		throw new Error(
			"useArtifactEvents must be used within ArtifactEventProvider",
		);
	}
	return context;
};
