export interface Message {
	role: "user" | "assistant" | "tool";
	content: string;
	agent?: string;
	toolName?: string;
	timestamp: Date;
}

export interface UseDrenyraChatReturn {
	messages: Message[];
	sendMessage: (text: string) => Promise<void>;
	isLoading: boolean;
	streamingAgent: string | undefined;
	streamingTool: string | undefined;
	sessionId: string | undefined;
	reset: () => void;
}
