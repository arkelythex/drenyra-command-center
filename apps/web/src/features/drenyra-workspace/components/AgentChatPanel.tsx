import { useEffect, useRef, useState } from "react";
import { useDrenyraChat } from "../hooks/useDrenyraChat";

interface AgentChatPanelProps {
	agentName: string;
	placeholder?: string;
}

export function AgentChatPanel({
	agentName,
	placeholder = "Escribí tu consulta...",
}: AgentChatPanelProps) {
	const { messages, sendMessage, isLoading, streamingAgent } = useDrenyraChat();
	const [input, setInput] = useState("");
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current?.scrollTo(0, listRef.current.scrollHeight);
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		const text = input.trim();
		setInput("");
		await sendMessage(text);
	};

	return (
		<div className="flex h-full flex-col">
			<div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
				{messages.length === 0 && (
					<div className="flex h-full items-center justify-center">
						<div className="max-w-md text-center">
							<p className="text-lg text-[var(--color-text-secondary)]">
								{agentName}
							</p>
							<p className="mt-2 text-sm text-[var(--color-text-muted)]">
								Hacé una consulta sobre {agentName.toLowerCase()}.
							</p>
						</div>
					</div>
				)}

				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[80%] rounded-lg px-4 py-2 ${
								msg.role === "user"
									? "bg-[var(--color-primary)] text-white"
									: msg.role === "tool"
										? "bg-amber-900/50 text-amber-200"
										: "bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
							}`}
						>
							<p className="whitespace-pre-wrap text-sm">{msg.content}</p>
							{msg.agent && (
								<p className="mt-1 text-xs text-[var(--color-text-muted)]">
									Agent: {msg.agent}
								</p>
							)}
						</div>
					</div>
				))}

				{isLoading && (
					<div className="flex justify-start">
						<div className="rounded-lg bg-[var(--color-surface-2)] px-4 py-2">
							{streamingAgent ? (
								<p className="text-sm text-[var(--color-text-secondary)]">
									Processing with{" "}
									<span className="text-[var(--color-primary)]">
										{streamingAgent}
									</span>
									...
								</p>
							) : (
								<div className="flex gap-1">
									<div className="size-2 animate-bounce rounded-full bg-[var(--color-text-muted)]" />
									<div className="size-2 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:0.1s]" />
									<div className="size-2 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:0.2s]" />
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<form
				onSubmit={handleSubmit}
				className="border-t border-[var(--color-stroke-2)] p-4"
			>
				<div className="flex gap-2">
					<input
						aria-label="Mensaje para el agente"
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={placeholder}
						disabled={isLoading}
						className="flex-1 rounded-lg border border-[var(--color-stroke-3)] bg-[var(--color-surface-1)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
					/>
					<button
						type="submit"
						disabled={!input.trim() || isLoading}
						className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
					>
						Enviar
					</button>
				</div>
			</form>
		</div>
	);
}
