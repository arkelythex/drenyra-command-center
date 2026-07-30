import { useCallback } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { MissionAction } from "./missionReducer";
import { reconcileMission } from "../services/http-mission-transport";
import { AccountingMissionStatus } from "@drenyra/mission-domain";

export function useMissionRecovery(
  dispatch: Dispatch<MissionAction>,
  missionIdRef: MutableRefObject<string | null>,
) {
  const reconcile = useCallback(
    async (resolution: string, reason: string) => {
      if (!missionIdRef.current) return;

      const validResolutions = ["RUNNING", "FAILED", "COMPLETED"];
      if (!validResolutions.includes(resolution)) return;

      try {
        const result = await reconcileMission(missionIdRef.current, {
          resolution: resolution as "RUNNING" | "FAILED" | "COMPLETED",
          reason,
          expectedMissionVersion: 0,
        });
        dispatch({
          type: "RECONCILE_RESOLVED",
          status: result.status as AccountingMissionStatus,
        });
      } catch (error: unknown) {
        dispatch({
          type: "ERROR_OCCURRED",
          error: (error as Error).message ?? "Error al reconciliar",
          isTimeout: false,
        });
      }
    },
    [dispatch, missionIdRef],
  );

  return { reconcile };
}
