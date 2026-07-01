"use client";

import { Mic, ShieldCheck, Zap } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { getCommandSuggestions } from "@/features/cognitive-hub/logic/intent-parser";
import { cn } from "@/lib/utils";
import { ComposerControls } from "./ComposerControls";
import { ComposerSendButton } from "./ComposerSendButton";
import { SlashCommandMenu } from "./SlashCommandMenu";
import type { SuggestedAction } from "./SuggestedActions";
import { SuggestedActions } from "./SuggestedActions";
import { useSendFeedback } from "./useSendFeedback";

interface ComposerProps {
	onSend?: (
		message: string,
		mode: "local" | "worktree",
		yoloMode?: boolean,
	) => void;
	isSending?: boolean;
	sendError?: boolean;
	onFileUpload?: () => void;
}

type ComposerMode = "local" | "worktree";

export function Composer({
	onSend,
	isSending = false,
	sendError,
	onFileUpload,
}: ComposerProps) {
	const [message, setMessage] = useState("");
	const [mode, setMode] = useState<ComposerMode>("local");
	const [yoloMode, setYoloMode] = useState(false);
	const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
	const [isDragging, setIsDragging] = useState(false);
	const [showSlashMenu, setShowSlashMenu] = useState(false);
	const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { sendFeedback } = useSendFeedback(isSending, sendError);

	const hasMessage = message.trim().length > 0;

	const suggestions = useMemo(() => {
		if (!message.startsWith("/")) return [];
		return getCommandSuggestions(message);
	}, [message]);

	const showSlashOverlay = showSlashMenu && suggestions.length > 0;

	const toggleSkill = useCallback((skill: string) => {
		setActiveSkills((prev) => {
			const next = new Set(prev);
			if (next.has(skill)) next.delete(skill);
			else next.add(skill);
			return next;
		});
	}, []);

	const completeSlashCommand = useCallback(
		(index: number) => {
			const selected = suggestions[index];
			if (!selected) return;
			setMessage(`${selected.command} `);
			setShowSlashMenu(false);
			setSlashSelectedIndex(0);
			textareaRef.current?.focus();
		},
		[suggestions],
	);

	const handleSend = useCallback(() => {
		if (!hasMessage || isSending) return;
		setShowSlashMenu(false);
		onSend?.(message.trim(), mode, yoloMode);
		setMessage("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	}, [hasMessage, isSending, message, mode, yoloMode, onSend]);

	const handleSlashOverlayKey = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
			if (!showSlashOverlay) return false;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSlashSelectedIndex((prev) => (prev + 1) % suggestions.length);
					return true;
				case "ArrowUp":
					e.preventDefault();
					setSlashSelectedIndex(
						(prev) => (prev - 1 + suggestions.length) % suggestions.length,
					);
					return true;
				case "Escape":
					e.preventDefault();
					setShowSlashMenu(false);
					return true;
				case "Tab":
				case "Enter": {
					if (e.key === "Enter" && e.shiftKey) return false;
					e.preventDefault();
					completeSlashCommand(slashSelectedIndex);
					return true;
				}
				default:
					return false;
			}
		},
		[showSlashOverlay, suggestions, slashSelectedIndex, completeSlashCommand],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (handleSlashOverlayKey(e)) return;

			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSlashOverlayKey, handleSend],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const textarea = e.currentTarget;
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
			const value = textarea.value;
			setMessage(value);

			if (value.startsWith("/")) {
				setShowSlashMenu(true);
				setSlashSelectedIndex(0);
			} else if (showSlashMenu) {
				setShowSlashMenu(false);
			}
		},
		[showSlashMenu],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleSuggestedAction = useCallback(
		(action: SuggestedAction) => {
			if (action.action === "upload") {
				onFileUpload?.();
				return;
			}
			if (action.command) {
				setMessage(`${action.command} `);
				setShowSlashMenu(true);
				setSlashSelectedIndex(0);
				textareaRef.current?.focus();
			}
		},
		[onFileUpload],
	);

	return (
		<section
			className={cn(
				"relative border-t border-[var(--border-subtle)]",
				"bg-[var(--surface-1)]",
				"p-4",
				"focus-within:border-t-[var(--color-primary)]/20",
				"transition-all duration-200",
			)}
			aria-label="Composer"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{isDragging && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5">
					<span className="text-sm font-medium text-[var(--color-primary)]">
						Drop files here
					</span>
				</div>
			)}

			<div className="relative">
				{showSlashOverlay && (
					<SlashCommandMenu
						input={message}
						selectedIndex={slashSelectedIndex}
						onSelect={completeSlashCommand}
						onHover={setSlashSelectedIndex}
						onClose={() => setShowSlashMenu(false)}
					/>
				)}

				<div
					className={cn(
						"rounded-xl border border-[var(--border-subtle)]",
						"bg-[var(--surface-2)]",
						"focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 focus-within:shadow-sm focus-within:shadow-[var(--color-primary)]/5",
						"transition-all duration-300 ease-out",
					)}
				>
					<textarea
						ref={textareaRef}
						data-composer="true"
						value={message}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder="Message Drenyra..."
						disabled={isSending}
						rows={1}
						className={cn(
							"w-full resize-none bg-transparent",
							"px-4 py-3",
							"text-sm text-[var(--text-primary)]",
							"placeholder:text-[var(--text-muted)]",
							"outline-none",
							"max-h-[200px]",
							"disabled:opacity-50",
							"scrollbar-none",
						)}
					/>
				</div>
			</div>

			<div className="mt-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<ComposerControls
						mode={mode}
						onChangeMode={setMode}
						activeSkills={activeSkills}
						onToggleSkill={toggleSkill}
					/>

					{/* YOLO mode toggle: Manual vs Auto (approval bypass) */}
					<div
						className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5"
						role="tablist"
						title="Auto ejecuta aprobaciones de bajo riesgo sin confirmación manual"
					>
						<button
							type="button"
							role="tab"
							aria-selected={!yoloMode}
							onClick={() => setYoloMode(false)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-all",
								!yoloMode
									? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
									: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
							)}
						>
							<ShieldCheck size={14} className="-ml-0.5 mr-1 inline-block" />
							Manual
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={yoloMode}
							onClick={() => setYoloMode(true)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-all",
								yoloMode
									? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] shadow-sm"
									: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
							)}
						>
							<Zap size={14} className="-ml-0.5 mr-1 inline-block" />
							Auto
						</button>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{hasMessage && (
						<span className="hidden text-xs text-[var(--text-muted)] sm:inline">
							Cmd+Enter to send
						</span>
					)}

					<button
						type="button"
						disabled
						aria-label="Voice input (coming soon)"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-40"
						title="Voice input (coming soon)"
					>
						<Mic size={16} />
					</button>

					<ComposerSendButton
						hasMessage={hasMessage}
						isSending={isSending}
						sendFeedback={sendFeedback}
						onSend={handleSend}
					/>
				</div>
			</div>

			<SuggestedActions onAction={handleSuggestedAction} />
		</section>
	);
}
