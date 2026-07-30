import { useCallback } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { MissionAction } from "./missionReducer";
import { executeSSEStream, streamSSEEvents } from "../services/sse-mission-stream";

const IS_MOCK = import.meta.env.VITE_DRENYRA_MISSION_TRANSPORT === "mock";

export function useMissionExecution(
  dispatch: Dispatch<MissionAction>,
  abortRef: MutableRefObject<AbortController | null>,
  missionIdRef: MutableRefObject<string | null>,
) {
  const run = useCallback(
    async (command: {
      missionId: string;
      companyId: string;
      fiscalPeriod: string;
      intent: string;
      input: { instruction: string };
      idempotencyKey: string;
      expectedMissionVersion: number;
    }) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      missionIdRef.current = command.missionId;

      try {
        if (IS_MOCK) {
          const { mockExecuteRunIntent } = await import(
            "../services/mock-mission-transport"
          );
          for await (const snapshot of mockExecuteRunIntent(
            command.missionId,
            command.input.instruction,
          )) {
            if (abortRef.current?.signal.aborted) break;
            dispatch({
              type: "MISSION_EVENT_RECEIVED",
              event: {
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
                isMockMode: true,
                lastEventSequence: snapshot.lastEventSequence,
              },
            });
          }
        } else {
          const response = await executeSSEStream(
            command.missionId,
            {
              expectedMissionVersion: command.expectedMissionVersion,
            },
          );

          for await (const event of streamSSEEvents(response)) {
            if (abortRef.current?.signal.aborted) break;
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
        }
      } catch (error: unknown) {
        if ((error as Error).name === "AbortError") return;
        const isTimeout =
          typeof error === "object" &&
          error !== null &&
          "isTimeout" in error &&
          (error as Record<string, unknown>).isTimeout === true;

        dispatch({
          type: "ERROR_OCCURRED",
          error: (error as Error).message ?? "Error desconocido",
          isTimeout,
        });
      }
    },
    [dispatch, abortRef, missionIdRef],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, [abortRef]);

  return { run, abort };
}
