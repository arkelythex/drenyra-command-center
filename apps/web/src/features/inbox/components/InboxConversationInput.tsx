"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InboxConversationMessage } from "../hooks/useInboxConversation";

type InboxConversationInputProps = {
	messages: InboxConversationMessage[];
	suggestions: string[];
	onAsk: (question: string) => void;
	disabled?: boolean;
};

export function InboxConversationInput({
	messages,
	suggestions,
	onAsk,
	disabled = false,
}: InboxConversationInputProps): ReactElement {
	const [prompt, setPrompt] = useState("");

	const submit = (event: FormEvent) => {
		event.preventDefault();
		const trimmed = prompt.trim();
		if (!trimmed) return;
		onAsk(trimmed);
		setPrompt("");
	};

	return (
		<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 p-4">
			{messages.length > 0 ? (
				<ul className="mb-3 max-h-40 space-y-2 overflow-y-auto text-xs">
					{messages.map((message) => (
						<li
							key={message.id}
							className={
								message.role === "user"
									? "text-[var(--color-info)]"
									: "text-[var(--text-secondary)] whitespace-pre-wrap"
							}
						>
							{message.role === "user" ? "Vos" : "Drenyra"}: {message.text}
						</li>
					))}
				</ul>
			) : null}

			<form onSubmit={submit} className="flex gap-2">
				<div className="relative min-w-0 flex-1">
					<MessageSquare
						size={16}
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
						aria-hidden
					/>
					<input
						value={prompt}
						onChange={(event) => setPrompt(event.target.value)}
						disabled={disabled}
						placeholder="Preguntale a Drenyra…"
						className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-info)]/50 focus:ring-2 focus:ring-[var(--color-info)]/30"
						aria-label="Pregunta sobre el batch"
					/>
				</div>
				<Button type="submit" size="sm" disabled={disabled || !prompt.trim()}>
					<SendHorizontal size={14} />
				</Button>
			</form>

			<div className="mt-2 flex flex-wrap gap-1.5">
				{suggestions.map((suggestion) => (
					<button
						key={suggestion}
						type="button"
						disabled={disabled}
						className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-2xs text-[var(--text-secondary)] hover:border-[var(--color-info)]/40"
						onClick={() => onAsk(suggestion)}
					>
						{suggestion}
					</button>
				))}
			</div>
		</section>
	);
}
