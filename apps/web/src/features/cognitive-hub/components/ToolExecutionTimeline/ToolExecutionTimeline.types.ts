import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";

export interface ToolExecutionTimelineProps {
	entries: CognitiveActivityEntry[];
	activeRunId: string | null;
	onClear?: () => void;
}
