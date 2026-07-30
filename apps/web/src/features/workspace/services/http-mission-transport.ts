import type {
  MissionSnapshot,
  RunIntentCommand,
  ApproveCommand,
  RejectCommand,
  ReconcileCommand,
} from "@drenyra/mission-domain";
import { missionFetch } from "./mission-client";

export async function createMission(
  command: RunIntentCommand,
): Promise<MissionSnapshot> {
  return missionFetch<MissionSnapshot>("/api/v1/missions", {
    method: "POST",
    body: JSON.stringify(command),
  });
}

export async function getMission(missionId: string): Promise<MissionSnapshot> {
  return missionFetch<MissionSnapshot>(`/api/v1/missions/${missionId}`);
}

export async function approveMission(
  missionId: string,
  command: ApproveCommand,
): Promise<{ receiptId: string; receiptHash: string }> {
  return missionFetch<{ receiptId: string; receiptHash: string }>(
    `/api/v1/missions/${missionId}/approve`,
    {
      method: "POST",
      body: JSON.stringify(command),
    },
  );
}

export async function rejectMission(
  missionId: string,
  command: RejectCommand,
): Promise<void> {
  await missionFetch(`/api/v1/missions/${missionId}/reject`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

export async function reconcileMission(
  missionId: string,
  command: ReconcileCommand,
): Promise<MissionSnapshot> {
  return missionFetch<MissionSnapshot>(
    `/api/v1/missions/${missionId}/reconcile`,
    {
      method: "POST",
      body: JSON.stringify(command),
    },
  );
}
