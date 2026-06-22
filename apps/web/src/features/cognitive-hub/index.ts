export { HubRoot } from "./components/HubRoot";
export { HubHeader } from "./components/HubHeader";
export { HubInput } from "./components/HubInput";
export { ChatView } from "./components/views/ChatView";
export { CommandView } from "./components/views/CommandView";

export { useHubState } from "./hooks/useHubState";
export {
	useHubHistory,
	type HubMessage,
	type HubMessageRole,
} from "./hooks/useHubHistory";
export { useHubSwarm } from "./api/useHubSwarm";
export { parseIntent, type HubIntent } from "./logic/intent-parser";

export type {
	HubViewMode,
	HubArtifact,
	ArtifactType,
	CognitiveMessage,
	SwarmTrace,
} from "./types/hub.types";
