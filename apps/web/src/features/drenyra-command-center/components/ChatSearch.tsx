/**
 * ChatSearch — Search panel for chat history in the Drenyra Command Center.
 *
 * Provides a search-as-you-type input with magnifying glass icon,
 * highlighted match previews, and role-based result items.
 *
 * @since Jun 2026
 */

import { Fragment, useEffect, useMemo, useRef } from "react";
import { Bot, Search, User, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchResult {
	messageId: string;
	role: "user" | "assistant" | "system";
	content: string;
	matchIndex: number;
}

export interface ChatSearchProps {
	results: SearchResult[];
	query: string;
	onQueryChange: (query: string) => void;
	onResultClick: (result: SearchResult) => void;
	onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface HighlightSegment {
	text: string;
	isMatch: boolean;
}

function highlightText(text: string, query: string): HighlightSegment[] {
	if (!query.trim()) return [{ text, isMatch: false }];

	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const parts = text.split(new RegExp(`(${escaped})`, "gi"));

	const lowerQuery = query.toLowerCase();
	return parts.map((part) => ({
		text: part,
		isMatch: part.toLowerCase() === lowerQuery,
	}));
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatSearch({
	results,
	query,
	onQueryChange,
	onResultClick,
	onClose,
}: ChatSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const resultElements = useMemo(
		() =>
			results.map((result) => {
				const segments = highlightText(result.content, query);
				return (
					<button
						key={`${result.messageId}-${result.matchIndex}`}
						type="button"
						onClick={() => onResultClick(result)}
						className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-2)] focus:outline-none focus:bg-[var(--surface-2)]"
					>
						<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)]">
							{result.role === "assistant" || result.role === "system" ? (
								<Bot size={14} className="text-[var(--color-info)]" />
							) : (
								<User size={14} className="text-[var(--text-secondary)]" />
							)}
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold text-[var(--text-primary)]">
								{result.role === "assistant" ? "Assistant" : result.role === "system" ? "Sistema" : "User"}
							</p>
							<p className="mt-0.5 line-clamp-2 text-2xs text-[var(--text-tertiary)] leading-relaxed">
								{segments.map((seg, i) =>
									seg.isMatch ? (
										<mark
											key={i}
											className="bg-[var(--color-warning)]/30 text-[var(--text-primary)] rounded-sm px-0.5"
										>
											{seg.text}
										</mark>
									) : (
										<Fragment key={i}>{seg.text}</Fragment>
									),
								)}
							</p>
						</div>
					</button>
				);
			}),
		[results, query, onResultClick],
	);

	return (
		<section className="w-80 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/95 shadow-lg backdrop-blur-xl">
			<div className="relative">
				<Search
					size={18}
					className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
					aria-hidden
				/>
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="Buscar en el historial..."
					className="h-12 w-full rounded-2xl border-0 bg-transparent pl-11 pr-11 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
					aria-label="Buscar en el historial de chat"
				/>
				<button
					type="button"
					onClick={onClose}
					className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Cerrar búsqueda"
				>
					<X size={16} />
				</button>
			</div>
			{results.length > 0 && (
				<div className="max-h-80 overflow-y-auto border-t border-[var(--border-subtle)]">
					{resultElements}
				</div>
			)}
			{query && results.length === 0 && (
				<p className="border-t border-[var(--border-subtle)] p-4 text-center text-xs text-[var(--text-tertiary)]">
					Sin resultados para &ldquo;{query}&rdquo;
				</p>
			)}
		</section>
	);
}
