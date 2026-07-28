import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SireDiffArtifact } from "@/features/artifacts/types/artifact.types";

export type WorkspaceStep =
	| "context"
	| "sync"
	| "match"
	| "classify"
	| "resolve"
	| "diff"
	| "review"
	| "submit"
	| "reconcile";

const VALID_STEPS: ReadonlySet<string> = new Set<WorkspaceStep>([
	"context",
	"sync",
	"match",
	"classify",
	"resolve",
	"diff",
	"review",
	"submit",
	"reconcile",
]);

export type RowDecision = "ACCEPTED_SUNAT" | "KEPT_LOCAL" | "PENDING";

export interface SireDiffWorkspaceState {
	period: string;
	artifactId: string | null;
	artifact: SireDiffArtifact | null;
	workspaceStep: WorkspaceStep;
	decisions: Record<string, RowDecision>;
	draftsByRow: Record<string, unknown>;
	isLoading: boolean;
	error: string | null;

	// Actions
	setPeriod: (period: string) => void;
	setArtifact: (artifact: SireDiffArtifact) => void;
	setWorkspaceStep: (step: string) => void;
	setDecision: (rowId: string, decision: RowDecision) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string) => void;
	clearError: () => void;
	reset: () => void;
}

export const useSireDiffWorkspaceStore = create<SireDiffWorkspaceState>()(
	persist(
		(set) => ({
			period: "2026-03",
			artifactId: null,
			artifact: null,
			workspaceStep: "context",
			decisions: {},
			draftsByRow: {},
			isLoading: false,
			error: null,

			setPeriod: (period) => set({ period }),

			setArtifact: (artifact) =>
				set({
					artifact,
					artifactId: artifact.id,
					workspaceStep: "diff",
					error: null,
				}),

			setWorkspaceStep: (step) => {
				if (VALID_STEPS.has(step)) {
					set({ workspaceStep: step as WorkspaceStep });
				}
			},

			setDecision: (rowId, decision) =>
				set((state) => ({
					decisions: { ...state.decisions, [rowId]: decision },
				})),

			setLoading: (isLoading) => set({ isLoading }),

			setError: (error) => set({ error, isLoading: false }),

			clearError: () => set({ error: null }),

			reset: () =>
				set({
					artifactId: null,
					artifact: null,
					workspaceStep: "context",
					decisions: {},
					draftsByRow: {},
					isLoading: false,
					error: null,
				}),
		}),
		{
			name: "sire-diff-workspace",
			partialize: (state) => ({
				period: state.period,
				artifactId: state.artifactId,
				artifact: state.artifact,
				workspaceStep: state.workspaceStep,
				decisions: state.decisions,
				draftsByRow: state.draftsByRow,
			}),
		},
	),
);
