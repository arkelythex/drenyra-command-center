import { useCallback, useMemo, useReducer, useRef } from "react";
import { missionReducer, INITIAL_STATE } from "./missionReducer";
import { isRunnable, isAwaitingApproval, isTerminal } from "@drenyra/mission-domain";
import { useMissionSnapshot } from "./useMissionSnapshot";
import { useMissionExecution } from "./useMissionExecution";
import { useMissionDecision } from "./useMissionDecision";
import { useMissionRecovery } from "./useMissionRecovery";

export function useAccountingMission() {
  const [state, dispatch] = useReducer(missionReducer, INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const missionIdRef = useRef<string | null>(null);

  const { reconnect } = useMissionSnapshot(dispatch);
  const { run, abort } = useMissionExecution(dispatch, abortRef, missionIdRef);
  const { approve, reject } = useMissionDecision(dispatch, missionIdRef, state);
  const { reconcile } = useMissionRecovery(dispatch, missionIdRef);

  const computed = useMemo(
    () => ({
      isReady: isRunnable(state.status),
      isAwaiting: isAwaitingApproval(state.status),
      isFinished: isTerminal(state.status),
    }),
    [state.status],
  );

  const requestRevision = useCallback(() => {
    dispatch({ type: "REVISION_REQUESTED" });
  }, []);

  const reset = useCallback(() => {
    abort();
    missionIdRef.current = null;
    dispatch({ type: "RESET" });
  }, [abort]);

  return {
    ...state,
    ...computed,
    run,
    approve,
    reject,
    requestRevision,
    reconnect,
    reconcile,
    reset,
  };
}
