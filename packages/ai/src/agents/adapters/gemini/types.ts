export interface GeminiConfig {
	apiKey: string;
	model?: string;
	instanceId?: string;
	maxTokens?: number;
	temperature?: number;
	cacheEnabled?: boolean;
}

export interface GeminiMultimodalInput {
	text?: string;
	images?: string[];
	systemInstruction?: string;
}
