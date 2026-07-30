import type {
  AccountingMissionStatus,
  MissionBlocker,
  MissionProposal,
  MissionRejection,
  MissionStep,
} from "@drenyra/mission-domain";

export interface MissionState {
  status: AccountingMissionStatus;
  progress: number;
  steps: MissionStep[];
  currentStep: string;
  blockers: MissionBlocker[];
  proposal: MissionProposal | null;
  version: number;
  rejection: MissionRejection | null;
  receiptId: string | null;
  receiptHash: string | null;
  error: string | null;
  isMockMode: boolean;
  lastEventSequence: number;
}

export type MissionAction =
  | { type: "MISSION_EVENT_RECEIVED"; event: MissionState }
  | { type: "APPROVAL_COMPLETED"; receiptId: string; receiptHash: string }
  | { type: "REJECTION_COMPLETED"; rejection: MissionRejection }
  | { type: "REVISION_REQUESTED" }
  | { type: "RECONNECT_SUCCEEDED"; snapshot: MissionState }
  | { type: "RECONNECT_FAILED"; error: string }
  | { type: "RECONCILE_RESOLVED"; status: AccountingMissionStatus }
  | { type: "ERROR_OCCURRED"; error: string; isTimeout: boolean }
  | { type: "RESET" };

export const INITIAL_STATE: MissionState = {
  status: "DRAFT" as AccountingMissionStatus,
  progress: 0,
  steps: [],
  currentStep: "",
  blockers: [],
  proposal: null,
  version: 0,
  rejection: null,
  receiptId: null,
  receiptHash: null,
  error: null,
  isMockMode: false,
  lastEventSequence: 0,
};

export function missionReducer(
  state: MissionState,
  action: MissionAction,
): MissionState {
  switch (action.type) {
    case "MISSION_EVENT_RECEIVED":
      return {
        ...state,
        status: action.event.status,
        progress: action.event.progress,
        steps: action.event.steps,
        currentStep: action.event.currentStep,
        blockers: action.event.blockers,
        proposal: action.event.proposal,
        version: action.event.version,
        rejection: action.event.rejection ?? null,
        receiptId: action.event.receiptId ?? null,
        receiptHash: action.event.receiptHash ?? null,
        lastEventSequence:
          action.event.lastEventSequence ?? state.lastEventSequence,
        error: null,
      };

    case "APPROVAL_COMPLETED":
      return {
        ...state,
        status: "APPROVED" as AccountingMissionStatus,
        receiptId: action.receiptId,
        receiptHash: action.receiptHash,
        error: null,
      };

    case "REJECTION_COMPLETED":
      return {
        ...state,
        status: "REJECTED" as AccountingMissionStatus,
        rejection: action.rejection,
        error: null,
      };

    case "REVISION_REQUESTED":
      return {
        ...state,
        status: "REVISION_REQUESTED" as AccountingMissionStatus,
        proposal: null,
        rejection: null,
      };

    case "RECONNECT_SUCCEEDED":
      return {
        ...state,
        status: action.snapshot.status,
        progress: action.snapshot.progress,
        steps: action.snapshot.steps,
        currentStep: action.snapshot.currentStep,
        blockers: action.snapshot.blockers,
        proposal: action.snapshot.proposal,
        version: action.snapshot.version,
        rejection: action.snapshot.rejection ?? null,
        receiptId: action.snapshot.receiptId ?? null,
        receiptHash: action.snapshot.receiptHash ?? null,
        lastEventSequence:
          action.snapshot.lastEventSequence ?? state.lastEventSequence,
        error: null,
        isMockMode: false,
      };

    case "RECONNECT_FAILED":
      return {
        ...state,
        status: "UNKNOWN" as AccountingMissionStatus,
        error: action.error,
      };

    case "RECONCILE_RESOLVED":
      return {
        ...state,
        status: action.status,
        error: null,
      };

    case "ERROR_OCCURRED":
      return {
        ...state,
        status: action.isTimeout
          ? ("UNKNOWN" as AccountingMissionStatus)
          : ("FAILED" as AccountingMissionStatus),
        error: action.error,
      };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}
