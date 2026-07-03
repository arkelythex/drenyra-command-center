"use client";

import { type FormEvent, useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { cn } from "@/lib/utils";
import {
	QUICK_REFERENCES,
	SKILL_COMMANDS,
	COMMAND_BAR_PLACEHOLDER,
} from "./AgenticCommandBar.data";
import type { QuickReference, SkillCommand } from "./AgenticCommandBar.types";

interface AgenticCommandBarProps {
	className?: string;
}

type ActiveSuggestion = "references" | "skills" | "search" | null;

export function AgenticCommandBar({ className }: AgenticCommandBarProps) {
	const navigate = useNavigate();
	const { openCommandPalette } = useAgenticShell();
	const [input, setInput] = useState("");
	const [activeSuggestion, setActiveSuggestion] =
		useState<ActiveSuggestion>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Track prefix characters
	useEffect(() => {
		const lastChar = input.charAt(input.length - 1);
		if (lastChar === "@") {
			setActiveSuggestion("references");
		} else if (lastChar === "/") {
			setActiveSuggestion("skills");
		} else if (
			input.length > 0 &&
			!input.includes("@") &&
			!input.includes("/")
		) {
			setActiveSuggestion("search");
		} else {
			setActiveSuggestion(null);
		}
	}, [input]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) return;

		// Navigate to thread creation with prompt
		void navigate({
			to: "/threads/new",
			search: { q: trimmed.slice(0, 120) } as never,
		});
		setInput("");
		setActiveSuggestion(null);
	};

	const handleSuggestionClick = (suggestion: QuickReference | SkillCommand) => {
		setInput((prev) => {
			// Replace the @ or / prefix with the suggestion
			const withoutPrefix = prev.replace(/[@/]$/, "");
			return `${withoutPrefix}${suggestion.label} `;
		});
		setActiveSuggestion(null);
		inputRef.current?.focus();
	};

	const showSuggestions =
		activeSuggestion === "references" || activeSuggestion === "skills";

	return (
		<footer
			className={cn(
				"sticky bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/95 backdrop-blur-sm",
				className,
			)}
		>
			<div className="relative">
				{/* Suggestions popup */}
				{showSuggestions && (
					<div className="absolute bottom-full left-0 right-0 mx-2 mb-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-lg">
						{activeSuggestion === "references" && (
							<div>
								<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
									Referencias
								</div>
								{QUICK_REFERENCES.map((ref) => (
									<button
										key={ref.label}
										type="button"
										className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
										onClick={() => handleSuggestionClick(ref)}
									>
										<span className="font-mono text-[var(--color-primary)]">
											{ref.prefix}
										</span>
										<span className="font-medium">{ref.label}</span>
										<span className="ml-auto text-[var(--text-muted)]">
											{ref.description}
										</span>
									</button>
								))}
							</div>
						)}
						{activeSuggestion === "skills" && (
							<div>
								<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
									Skills contables
								</div>
								{SKILL_COMMANDS.map((skill) => (
									<button
										key={skill.label}
										type="button"
										className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
										onClick={() => handleSuggestionClick(skill)}
									>
										<span className="font-mono text-[var(--color-accent)]">
											{skill.prefix}
										</span>
										<span className="font-medium">{skill.label}</span>
										<span className="ml-auto text-[var(--text-muted)]">
											{skill.description}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="flex items-center gap-2 px-4 py-2"
				>
					<div className="relative flex-1">
						<MessageSquare
							size={14}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
						/>
						<input
							ref={inputRef}
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={COMMAND_BAR_PLACEHOLDER}
							className="h-9 w-full rounded-lg bg-[var(--surface-2)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]/30 focus:ring-1 focus:ring-[var(--color-primary)]/20"
							aria-label="Ask Drenyra anything"
						/>
					</div>

					{/* @ and / chips */}
					<div className="hidden gap-1 md:flex">
						{QUICK_REFERENCES.slice(0, 2).map((ref) => (
							<button
								key={ref.label}
								type="button"
								className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-2xs text-[var(--text-tertiary)] transition hover:border-[var(--color-info)]/40 hover:text-[var(--color-info)]"
								onClick={() => handleSuggestionClick(ref)}
							>
								{ref.label}
							</button>
						))}
						{SKILL_COMMANDS.slice(0, 3).map((skill) => (
							<button
								key={skill.label}
								type="button"
								className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-2xs text-[var(--text-tertiary)] transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
								onClick={() => handleSuggestionClick(skill)}
							>
								{skill.label}
							</button>
						))}
					</div>

					<button
						type="button"
						onClick={() => openCommandPalette()}
						className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
						aria-label="Open command palette"
					>
						<kbd className="rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
							⌘K
						</kbd>
					</button>
				</form>
			</div>
		</footer>
	);
}
