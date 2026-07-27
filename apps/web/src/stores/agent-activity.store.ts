import { create } from "zustand";
import type {
	AgentActivityEvent,
	AgentActivityFeed,
	AgentSemanticState,
} from "../types/agent-activity";

interface AgentActivityStore {
	/** Active feeds keyed by agentId */
	feeds: Record<string, AgentActivityFeed>;

	/** Start a new agent activity feed */
	startFeed: (agentId: string, agentName: string) => void;

	/** Update agent state */
	setAgentState: (agentId: string, state: AgentSemanticState) => void;

	/** Add a single event to an agent's feed */
	addEvent: (agentId: string, event: AgentActivityEvent) => void;

	/** Add multiple events at once */
	addEvents: (agentId: string, events: AgentActivityFeed) => void;

	/** Remove a feed */
	removeFeed: (agentId: string) => void;

	/** Get feed for an agent */
	getFeed: (agentId: string) => AgentActivityFeed | undefined;

	/** Clear all feeds */
	clearAll: () => void;
}

export const useAgentActivityStore = create<AgentActivityStore>((set, get) => ({
	feeds: {},

	startFeed: (agentId, agentName) => {
		set((state) => ({
			feeds: {
				...state.feeds,
				[agentId]: {
					agentId,
					agentName,
					state: "queued",
					events: [],
					startedAt: new Date().toISOString(),
					elapsedMs: 0,
				},
			},
		}));
	},

	setAgentState: (agentId, state) => {
		set((prev) => {
			const feed = prev.feeds[agentId];
			if (!feed) return prev;
			return {
				feeds: {
					...prev.feeds,
					[agentId]: {
						...feed,
						state,
						elapsedMs: Date.now() - new Date(feed.startedAt).getTime(),
					},
				},
			};
		});
	},

	addEvent: (agentId, event) => {
		set((prev) => {
			const feed = prev.feeds[agentId];
			if (!feed) return prev;
			return {
				feeds: {
					...prev.feeds,
					[agentId]: {
						...feed,
						events: [...feed.events, event],
						elapsedMs: Date.now() - new Date(feed.startedAt).getTime(),
					},
				},
			};
		});
	},

	addEvents: (agentId, feedData) => {
		set((prev) => ({
			feeds: {
				...prev.feeds,
				[agentId]: {
					...feedData,
					events: feedData.events,
					elapsedMs: Date.now() - new Date(feedData.startedAt).getTime(),
				},
			},
		}));
	},

	removeFeed: (agentId) => {
		set((prev) => {
			const { [agentId]: _, ...rest } = prev.feeds;
			return { feeds: rest };
		});
	},

	getFeed: (agentId) => {
		return get().feeds[agentId];
	},

	clearAll: () => set({ feeds: {} }),
}));
