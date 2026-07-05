import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

export type ArtifactDensity = "compact" | "normal";

interface ArtifactStoreState {
	artifactCollapsed: Record<string, boolean>;
	pinnedArtifacts: HubArtifact[];
	density: ArtifactDensity;
	activeArtifactId: string | null;

	setArtifactCollapsed: (id: string, collapsed: boolean) => void;
	toggleArtifactCollapsed: (id: string) => void;
	pinArtifact: (artifact: HubArtifact) => void;
	unpinArtifact: (id: string) => void;
	setDensity: (density: ArtifactDensity) => void;
	setActiveArtifactId: (id: string | null) => void;
}

export const useArtifactStore = create<ArtifactStoreState>()(
	persist(
		(set) => ({
			artifactCollapsed: {},
			pinnedArtifacts: [],
			density: "normal",
			activeArtifactId: null,

			setArtifactCollapsed: (id, collapsed) =>
				set((state) => ({
					artifactCollapsed: { ...state.artifactCollapsed, [id]: collapsed },
				})),

			toggleArtifactCollapsed: (id) =>
				set((state) => ({
					artifactCollapsed: {
						...state.artifactCollapsed,
						[id]: !state.artifactCollapsed[id],
					},
				})),

			pinArtifact: (artifact) =>
				set((state) => {
					if (state.pinnedArtifacts.some((p) => p.id === artifact.id))
						return state;
					return {
						pinnedArtifacts: [...state.pinnedArtifacts, artifact],
					};
				}),

			unpinArtifact: (id) =>
				set((state) => ({
					pinnedArtifacts: state.pinnedArtifacts.filter((p) => p.id !== id),
				})),

			setDensity: (density) => set({ density }),
			setActiveArtifactId: (id) => set({ activeArtifactId: id }),
		}),
		{
			name: "codex-artifact-state",
			partialize: (state) => ({
				artifactCollapsed: state.artifactCollapsed,
				pinnedArtifacts: state.pinnedArtifacts,
				density: state.density,
				activeArtifactId: state.activeArtifactId,
			}),
		},
	),
);
