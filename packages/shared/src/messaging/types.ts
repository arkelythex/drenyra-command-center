/**
 * Cognitive messaging types — agent conversation messages with artifacts and traces.
 *
 * @module messaging/types
 */

import type { SwarmTrace } from "../agents/types";
import type { HubArtifact } from "../artifacts/types";

export interface CognitiveMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	swarmTrace?: SwarmTrace;
	artifacts?: HubArtifact[];
}
