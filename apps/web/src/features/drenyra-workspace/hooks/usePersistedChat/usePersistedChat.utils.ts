import type {
	DrenyraBrainItem,
	DrenyraBrainItemContent,
} from "@drenyra/domain/drenyra";
import type { Message } from "@/components/agentic/ThreadView";

function extractText(content: DrenyraBrainItemContent): string {
	if (
		"text" in content &&
		typeof (content as { text: string }).text === "string"
	) {
		return (content as { text: string }).text;
	}
	if (
		"message" in content &&
		typeof (content as { message: string }).message === "string"
	) {
		return (content as { message: string }).message;
	}
	if (
		"summary" in content &&
		typeof (content as { summary?: string }).summary === "string"
	) {
		return (content as { summary: string }).summary;
	}
	return JSON.stringify(content);
}

export function mapItemToMessage(item: DrenyraBrainItem): Message {
	const base = {
		id: item.id,
		content: "",
		timestamp: item.createdAt,
		status: "complete" as const,
	};

	if (item.type === "user_message") {
		return {
			...base,
			role: "user",
			content: extractText(item.content),
		};
	}

	if (item.type === "assistant_message") {
		return {
			...base,
			role: "agent",
			content: extractText(item.content),
		};
	}

	if (item.type === "error") {
		return {
			...base,
			role: "system",
			content: extractText(item.content),
			status: "error",
		};
	}

	return {
		...base,
		role: "system",
		content: extractText(item.content),
	};
}
