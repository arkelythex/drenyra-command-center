export type DifyOperation =
	| {
			type: "chat.message";
			query: string;
			user?: string;
			conversationId?: string;
			inputs?: Record<string, unknown>;
	  }
	| { type: "chat.conversations"; user?: string; limit?: number }
	| {
			type: "workflow.run";
			workflowId: string;
			inputs: Record<string, unknown>;
			user?: string;
	  }
	| { type: "workflow.status"; runId: string }
	| {
			type: "knowledge.retrieve";
			query: string;
			datasetId: string;
			topK?: number;
	  }
	| { type: "health" };

export interface DifyChatResponse {
	answer: string;
	conversation_id: string;
	message_id: string;
	created_at: number;
}

export interface DifyConversation {
	id: string;
	name: string;
	inputs: Record<string, unknown>;
	status: "normal" | "archived";
	created_at: number;
	updated_at: number;
}

export interface DifyWorkflowRunResponse {
	id: string;
	workflow_id: string;
	status: "running" | "succeeded" | "failed" | "stopped";
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown> | null;
	error: string | null;
	elapsed_time: number;
	created_at: number;
	finished_at: number;
}

export interface DifyKnowledgeRetrievalResponse {
	records: Array<{
		segment_id: string;
		content: string;
		score: number;
		dataset_id: string;
		document_id: string;
	}>;
}

export interface DifyApiError {
	code: string;
	message: string;
	status: number;
}
