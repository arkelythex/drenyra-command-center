export type StreamChunk =
	| { type: "token"; content: string }
	| {
			type: "tool";
			toolName: string;
			status: "running" | "completed" | "error";
			output?: string;
	  }
	| { type: "error"; error: string }
	| { type: "done" };

export interface ChatMessage {
	id: string;
	role: "user" | "agent" | "system";
	content: string;
	timestamp: string;
	toolCalls?: {
		id: string;
		name: string;
		status: "running" | "completed" | "error";
		output?: string;
		exitCode?: number;
		error?: string;
	}[];
	status?: "streaming" | "complete" | "error";
}

interface LocalBrainThread {
	id: string;
	title: string;
	status: string;
	createdAt: string;
}
