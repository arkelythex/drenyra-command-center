import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@/components/agentic/ThreadView";
import { generateId } from "@/lib/id";
import { useThreadStore } from "@/stores/thread-store";
import {
	createBrainThread,
	getThreadItems,
	streamChat,
} from "../../api/brain.api";
import type {
	UsePersistedChatOptions,
	UsePersistedChatReturn,
} from "./usePersistedChat.types";
import { mapItemToMessage } from "./usePersistedChat.utils";

export function usePersistedChat({
	threadId: localThreadId,
	linkedCaseId,
}: UsePersistedChatOptions): UsePersistedChatReturn {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isStreaming, setIsStreaming] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const brainIdsRef = useRef<Map<string, string>>(new Map());
	const abortRef = useRef<AbortController | null>(null);
	const localThreadIdRef = useRef(localThreadId);
	useEffect(() => {
		localThreadIdRef.current = localThreadId;
	}, [localThreadId]);

	useEffect(() => {
		if (!localThreadId) {
			setMessages([]);
			brainIdsRef.current = new Map();
			return;
		}

		const store = useThreadStore.getState();
		const thread = store.threads.find((t) => t.id === localThreadId);
		const brainId =
			brainIdsRef.current.get(localThreadId) ?? thread?.brainThreadId;

		if (!brainId) return;

		let cancelled = false;
		setLoadingHistory(true);

		getThreadItems(brainId)
			.then((items) => {
				if (cancelled) return;
				const mapped = items.map(mapItemToMessage);
				setMessages(mapped);
			})
			.catch((err: Error) => {
				if (!cancelled) {
					setError(err.message);
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingHistory(false);
			});

		return () => {
			cancelled = true;
		};
	}, [localThreadId]);

	const sendMessage = useCallback(
		async (text: string) => {
			setError(null);

			const store = useThreadStore.getState();

			let localId = localThreadIdRef.current;
			if (!localId) {
				const title = text.length > 60 ? text.slice(0, 57) + "..." : text;
				const thread = store.createThread(title);
				localId = thread.id;
			}

			const userMsg: Message = {
				id: generateId(),
				role: "user",
				content: text,
				timestamp: new Date().toISOString(),
				status: "complete",
			};
			setMessages((prev) => [...prev, userMsg]);

			let brainId =
				brainIdsRef.current.get(localId) ??
				store.threads.find((t) => t.id === localId)?.brainThreadId;

			if (!brainId) {
				setIsLoading(true);
				try {
					const title = text.length > 60 ? text.slice(0, 57) + "..." : text;
					const thread = await createBrainThread(
						title,
						linkedCaseId ?? undefined,
					);
					brainId = thread.id;
					brainIdsRef.current.set(localId, brainId);
					useThreadStore.getState().setThreadBrainId(localId, brainId);
				} catch (err: unknown) {
					const message =
						err instanceof Error ? err.message : "Failed to create thread";
					setError(message);
					setIsLoading(false);
					return;
				}
			}

			const assistantMsg: Message = {
				id: generateId(),
				role: "agent",
				content: "",
				timestamp: new Date().toISOString(),
				status: "streaming",
			};
			setMessages((prev) => [...prev, assistantMsg]);
			setIsLoading(true);
			setIsStreaming(true);

			const abortController = new AbortController();
			abortRef.current = abortController;

			try {
				await streamChat(
					text,
					brainId,
					{
						onToken: (token) => {
							setMessages((prev) => {
								const last = prev[prev.length - 1];
								if (last?.role === "agent" && last.status === "streaming") {
									return [
										...prev.slice(0, -1),
										{
											...last,
											content: last.content + token,
										},
									];
								}
								return prev;
							});
						},
						onDone: () => {
							setMessages((prev) => {
								const last = prev[prev.length - 1];
								if (last?.role === "agent" && last.status === "streaming") {
									return [
										...prev.slice(0, -1),
										{ ...last, status: "complete" },
									];
								}
								return prev;
							});
						},
						onError: (errMsg) => {
							setMessages((prev) => {
								const last = prev[prev.length - 1];
								if (last?.role === "agent" && last.status === "streaming") {
									const updated = [
										...prev.slice(0, -1),
										{
											...last,
											content: last.content || errMsg,
											status: "error" as const,
										},
									];
									return updated;
								}
								return prev;
							});
							setError(errMsg);
						},
					},
					abortController.signal,
				);
			} catch (err: unknown) {
				if (err instanceof Error && err.name === "AbortError") {
					return;
				}
				const message = err instanceof Error ? err.message : "Chat failed";
				setMessages((prev) => {
					const last = prev[prev.length - 1];
					if (last?.role === "agent" && last.status === "streaming") {
						return [
							...prev.slice(0, -1),
							{
								...last,
								content: last.content || message,
								status: "error" as const,
							},
						];
					}
					return prev;
				});
				setError(message);
			} finally {
				setIsLoading(false);
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[linkedCaseId],
	);

	const clearError = useCallback(() => setError(null), []);

	return {
		messages,
		sendMessage,
		isLoading,
		isStreaming,
		loadingHistory,
		error,
		clearError,
	};
}
