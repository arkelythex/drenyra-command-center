import { useCallback, useEffect, useMemo, useState } from "react";

const HUB_HISTORY_KEY = "drenyra-cognitive-hub-history-v1";

export type HubMessageRole = "user" | "assistant" | "system";

export interface HubMessage {
	id: string;
	role: HubMessageRole;
	content: string;
	createdAt: string;
}

function readInitialHistory(): HubMessage[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = window.localStorage.getItem(HUB_HISTORY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as HubMessage[];
		return Array.isArray(parsed) ? parsed.slice(-50) : [];
	} catch {
		return [];
	}
}

export function useHubHistory() {
	const [messages, setMessages] = useState<HubMessage[]>(() =>
		readInitialHistory(),
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(
			HUB_HISTORY_KEY,
			JSON.stringify(messages.slice(-50)),
		);
	}, [messages]);

	const addMessage = useCallback((role: HubMessageRole, content: string) => {
		const message: HubMessage = {
			id: `hub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			role,
			content,
			createdAt: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, message].slice(-50));
		return message;
	}, []);

	const clearHistory = useCallback(() => {
		setMessages([]);
	}, []);

	const latestMessage = useMemo(
		() => (messages.length > 0 ? messages[messages.length - 1] : null),
		[messages],
	);

	return {
		messages,
		latestMessage,
		addMessage,
		clearHistory,
	};
}
