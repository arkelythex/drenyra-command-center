import type { ChangeEvent, DragEvent, FormEvent, JSX, RefObject } from "react";
import { CommandSuggestionsPopover } from "./command-suggestions-popover";
import { DragOverlay } from "./drag-overlay";
import { FileTray } from "./file-tray";
import { HiddenFileInput } from "./hidden-file-input";
import { PromptInputShell } from "./prompt-input-shell";
import type { QuickCommand } from "./quick-commands";
import type { CommandSuggestion } from "./unified-input.types";

interface PromptComposerSupportProps {
	amplitude: number[];
	disabled?: boolean;
	placeholder: string;
	commandHint: string;
	quickCommands: ReadonlyArray<QuickCommand>;
	files: File[];
	fileInputRef: RefObject<HTMLInputElement | null>;
	isCommandPaletteActive: boolean;
	isDragging: boolean;
	isRecording: boolean;
	selectedIndex: number;
	suggestionListId: string;
	suggestions: CommandSuggestion[];
	value: string;
	onBlur: () => void;
	onChangeValue: (nextValue: string) => void;
	onDragLeave: () => void;
	onDragOver: (event: DragEvent<HTMLFormElement>) => void;
	onDrop: (event: DragEvent<HTMLFormElement>) => void;
	onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onFocus: () => void;
	onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	onOpenFilePicker: () => void;
	onQuickCommand: (command: string) => void;
	onRemoveFile: (index: number) => void;
	onSelectSuggestion: (command: string) => void;
	onStartRecording: () => void;
	onStopRecording: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onSuggestionHover: (index: number) => void;
}

export function PromptComposerSupport({
	amplitude,
	disabled,
	placeholder,
	commandHint,
	quickCommands,
	files,
	fileInputRef,
	isCommandPaletteActive,
	isDragging,
	isRecording,
	selectedIndex,
	suggestionListId,
	suggestions,
	value,
	onBlur,
	onChangeValue,
	onDragLeave,
	onDragOver,
	onDrop,
	onFileInputChange,
	onFocus,
	onKeyDown,
	onOpenFilePicker,
	onQuickCommand,
	onRemoveFile,
	onSelectSuggestion,
	onStartRecording,
	onStopRecording,
	onSubmit,
	onSuggestionHover,
}: PromptComposerSupportProps): JSX.Element {
	return (
		<form
			onSubmit={onSubmit}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className="relative"
		>
			<DragOverlay isVisible={isDragging} />

			<FileTray files={files} onRemove={onRemoveFile} />

			<CommandSuggestionsPopover
				suggestions={suggestions}
				selectedIndex={selectedIndex}
				suggestionListId={suggestionListId}
				onSelect={onSelectSuggestion}
				onHoverIndex={onSuggestionHover}
			/>

			<HiddenFileInput inputRef={fileInputRef} onChange={onFileInputChange} />

			<PromptInputShell
				value={value}
				disabled={disabled}
				placeholder={placeholder}
				commandHint={commandHint}
				quickCommands={quickCommands}
				filesCount={files.length}
				isRecording={isRecording}
				amplitude={amplitude}
				isCommandPaletteActive={isCommandPaletteActive}
				selectedIndex={selectedIndex}
				suggestionListId={suggestionListId}
				suggestionsCount={suggestions.length}
				onChangeValue={onChangeValue}
				onOpenFilePicker={onOpenFilePicker}
				onQuickCommand={onQuickCommand}
				onFocus={onFocus}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				onStartRecording={onStartRecording}
				onStopRecording={onStopRecording}
			/>
		</form>
	);
}
