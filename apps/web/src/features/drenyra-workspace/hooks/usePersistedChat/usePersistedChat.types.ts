import type { Message } from "@/components/agentic/ThreadView";

export interface UsePersistedChatOptions {
	threadId: string | null;
	linkedCaseId?: string | null;
}

export interface UsePersistedChatReturn {
	messages: Message[];
	sendMessage: (text: string) => Promise<void>;
	isLoading: boolean;
	isStreaming: boolean;
	loadingHistory: boolean;
	error: string | null;
	clearError: () => void;
}
