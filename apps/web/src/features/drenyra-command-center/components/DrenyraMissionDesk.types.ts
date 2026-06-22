import type { DocumentMissionResult } from "../api/drenyra-mission.api";
import type { FiscalCase } from "../api/drenyra-command-center.api";

export type MissionPhase =
	| "idle"
	| "uploading"
	| "orchestrating"
	| "streaming"
	| "ready"
	| "error";

export type DrenyraMissionDeskProps = {
	onMissionReady?: (result: {
		fiscalCase: FiscalCase;
		mission: DocumentMissionResult;
	}) => void;
};
