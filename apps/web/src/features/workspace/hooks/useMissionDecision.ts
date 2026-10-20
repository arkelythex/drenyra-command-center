import type { Dispatch, MutableRefObject } from "react";
import { useCallback } from "react";
import {
	approveMission,
	rejectMission,
} from "../services/http-mission-transport";
import { toMissionState } from "./mission-snapshot-state";
import type { MissionAction, MissionState } from "./missionReducer";

/**
 * Approve or reject the agent's proposal. Both send the server's mission
 * version and show the snapshot the server returns: the receipt, who rejected
 * and when come from the API, not from the browser.
 */
export function useMissionDecision(
	dispatch: Dispatch<MissionAction>,
	missionIdRef: MutableRefObject<string | null>,
	state: MissionState,
) {
	const approve = useCallback(async () => {
		const proposal = state.proposal;
		if (!proposal || !missionIdRef.current) return;

		try {
			const snapshot = await approveMission(missionIdRef.current, {
				proposalId: proposal.id,
				proposalVersion: proposal.version,
				evidenceHash: proposal.evidenceHash,
				expectedMissionVersion: state.version,
			});
			dispatch({
				type: "MISSION_EVENT_RECEIVED",
				event: toMissionState(snapshot),
			});
		} catch (error: unknown) {
			dispatch({
				type: "ERROR_OCCURRED",
				error: (error as Error).message ?? "Error al aprobar",
				isTimeout: false,
			});
		}
	}, [dispatch, missionIdRef, state.proposal, state.version]);

	const reject = useCallback(
		async (reason: string) => {
			const proposal = state.proposal;
			if (!proposal || !missionIdRef.current) return;

			try {
				const snapshot = await rejectMission(missionIdRef.current, {
					proposalId: proposal.id,
					proposalVersion: proposal.version,
					reason,
					expectedMissionVersion: state.version,
				});
				dispatch({
					type: "MISSION_EVENT_RECEIVED",
					event: toMissionState(snapshot),
				});
			} catch (error: unknown) {
				dispatch({
					type: "ERROR_OCCURRED",
					error: (error as Error).message ?? "Error al rechazar",
					isTimeout: false,
				});
			}
		},
		[dispatch, missionIdRef, state.proposal, state.version],
	);

	return { approve, reject };
}
