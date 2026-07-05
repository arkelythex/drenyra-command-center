"use client";

import { Mic, ShieldCheck, Zap } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { getCommandSuggestions } from "@/features/cognitive-hub/logic/intent-parser";
import {
	InlineAutocomplete,
	useAutocompleteState,
} from "@/features/drenyra-command-center/components/inline-autocomplete/InlineAutocomplete";
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
		mode: "consulta" | "periodo",
		yoloMode?: boolean,
	) => void;
	isSending?: boolean;
	sendError?: boolean;
	onFileUpload?: () => void;
}

type ComposerMode = "consulta" | "periodo";

export function Composer({
	onSend,
	isSending = false,
	sendError,
	onFileUpload,
}: ComposerProps) {
	const [message, setMessage] = useState("");
	const [mode, setMode] = useState<ComposerMode>("consulta");
	const [yoloMode, setYoloMode] = useState(false);
	const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
	const [isDragging, setIsDragging] = useState(false);
	const [showSlashMenu, setShowSlashMenu] = useState(false);
	const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
	const [autocompleteOpen, setAutocompleteOpen] = useState(false);
	const [cursorPos, setCursorPos] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { sendFeedback } = useSendFeedback(isSending, sendError);

	const hasMessage = message.trim().length > 0;

	const suggestions = useMemo(() => {
		if (!message.startsWith("/")) return [];
		return getCommandSuggestions(message);
	}, [message]);

	const showSlashOverlay = showSlashMenu && suggestions.length > 0;
	const autocompleteState = useAutocompleteState(message, cursorPos);
	const showAutocomplete =
		autocompleteOpen && autocompleteState?.trigger === "@";

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

	const handleAutocompleteInsert = useCallback(
		(insertValue: string, cursorTarget: number) => {
			if (!textareaRef.current) return;
			const before = message.slice(0, cursorPos);
			const after = message.slice(cursorPos);
			const lastAtIndex = before.lastIndexOf("@");
			const lastSlashIndex = before.lastIndexOf("/");
			const triggerPos = Math.max(lastAtIndex, lastSlashIndex);
			if (triggerPos === -1) return;
			const newValue = message.slice(0, triggerPos) + insertValue + " " + after;
			setMessage(newValue);
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.selectionStart = cursorTarget + 1;
					textareaRef.current.selectionEnd = cursorTarget + 1;
					textareaRef.current.focus();
				}
			}, 0);
			setAutocompleteOpen(false);
		},
		[message, cursorPos],
	);

	const handleSend = useCallback(() => {
		if (!hasMessage || isSending) return;
		setShowSlashMenu(false);
		setAutocompleteOpen(false);
		onSend?.(message.trim(), mode, yoloMode);
		setMessage("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	}, [hasMessage, isSending, message, mode, yoloMode, onSend]);

	const handleSlashOverlayKey = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
			// Si el autocomplete @ está abierto, no interceptar
			if (showAutocomplete) return false;
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
		[
			showSlashOverlay,
			showAutocomplete,
			suggestions,
			slashSelectedIndex,
			completeSlashCommand,
		],
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
			const pos = textarea.selectionStart ?? value.length;
			setCursorPos(pos);
			setMessage(value);

			// Detectar trigger @ o /
			const before = value.slice(0, pos);
			const atPos = before.lastIndexOf("@");
			const slashPos = before.lastIndexOf("/");
			const triggerPos = Math.max(atPos, slashPos);
			const afterTrigger = triggerPos >= 0 ? before.slice(triggerPos) : "";
			const hasSpace = afterTrigger.includes(" ");

			if (atPos >= 0 && !hasSpace) {
				setAutocompleteOpen(true);
				setShowSlashMenu(false);
			} else if (value.startsWith("/")) {
				setShowSlashMenu(true);
				setAutocompleteOpen(false);
				setSlashSelectedIndex(0);
			} else {
				setShowSlashMenu(false);
				setAutocompleteOpen(false);
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
						Soltá archivos acá
					</span>
				</div>
			)}

			<div className="relative">
				{showAutocomplete && autocompleteState && (
					<InlineAutocomplete
						inputValue={message}
						cursorPos={cursorPos}
						onInsert={handleAutocompleteInsert}
						onClose={() => setAutocompleteOpen(false)}
					/>
				)}
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
						placeholder="Escribí un mensaje..."
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
							Enter para enviar
						</span>
					)}

					<button
						type="button"
						disabled
						aria-label="Entrada de voz (próximamente)"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-40"
						title="Entrada de voz (próximamente)"
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
