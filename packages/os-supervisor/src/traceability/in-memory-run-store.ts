import type { AgentRunStats, IAgentRunStore, OSAgentRun } from "./types.js";

export class InMemoryAgentRunStore implements IAgentRunStore {
	private runs: Map<string, OSAgentRun> = new Map();

	record(run: OSAgentRun): void {
		this.runs.set(run.id, { ...run, timestamp: new Date(run.timestamp) });
	}

	getById(id: string): OSAgentRun | undefined {
		const run = this.runs.get(id);
		return run ? { ...run } : undefined;
	}

	list(vertical?: string): OSAgentRun[] {
		const result: OSAgentRun[] = [];
		for (const run of this.runs.values()) {
			if (vertical && run.vertical !== vertical) continue;
			result.push({ ...run });
		}
		result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
		return result;
	}

	getStats(): AgentRunStats {
		const runs = Array.from(this.runs.values());
		const total = runs.length;

		const byVertical: Record<string, number> = {};
		const byStatus: Record<string, number> = {};
		let totalDurationMs = 0;
		let totalTokensUsed = 0;

		for (const run of runs) {
			byVertical[run.vertical] = (byVertical[run.vertical] ?? 0) + 1;
			byStatus[run.approvalStatus] = (byStatus[run.approvalStatus] ?? 0) + 1;
			totalDurationMs += run.durationMs;
			totalTokensUsed += run.tokensUsed;
		}

		return {
			total,
			byVertical,
			byStatus,
			averageDurationMs: total > 0 ? Math.round(totalDurationMs / total) : 0,
			totalTokensUsed,
		};
	}
}
