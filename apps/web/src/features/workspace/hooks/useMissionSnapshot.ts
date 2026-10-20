import type { Dispatch } from "react";
import { useCallback } from "react";
import { getMission } from "../services/http-mission-transport";
import { toMissionState } from "./mission-snapshot-state";
import type { MissionAction } from "./missionReducer";

export function useMissionSnapshot(dispatch: Dispatch<MissionAction>) {
	const reconnect = useCallback(
		async (missionId: string) => {
			try {
				const snapshot = await getMission(missionId);
				dispatch({
					type: "RECONNECT_SUCCEEDED",
					snapshot: toMissionState(snapshot),
				});
			} catch {
				dispatch({
					type: "RECONNECT_FAILED",
					error: "No se pudo recuperar el estado de la misión",
				});
			}
		},
		[dispatch],
	);

	return { reconnect };
}
