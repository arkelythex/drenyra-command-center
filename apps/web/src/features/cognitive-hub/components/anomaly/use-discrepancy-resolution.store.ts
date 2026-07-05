import { create } from "zustand";
import type { DiscrepancyScenario } from "./discrepancy-scenario";

export type DiscrepancyCommitStatus =
	| "idle"
	| "pending_undo"
	| "committed"
	| "rolled_back"
	| "error";

interface DiscrepancyResolutionState {
	scenario: DiscrepancyScenario | null;
	isApplied: boolean;
	status: DiscrepancyCommitStatus;
	pendingCommitId: string | null;
	undoExpiresAt: number | null;
	errorMessage: string | null;
	initializeScenario: (scenario: DiscrepancyScenario) => void;
	startOptimisticApply: (commitId: string, undoExpiresAt: number) => void;
	markCommitted: (commitId: string) => void;
	rollback: (commitId: string) => void;
	markError: (commitId: string, message: string) => void;
	clearError: () => void;
}

export const useDiscrepancyResolutionStore = create<DiscrepancyResolutionState>(
	(set) => ({
		scenario: null,
		isApplied: false,
		status: "idle",
		pendingCommitId: null,
		undoExpiresAt: null,
		errorMessage: null,
		initializeScenario: (scenario) =>
			set((state) => (state.scenario ? state : { scenario })),
		startOptimisticApply: (commitId, undoExpiresAt) =>
			set({
				isApplied: true,
				status: "pending_undo",
				pendingCommitId: commitId,
				undoExpiresAt,
				errorMessage: null,
			}),
		markCommitted: (commitId) =>
			set((state) => {
				if (state.pendingCommitId !== commitId) return state;
				return {
					status: "committed",
					pendingCommitId: null,
					undoExpiresAt: null,
					errorMessage: null,
				};
			}),
		rollback: (commitId) =>
			set((state) => {
				if (state.pendingCommitId !== commitId) return state;
				return {
					isApplied: false,
					status: "rolled_back",
					pendingCommitId: null,
					undoExpiresAt: null,
					errorMessage: null,
				};
			}),
		markError: (commitId, message) =>
			set((state) => {
				if (state.pendingCommitId !== commitId) return state;
				return {
					isApplied: false,
					status: "error",
					pendingCommitId: null,
					undoExpiresAt: null,
					errorMessage: message,
				};
			}),
		clearError: () =>
			set((state) => ({
				errorMessage: null,
				status: state.status === "error" ? "idle" : state.status,
			})),
	}),
);
