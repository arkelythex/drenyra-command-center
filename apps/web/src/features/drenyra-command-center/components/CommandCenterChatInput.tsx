/**
 * CommandCenterChatInput — Input bar with file preview chips, paperclip
 * attachment, text input, and send button for the Drenyra Command Center chat.
 *
 * @since Jun 2026
 */

import { useTranslation } from "../i18n/i18n";
import { FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

	return (
		<div data-onboarding="input" className="border-t border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
			{/* File preview chips */}
			{selectedFiles.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-2">
					{selectedFiles.map((file, index) => (
						<span
							key={index}
							className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-2xs text-[var(--text-secondary)]"
						>
							<FileText size={12} className="text-[var(--color-info)]/60" aria-hidden="true" />
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
					Comandos disponibles: /compacto, /detalle, /solo-numeros, /rama, /simular, /clear, /help
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

				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={`${t("chat.placeholder")} (/compacto, /detalle, /solo-numeros, /rama)`}
					disabled={isStreaming}
					autoFocus
					className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5 text-sm outline-none ring-[var(--color-info)]/40 placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-info)]/50 focus:ring-2"
					aria-label="Comando fiscal conversacional"
					aria-describedby="chat-input-help"
				/>
				<Button
					onClick={onSend}
					disabled={(!input.trim() && selectedFiles.length === 0) || isStreaming}
					aria-label="Enviar mensaje"
				>
					<SendHorizontal size={16} aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
}
