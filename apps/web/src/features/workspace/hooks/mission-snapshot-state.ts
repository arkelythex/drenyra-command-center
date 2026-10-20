import type { MissionSnapshot } from "@drenyra/mission-domain";
import type { MissionState } from "./missionReducer";

/** Server snapshot → reducer state. The server's `version` is the one to send back. */
export function toMissionState(
	snapshot: MissionSnapshot,
	isMockMode = false,
): MissionState {
	return {
		status: snapshot.status,
		progress: snapshot.progress,
		steps: snapshot.steps ?? [],
		currentStep: snapshot.currentStep ?? "",
		blockers: snapshot.blockers ?? [],
		proposal: snapshot.proposal ?? null,
		version: snapshot.version,
		rejection: snapshot.rejection ?? null,
		receiptId: snapshot.receiptId ?? null,
		receiptHash: snapshot.receiptHash ?? null,
		error: null,
		isMockMode,
		lastEventSequence: snapshot.lastEventSequence ?? 0,
	};
}
