import { useCallback, useRef, useState } from "react";
import {
	executeRunIntent,
	getMissionSnapshot,
	approveMission,
	rejectMission,
	type MissionSnapshot,
	type RunIntentCommand,
	type ApproveCommand,
	type HarnessError,
} from "../services/accounting-mission.service";
import {
	type AccountingMissionStatus,
	isRunnable,
	isAwaitingApproval,
	isTerminal,
	transition,
} from "../model/mission-status";

interface AccountingMissionState {
	status: AccountingMissionStatus;
	progress: number;
	steps: MissionSnapshot["steps"];
	currentStep: string;
	blockers: MissionSnapshot["blockers"];
	proposal: MissionProposal | null;
	version: number;
	rejection: MissionSnapshot["rejection"];
	error: string | null;
	receiptId: string | null;
	isMockMode: boolean;
}

import type { MissionProposal } from "../services/accounting-mission.service";

const INITIAL_STATE: AccountingMissionState = {
	status: "DRAFT",
	progress: 0,
	steps: [],
	currentStep: "",
	blockers: [],
	proposal: null,
	version: 0,
	rejection: null,
	error: null,
	receiptId: null,
	isMockMode: false,
};

export function useAccountingMission() {
	const [state, setState] = useState<AccountingMissionState>(INITIAL_STATE);
	const abortRef = useRef<AbortController | null>(null);
	const missionIdRef = useRef<string | null>(null);

	const isReady = isRunnable(state.status);
	const isAwaiting = isAwaitingApproval(state.status);
	const isFinished = isTerminal(state.status);

	// ─── Reconnect: try to fetch snapshot if we had a running mission ─────

	const reconnect = useCallback(async (missionId: string) => {
		try {
			const snapshot = await getMissionSnapshot(missionId);
			setState((prev) => ({
				...prev,
				status: snapshot.status as AccountingMissionStatus,
				progress: snapshot.progress,
				steps: snapshot.steps,
				currentStep: snapshot.currentStep,
				blockers: snapshot.blockers,
				proposal: snapshot.proposal,
				version: snapshot.version,
				rejection: snapshot.rejection ?? null,
				receiptId: snapshot.receiptId ?? null,
				error: null,
				isMockMode: false,
			}));
		} catch {
			setState((prev) => ({
				...prev,
				status: "UNKNOWN",
				error: "No se pudo recuperar el estado de la misión",
			}));
		}
	}, []);

	// ─── Run mission ──────────────────────────────────────────────────────

	const run = useCallback(
		async (command: RunIntentCommand) => {
			abortRef.current?.abort();
			abortRef.current = new AbortController();
			missionIdRef.current = command.missionId;

			try {
				transition(state.status, "QUEUED");
				setState((prev) => ({ ...prev, status: "QUEUED", error: null }));

				const generator = executeRunIntent(command);

				for await (const snapshot of generator) {
					if (abortRef.current?.signal.aborted) break;

					setState({
						status: snapshot.status as AccountingMissionStatus,
						progress: snapshot.progress,
						steps: snapshot.steps,
						currentStep: snapshot.currentStep,
						blockers: snapshot.blockers,
						proposal: snapshot.proposal,
						version: snapshot.version,
						rejection: snapshot.rejection ?? null,
						receiptId: snapshot.receiptId ?? null,
						error: null,
						isMockMode:
							import.meta.env.VITE_DRENYRA_MISSION_TRANSPORT === "mock",
					});
				}
			} catch (error: unknown) {
				if ((error as Error).name === "AbortError") return;
				const he = error as HarnessError & Error;
				const isTimeout = he.type === "TIMEOUT";
				setState((prev) => ({
					...prev,
					status: isTimeout ? "UNKNOWN" : "FAILED",
					error: he.message ?? "Error desconocido en el harness",
					isMockMode: false,
				}));
			}
		},
		[state.status],
	);

	// ─── Approve ──────────────────────────────────────────────────────────

	const approve = useCallback(async () => {
		const currentProposal = state.proposal;
		if (!currentProposal || !missionIdRef.current) return;

		try {
			const result = await approveMission({
				missionId: missionIdRef.current,
				proposalId: currentProposal.id,
				proposalVersion: currentProposal.version,
				decision: "APPROVE",
				idempotencyKey: `approve-${missionIdRef.current}-${Date.now()}`,
			});

			transition(state.status, "APPROVED");
			setState((prev) => ({
				...prev,
				status: "APPROVED",
				receiptId: result.receiptId,
			}));

			// After receipt, transition to completed
			setTimeout(() => {
				transition("APPROVED", "COMPLETED");
				setState((prev) => ({ ...prev, status: "COMPLETED", progress: 1 }));
			}, 500);
		} catch (error: unknown) {
			setState((prev) => ({
				...prev,
				error: (error as Error).message ?? "Error al aprobar",
			}));
		}
	}, [state.status, state.proposal]);

	// ─── Reject ───────────────────────────────────────────────────────────

	const reject = useCallback(
		async (reason: string) => {
			const currentProposal = state.proposal;
			if (!currentProposal || !missionIdRef.current) return;

			try {
				await rejectMission({
					missionId: missionIdRef.current,
					proposalId: currentProposal.id,
					proposalVersion: currentProposal.version,
					decision: "REJECT",
					reason,
					idempotencyKey: `reject-${missionIdRef.current}-${Date.now()}`,
				});

				transition(state.status, "REJECTED");
				setState((prev) => ({
					...prev,
					status: "REJECTED",
					rejection: {
						reason,
						rejectedBy: "current-user",
						rejectedAt: new Date().toISOString(),
						proposalVersion: currentProposal.version,
					},
				}));
			} catch (error: unknown) {
				setState((prev) => ({
					...prev,
					error: (error as Error).message ?? "Error al rechazar",
				}));
			}
		},
		[state.status, state.proposal],
	);

	// ─── Request revision ─────────────────────────────────────────────────

	const requestRevision = useCallback(async () => {
		transition(state.status, "REVISION_REQUESTED");
		setState((prev) => ({
			...prev,
			status: "REVISION_REQUESTED",
			proposal: null,
			rejection: null,
		}));
	}, [state.status]);

	// ─── Reset ────────────────────────────────────────────────────────────

	const reset = useCallback(() => {
		abortRef.current?.abort();
		missionIdRef.current = null;
		setState(INITIAL_STATE);
	}, []);

	return {
		...state,
		isReady,
		isAwaiting,
		isFinished,
		run,
		approve,
		reject,
		requestRevision,
		reconnect,
		reset,
	};
}
