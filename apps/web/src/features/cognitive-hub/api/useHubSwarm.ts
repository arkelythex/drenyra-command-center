import { useAgentStream } from "@/features/intelligence/hooks/useAgentStream";
import { useSwarmStore } from "@/features/intelligence/stores/useSwarmStore";

export function useHubSwarm() {
	const { startStream, stopStream, isStreaming, connectionStatus } =
		useAgentStream();
	const activeRunId = useSwarmStore((state) => state.activeRunId);
	const runsById = useSwarmStore((state) => state.runsById);
	const lastError = useSwarmStore((state) => state.lastError);

	const activeRun = activeRunId ? runsById[activeRunId] : null;

	return {
		startStream,
		stopStream,
		isStreaming,
		connectionStatus,
		activeRun,
		lastError,
	};
}
