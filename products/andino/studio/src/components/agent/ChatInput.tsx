"use client";

import { useState } from "react";

export default function ChatInput({
	onSend,
	disabled,
}: {
	onSend: (text: string) => void;
	disabled: boolean;
}) {
	const [text, setText] = useState("");

	function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed || disabled) return;
		onSend(trimmed);
		setText("");
	}

	return (
		<div className="border-t border-border-subtle p-4 bg-bg-void">
			<div className="flex gap-3 max-w-4xl mx-auto">
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
					placeholder="Ask the agent about drone design, missions, or optimization..."
					disabled={disabled}
					className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-400/30 focus:border-accent-400 disabled:opacity-50 transition-all duration-200"
				/>
				<button
					onClick={handleSubmit}
					disabled={disabled || !text.trim()}
					className="px-5 py-2.5 bg-accent-400 hover:bg-accent-500 disabled:bg-bg-elevated disabled:text-text-muted text-bg-void rounded-lg text-sm font-medium transition-all duration-200"
				>
					Send
				</button>
			</div>
		</div>
	);
}
