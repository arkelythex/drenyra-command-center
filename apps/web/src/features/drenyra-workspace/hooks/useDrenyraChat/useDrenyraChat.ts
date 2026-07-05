import { useCallback, useRef, useState } from "react";
import { getGovernanceAuditHeaders } from "@/lib/api";
import {
	buildDrenyraStreamUrl,
	type DrenyraChatResponse,
	drenyraApi,
	parseSseBuffer,
} from "../../api/drenyra.api";
import type { Message, UseDrenyraChatReturn } from "./useDrenyraChat.types";

export function useDrenyraChat(): UseDrenyraChatReturn {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [streamingAgent, setStreamingAgent] = useState<string | undefined>();
	const [streamingTool, setStreamingTool] = useState<string | undefined>();
	const [sessionId, setSessionId] = useState<string | undefined>(undefined);
	const sessionIdRef = useRef<string | undefined>(undefined);
	const abortRef = useRef<AbortController | null>(null);

	const addMessage = useCallback((msg: Message) => {
		setMessages((prev) => [...prev, msg]);
	}, []);

	const appendTokens = useCallback(
		(tokenBuffer: string, currentAgent?: string) => {
			setMessages((prev) => {
				const last = prev[prev.length - 1];
				if (last?.role === "assistant" && last.agent) {
					const updated = [...prev];
					updated[updated.length - 1] = {
						...last,
						content: last.content + tokenBuffer,
					};
					return updated;
				}
				return [
					...prev,
					{
						role: "assistant",
						content: tokenBuffer,
						agent: currentAgent,
						timestamp: new Date(),
					},
				];
			});
		},
		[],
	);

	const postChat = useCallback(
		async (text: string) => {
			const response: DrenyraChatResponse = await drenyraApi.chat({
				message: text,
				sessionId: sessionIdRef.current,
			});

			sessionIdRef.current = response.sessionId;
			setSessionId(response.sessionId);

			if (response.result.ok && response.result.data) {
				addMessage({
					role: "assistant",
					content:
						typeof response.result.data === "string"
							? response.result.data
							: JSON.stringify(response.result.data, null, 2),
					agent: response.agent,
					timestamp: new Date(),
				});
			} else if (!response.result.ok) {
				addMessage({
					role: "tool",
					content: response.result.error ?? "Action requires approval",
					toolName: response.intent.tool,
					agent: response.agent,
					timestamp: new Date(),
				});

				if (response.result.details?.approvalId) {
					addMessage({
						role: "tool",
						content: `Approval required (ID: ${response.result.details.approvalId}). Go to Approvals to review.`,
						toolName: response.intent.tool,
						agent: response.agent,
						timestamp: new Date(),
					});
				}
			}
		},
		[addMessage],
	);

	const streamChat = useCallback(
		async (text: string): Promise<boolean> => {
			const abortController = new AbortController();
			abortRef.current = abortController;

			let currentAgent: string | undefined;
			let hasTokens = false;

			try {
				const url = buildDrenyraStreamUrl(text, sessionIdRef.current);
				const headers: Record<string, string> = {
					Accept: "text/event-stream",
					...getGovernanceAuditHeaders(),
				};

				const response = await fetch(url, {
					headers,
					signal: abortController.signal,
				});

				if (!response.ok) return false;
				if (!response.body) return false;

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				const processEvents = (
					events: { event: string | null; data: string }[],
				) => {
					let tokenBuffer = "";

					for (const sseEvent of events) {
						try {
							const payload = JSON.parse(sseEvent.data);

							switch (sseEvent.event) {
								case "intent": {
									currentAgent = payload.agent;
									setStreamingAgent(payload.agent);
									setStreamingTool(payload.tool);
									break;
								}
								case "token": {
									hasTokens = true;
									tokenBuffer += payload.token;
									break;
								}
								case "result": {
									setStreamingAgent(undefined);
									setStreamingTool(undefined);

									if (payload.sessionId) {
										sessionIdRef.current = payload.sessionId;
										setSessionId(payload.sessionId);
									}

									if (hasTokens) break;

									if (payload.ok && payload.data) {
										addMessage({
											role: "assistant",
											content:
												typeof payload.data === "string"
													? payload.data
													: JSON.stringify(payload.data, null, 2),
											agent: payload.agent,
											timestamp: new Date(),
										});
									} else if (!payload.ok) {
										addMessage({
											role: "tool",
											content: payload.error ?? "Action requires approval",
											agent: payload.agent,
											timestamp: new Date(),
										});

										if (payload.details?.approvalId) {
											addMessage({
												role: "tool",
												content: `Approval required (ID: ${payload.details.approvalId}). Go to Approvals to review.`,
												agent: payload.agent,
												timestamp: new Date(),
											});
										}
									}
									break;
								}
								case "error": {
									setStreamingAgent(undefined);
									setStreamingTool(undefined);
									addMessage({
										role: "tool",
										content: payload.error ?? "Unknown streaming error",
										timestamp: new Date(),
									});
									break;
								}
							}
						} catch {
							// skip malformed events
						}
					}

					if (tokenBuffer) {
						appendTokens(tokenBuffer, currentAgent);
					}
				};

				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						processEvents(parseSseBuffer(buffer + "\n\n").events);
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const { events, rest } = parseSseBuffer(buffer);
					buffer = rest;
					processEvents(events);
				}

				return true;
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") {
					return true;
				}
				return false;
			}
		},
		[addMessage, appendTokens],
	);

	const sendMessage = useCallback(
		async (text: string) => {
			addMessage({
				role: "user",
				content: text,
				timestamp: new Date(),
			});
			setIsLoading(true);

			try {
				const streamed = await streamChat(text);
				if (!streamed) {
					await postChat(text);
				}
			} catch (err) {
				addMessage({
					role: "tool",
					content: err instanceof Error ? err.message : "Unknown error",
					timestamp: new Date(),
				});
			} finally {
				setIsLoading(false);
				setStreamingAgent(undefined);
				setStreamingTool(undefined);
				abortRef.current = null;
			}
		},
		[streamChat, postChat, addMessage],
	);

	const reset = useCallback(() => {
		setMessages([]);
		sessionIdRef.current = undefined;
		setSessionId(undefined);
		setStreamingAgent(undefined);
		setStreamingTool(undefined);
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	return {
		messages,
		sendMessage,
		isLoading,
		streamingAgent,
		streamingTool,
		sessionId,
		reset,
	};
}
