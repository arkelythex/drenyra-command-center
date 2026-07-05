/**
 * VirtualizedMessageList — Wraps message bubbles with TanStack Virtual for
 * performant rendering of large chat histories.
 *
 * Only the message list is virtualized. Inline forms (New Case, Evidence),
 * approval UI, streaming indicator, and case details stay outside this
 * component and render in the parent's non-virtualized footer area.
 *
 * @since Jun 2026
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import { Bot, User } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type {
	CognitiveMessage,
	HubArtifact,
} from "@/features/cognitive-hub/types/hub.types";
import { ArtifactCollapsible, type DensityMode } from "./ArtifactCollapsible";

// ── Props ────────────────────────────────────────────────────────────────────

export interface VirtualizedMessageListProps {
	messages: CognitiveMessage[];
	densityMode: DensityMode;
	pinnedArtifactIds: Set<string>;
	onPin: (id: string) => void;
	onContextChange?: (ctx: {
		isStreaming: boolean;
		lastArtifact?: HubArtifact | null;
	}) => void;
	onCreateCase: (artifact: HubArtifact) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Approximate height for text-only messages (avatar + 2 lines + padding). */
const TEXT_ONLY_ESTIMATE = 80;

/** Approximate height for messages that contain artifact(s) when collapsed. */
const WITH_ARTIFACTS_ESTIMATE = 400;

/** Scroll snap distance from bottom (px) to consider user "at bottom". */
const NEAR_BOTTOM_THRESHOLD = 100;

/** How many off-screen items to render on each side. */
const OVERSCAN = 5;

// ── Component ────────────────────────────────────────────────────────────────

export function VirtualizedMessageList({
	messages,
	densityMode,
	pinnedArtifactIds,
	onPin,
	onContextChange,
	onCreateCase,
}: VirtualizedMessageListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const isNearBottomRef = useRef(true);

	// Stable reference to messages so estimateSize doesn't need to be recreated
	const messagesRef = useRef(messages);
	messagesRef.current = messages;

	// ── Virtualizer ──

	const estimateSize = useCallback((index: number) => {
		const msg = messagesRef.current[index];
		if (!msg) return TEXT_ONLY_ESTIMATE;
		return msg.artifacts && msg.artifacts.length > 0
			? WITH_ARTIFACTS_ESTIMATE
			: TEXT_ONLY_ESTIMATE;
	}, []);

	const virtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan: OVERSCAN,
		measureElement: (el) =>
			el?.getBoundingClientRect().height ?? TEXT_ONLY_ESTIMATE,
	});

	// ── Auto-scroll to bottom when new messages arrive ──

	useEffect(() => {
		if (isNearBottomRef.current && messages.length > 0) {
			virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
		}
	}, [messages.length, virtualizer]);

	// ── Track whether user is near the bottom ──

	const handleScroll = useCallback(() => {
		const el = parentRef.current;
		if (!el) return;
		const { scrollHeight, scrollTop, clientHeight } = el;
		isNearBottomRef.current =
			scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD;
	}, []);

	useEffect(() => {
		const el = parentRef.current;
		if (!el) return;
		el.addEventListener("scroll", handleScroll, { passive: true });
		return () => el.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

	// ── Render ──

	return (
		<div
			ref={parentRef}
			className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4"
			style={{ contain: "strict" }}
			role="log"
			aria-label="Mensajes del chat"
			aria-live="polite"
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					position: "relative",
				}}
			>
				{virtualizer.getVirtualItems().map((virtualItem) => {
					const msg = messages[virtualItem.index];
					return (
						<div
							key={virtualItem.key}
							data-index={virtualItem.index}
							ref={virtualizer.measureElement}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							<MessageBubbleRow
								msg={msg}
								densityMode={densityMode}
								pinnedArtifactIds={pinnedArtifactIds}
								onPin={onPin}
								onContextChange={onContextChange}
								onCreateCase={onCreateCase}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}

VirtualizedMessageList.displayName = "VirtualizedMessageList";

// ── Message Bubble Row ───────────────────────────────────────────────────────

/**
 * Extracted to avoid recreating the element tree for every virtual item
 * when the parent re-renders. Kept in the same file since it's tightly
 * coupled to the virtualizer usage.
 */
const MessageBubbleRow = ({
	msg,
	densityMode,
	pinnedArtifactIds,
	onPin,
	onContextChange,
	onCreateCase,
}: {
	msg: CognitiveMessage;
	densityMode: DensityMode;
	pinnedArtifactIds: Set<string>;
	onPin: (id: string) => void;
	onContextChange?: (ctx: {
		isStreaming: boolean;
		lastArtifact?: HubArtifact | null;
	}) => void;
	onCreateCase: (artifact: HubArtifact) => void;
}) => (
	<div className="pb-4">
		<div
			className={`flex gap-3 ${
				msg.role === "user" ? "flex-row-reverse" : "flex-row"
			}`}
		>
			{/* Avatar */}
			<div
				className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
					msg.role === "assistant"
						? "bg-[var(--color-info)]/20"
						: "bg-[var(--surface-3)]"
				}`}
			>
				{msg.role === "assistant" ? (
					<Bot
						size={14}
						className="text-[var(--color-info)]"
						aria-hidden="true"
					/>
				) : (
					<User
						size={14}
						className="text-[var(--text-secondary)]"
						aria-hidden="true"
					/>
				)}
			</div>

			{/* Bubble + artifacts */}
			<div
				className={`max-w-[85%] space-y-3 ${
					msg.role === "user" ? "items-end" : "items-start"
				}`}
			>
				{/* Text bubble */}
				{msg.content && (
					<div
						className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
							msg.role === "user"
								? "bg-[var(--color-info)]/15 text-[var(--text-primary)] rounded-tr-md"
								: "bg-[var(--surface-1)] text-[var(--text-primary)] rounded-tl-md"
						}`}
					>
						{msg.content}
					</div>
				)}

				{/* Artifacts */}
				{msg.artifacts && msg.artifacts.length > 0 && (
					<div className="space-y-3">
						{msg.artifacts.map((artifact) => (
							<ArtifactCollapsible
								key={artifact.id}
								artifact={artifact}
								density={densityMode}
								isPinned={pinnedArtifactIds.has(artifact.id)}
								onPin={onPin}
								onFocus={(a) =>
									onContextChange?.({ isStreaming: false, lastArtifact: a })
								}
								onCreateCase={onCreateCase}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	</div>
);

MessageBubbleRow.displayName = "MessageBubbleRow";
