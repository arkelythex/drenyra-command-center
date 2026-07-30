import { useCallback } from "react";
import type { Dispatch } from "react";
import type { MissionAction } from "./missionReducer";
import { getMission } from "../services/http-mission-transport";
import type { MissionSnapshot as DomainSnapshot } from "@drenyra/mission-domain";

export function useMissionSnapshot(dispatch: Dispatch<MissionAction>) {
  const reconnect = useCallback(
    async (missionId: string) => {
      try {
        const snapshot: DomainSnapshot = await getMission(missionId);
        dispatch({
          type: "RECONNECT_SUCCEEDED",
          snapshot: {
            status: snapshot.status,
            progress: snapshot.progress,
            steps: snapshot.steps,
            currentStep: snapshot.currentStep,
            blockers: snapshot.blockers,
            proposal: snapshot.proposal,
            version: snapshot.version,
            rejection: snapshot.rejection,
            receiptId: snapshot.receiptId,
            receiptHash: snapshot.receiptHash,
            error: null,
            isMockMode: false,
            lastEventSequence: snapshot.lastEventSequence,
          },
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
