import type { AgentMemoryRecord } from "./types";

export interface SessionCondenser {
	condense(records: AgentMemoryRecord[]): string;
}

export class SimpleSessionCondenser implements SessionCondenser {
	condense(records: AgentMemoryRecord[]): string {
		return records
			.map((record) => record.content.trim())
			.filter((content) => content.length > 0)
			.join("\n");
	}
}
