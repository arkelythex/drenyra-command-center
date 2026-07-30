import { useCallback } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { MissionAction, MissionState } from "./missionReducer";
import { approveMission, rejectMission } from "../services/http-mission-transport";
import type { MissionProposal } from "@drenyra/mission-domain";

export function useMissionDecision(
  dispatch: Dispatch<MissionAction>,
  missionIdRef: MutableRefObject<string | null>,
  state: MissionState,
) {
  const approve = useCallback(async () => {
    const proposal: MissionProposal | null = state.proposal;
    if (!proposal || !missionIdRef.current) return;

    try {
      const result = await approveMission(missionIdRef.current, {
        proposalId: proposal.id,
        proposalVersion: proposal.version,
        evidenceHash: proposal.evidenceHash,
        expectedMissionVersion: state.version,
      });
      dispatch({
        type: "APPROVAL_COMPLETED",
        receiptId: result.receiptId,
        receiptHash: result.receiptHash,
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
      const proposal: MissionProposal | null = state.proposal;
      if (!proposal || !missionIdRef.current) return;

      try {
        await rejectMission(missionIdRef.current, {
          proposalId: proposal.id,
          proposalVersion: proposal.version,
          reason,
          expectedMissionVersion: state.version,
        });
        dispatch({
          type: "REJECTION_COMPLETED",
          rejection: {
            reason,
            rejectedBy: "current-user",
            rejectedAt: new Date().toISOString(),
            proposalVersion: proposal.version,
          },
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
