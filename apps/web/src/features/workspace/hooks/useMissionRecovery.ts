import type { Dispatch, MutableRefObject } from "react";
import { useCallback } from "react";
import { reconcileMission } from "../services/http-mission-transport";
import { toMissionState } from "./mission-snapshot-state";
import type { MissionAction } from "./missionReducer";

const RESOLUTIONS = ["RUNNING", "FAILED", "COMPLETED"] as const;
type Resolution = (typeof RESOLUTIONS)[number];

export function useMissionRecovery(
	dispatch: Dispatch<MissionAction>,
	missionIdRef: MutableRefObject<string | null>,
	version: number,
) {
	const reconcile = useCallback(
		async (resolution: string, reason: string) => {
			if (!missionIdRef.current) return;
			if (!RESOLUTIONS.includes(resolution as Resolution)) return;

			try {
				const snapshot = await reconcileMission(missionIdRef.current, {
					resolution: resolution as Resolution,
					reason,
					expectedMissionVersion: version,
				});
				dispatch({
					type: "MISSION_EVENT_RECEIVED",
					event: toMissionState(snapshot),
				});
			} catch (error: unknown) {
				dispatch({
					type: "ERROR_OCCURRED",
					error: (error as Error).message ?? "Error al reconciliar",
					isTimeout: false,
				});
			}
		},
		[dispatch, missionIdRef, version],
	);

	return { reconcile };
}
