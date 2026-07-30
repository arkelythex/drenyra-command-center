import { useCallback } from "react";
import type { Dispatch } from "react";
import type { MissionAction } from "./missionReducer";
import { executeSSEStream, streamSSEEvents } from "../services/sse-mission-stream";

export function useMissionEventStream(dispatch: Dispatch<MissionAction>) {
  const resume = useCallback(
    async (missionId: string, fromSequence: number) => {
      try {
        const response = await executeSSEStream(
          missionId,
          { expectedMissionVersion: 0 },
          fromSequence,
        );

        for await (const event of streamSSEEvents(response, fromSequence)) {
          dispatch({
            type: "MISSION_EVENT_RECEIVED",
            event: {
              status: event.snapshot.status,
              progress: event.snapshot.progress,
              steps: event.snapshot.steps,
              currentStep: event.snapshot.currentStep,
              blockers: event.snapshot.blockers,
              proposal: event.snapshot.proposal,
              version: event.snapshot.version,
              rejection: event.snapshot.rejection,
              receiptId: event.snapshot.receiptId,
              receiptHash: event.snapshot.receiptHash,
              error: null,
              isMockMode: false,
              lastEventSequence: event.sequence,
            },
          });
        }
      } catch (error: unknown) {
        dispatch({
          type: "ERROR_OCCURRED",
          error: (error as Error).message ?? "Error en stream de eventos",
          isTimeout: false,
        });
      }
    },
    [dispatch],
  );

  return { resume };
}
