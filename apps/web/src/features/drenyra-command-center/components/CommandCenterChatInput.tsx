/**
 * CommandCenterChatInput — Input bar with inline autocomplete (@ refs, / commands),
 * file preview chips, paperclip attachment, and send button.
 *
 * Cuando el usuario escribe @ o /, se despliega un menú flotante inline
 * con referencias fiscales (con IDs explícitos) o comandos ejecutables.
 *
 * @since Jul 2026
 */

import { FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "../i18n/i18n";
import {
	InlineAutocomplete,
	useAutocompleteState,
} from "./inline-autocomplete/InlineAutocomplete";

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatInputProps {
	input: string;
	isStreaming: boolean;
	selectedFiles: File[];
	inputRef: React.RefObject<HTMLInputElement | null>;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onInputChange: (value: string) => void;
	onSend: () => void;
	onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveFile: (index: number) => void;
	onPaperclipClick: () => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandCenterChatInput({
	input,
	isStreaming,
	selectedFiles,
	inputRef,
	fileInputRef,
	onInputChange,
	onSend,
	onFileSelect,
	onRemoveFile,
	onPaperclipClick,
	onKeyDown,
}: CommandCenterChatInputProps) {
	const { t } = useTranslation();

	// ── Cursor tracking for inline autocomplete ──
	const [cursorPos, setCursorPos] = useState(0);
	const [autocompleteOpen, setAutocompleteOpen] = useState(false);

	const handleSelect = useCallback(
		(insertValue: string, cursorTarget: number) => {
			if (!inputRef.current) return;

			const beforeTrigger = input.slice(0, cursorPos);
			const afterTrigger = input.slice(cursorPos);

			// Find where the trigger starts (walk backwards from cursor)
			const lastAtIndex = beforeTrigger.lastIndexOf("@");
			const lastSlashIndex = beforeTrigger.lastIndexOf("/");
			const triggerPos = Math.max(lastAtIndex, lastSlashIndex);

			if (triggerPos === -1) return;

			const newValue = `${input.slice(0, triggerPos) + insertValue} ${afterTrigger}`;
			onInputChange(newValue);

			// Set cursor position after the inserted value
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.selectionStart = cursorTarget + 1;
					inputRef.current.selectionEnd = cursorTarget + 1;
					inputRef.current.focus();
				}
			}, 0);

			setAutocompleteOpen(false);
		},
		[input, cursorPos, inputRef, onInputChange],
	);

	const handleClose = useCallback(() => {
		setAutocompleteOpen(false);
	}, []);

	// ── Detect autocomplete trigger ──
	const autocompleteState = useAutocompleteState(input, cursorPos);
	const showAutocomplete = autocompleteOpen && autocompleteState !== null;

	// ── Wrapped keydown handler (autocomplete intercepts first) ──
	const handleKeyDownCapture = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!autocompleteOpen && !autocompleteState) {
				// No autocomplete → forward to parent
				onKeyDown(e);
				return;
			}

			if (e.key === "Escape") {
				setAutocompleteOpen(false);
				e.preventDefault();
				return;
			}

			// ArrowUp/Down/Enter/Tab are handled by InlineAutocomplete's
			// global keyboard listener. Prevent default to avoid conflicts.
			if (
				["ArrowUp", "ArrowDown", "Enter", "Tab"].includes(e.key) &&
				autocompleteOpen
			) {
				e.preventDefault();
				return;
			}

			// Forward other keys to parent
			onKeyDown(e);
		},
		[autocompleteOpen, autocompleteState, onKeyDown],
	);

	// ── Cursor + input change tracking ──
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			const pos = e.target.selectionStart ?? newValue.length;
			setCursorPos(pos);

			// Detect @ or / trigger
			const before = newValue.slice(0, pos);
			const lastAtIndex = before.lastIndexOf("@");
			const lastSlashIndex = before.lastIndexOf("/");
			const triggerPos = Math.max(lastAtIndex, lastSlashIndex);

			// Open autocomplete if trigger exists and is the last token
			const afterTrigger = triggerPos >= 0 ? before.slice(triggerPos) : "";
			const isLastToken = triggerPos >= 0 && !afterTrigger.includes(" ");

			setAutocompleteOpen(isLastToken);

			onInputChange(newValue);
		},
		[onInputChange],
	);

	return (
		<div
			data-onboarding="input"
			className="relative border-t border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
		>
			{/* Inline autocomplete — posicionado sobre el input */}
			{showAutocomplete && (
				<InlineAutocomplete
					inputValue={input}
					cursorPos={cursorPos}
					onInsert={handleSelect}
					onClose={handleClose}
				/>
			)}

			{/* File preview chips */}
			{selectedFiles.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-2">
					{selectedFiles.map((file, index) => (
						<span
							key={index}
							className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-2xs text-[var(--text-secondary)]"
						>
							<FileText
								size={12}
								className="text-[var(--color-info)]/60"
								aria-hidden="true"
							/>
							<span className="max-w-[120px] truncate">{file.name}</span>
							<button
								type="button"
								onClick={() => onRemoveFile(index)}
								className="ml-0.5 rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
								aria-label={`Remover ${file.name}`}
							>
								<X size={12} aria-hidden="true" />
							</button>
						</span>
					))}
				</div>
			)}

			<div className="flex gap-2">
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					multiple
					onChange={onFileSelect}
					className="hidden"
					accept=".pdf,.xlsx,.xls,.csv,.jpg,.png,.xml"
					aria-label="Seleccionar archivos"
				/>

				<span id="chat-input-help" className="sr-only">
					Usá @ para referencias fiscales, / para comandos. Ej: @banco,
					/reconcile. Tab/Enter para autocompletar, Esc para cerrar.
				</span>

				{/* Paperclip button */}
				<button
					type="button"
					onClick={onPaperclipClick}
					disabled={isStreaming}
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] disabled:opacity-40 disabled:pointer-events-none"
					aria-label="Adjuntar archivos"
				>
					<Paperclip size={16} aria-hidden="true" />
				</button>

				{/* Main input con autocompletado inline */}
				<div className="relative flex-1">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={handleChange}
						onKeyDown={handleKeyDownCapture}
						onSelect={(e) => {
							const target = e.currentTarget;
							setCursorPos(target.selectionStart ?? target.value.length);
						}}
						placeholder={`${t("chat.placeholder")} (@ para referencias, / para comandos)`}
						disabled={isStreaming}
						autoFocus
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5 text-sm outline-none ring-[var(--color-info)]/40 placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-info)]/50 focus:ring-2"
						aria-label="Comando fiscal conversacional"
						aria-describedby="chat-input-help"
						aria-haspopup="listbox"
						aria-autocomplete="list"
					/>

					{/* Hint chips inside input area */}
					<div className="pointer-events-none absolute bottom-0 right-3 flex items-center gap-1">
						<span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
							@ref
						</span>
						<span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
							/cmd
						</span>
					</div>
				</div>

				<Button
					onClick={onSend}
					disabled={
						(!input.trim() && selectedFiles.length === 0) || isStreaming
					}
					aria-label="Enviar mensaje"
				>
					<SendHorizontal size={16} aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
}
