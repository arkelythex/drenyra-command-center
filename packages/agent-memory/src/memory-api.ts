import type { AgentMemoryStore } from "./agent-memory-store";
import type {
	AgentMemoryContextQuery,
	AgentMemorySearchQuery,
	SaveAgentMemoryInput,
} from "./types";

export function createMemoryApi(store: AgentMemoryStore) {
	return {
		mem_save: (input: SaveAgentMemoryInput) => store.save(input),
		mem_search: (query: AgentMemorySearchQuery) => store.search(query),
		mem_context: (query: AgentMemoryContextQuery) => store.context(query),
	};
}

export type AgentMemoryApi = ReturnType<typeof createMemoryApi>;
