import { useEffect, useRef } from "react";
import { useAgentActivityStore } from "../../stores/agent-activity.store";
import { AgentActivityFeed } from "./AgentActivityFeed";

/**
 * AgentActivityView — right panel view showing all active agent feeds.
 *
 * Shows feeds sorted by most recent activity.
 * If no active feeds, shows empty state.
 */
export function AgentActivityView() {
	const feeds = useAgentActivityStore((s) => s.feeds);
	const setAgentState = useAgentActivityStore((s) => s.setAgentState);
	const removeFeed = useAgentActivityStore((s) => s.removeFeed);
	const timersRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Simulate elapsed time updates for active agents
	useEffect(() => {
		timersRef.current = setInterval(() => {
			const store = useAgentActivityStore.getState();
			for (const feed of Object.values(store.feeds)) {
				if (feed.state === "working" || feed.state === "verifying") {
					store.setAgentState(feed.agentId, feed.state);
				}
			}
		}, 1000);

		return () => {
			if (timersRef.current) clearInterval(timersRef.current);
		};
	}, [setAgentState]);

	const feedList = Object.values(feeds).sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);

	if (feedList.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
					<span className="text-lg">🤖</span>
				</div>
				<p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
					Sin agentes activos
				</p>
				<p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
					Los agentes aparecerán aquí cuando estén ejecutando tareas. Podrás ver
					su estado, actividad y acciones en tiempo real.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
			{feedList.map((feed) => (
				<section key={feed.agentId} className="flex flex-col">
					<AgentActivityFeed
						agentName={feed.agentName}
						state={feed.state}
						events={feed.events}
						elapsedMs={feed.elapsedMs}
						onPause={() => setAgentState(feed.agentId, "waiting_for_input")}
						onCancel={() => removeFeed(feed.agentId)}
						onResume={() => setAgentState(feed.agentId, "working")}
					/>
				</section>
			))}
		</div>
	);
}
