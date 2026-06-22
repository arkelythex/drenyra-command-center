import { ArrowUpRight, Mic } from "lucide-react";
import {
	type JSX,
	type KeyboardEvent as ReactKeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";
import { NeuralWave } from "./NeuralWave";
import { PlusToolsMenu } from "./plus-tools-menu";
import type { QuickCommand } from "./quick-commands";

interface PromptInputShellProps {
	value: string;
	disabled?: boolean;
	placeholder: string;
	commandHint: string;
	quickCommands: ReadonlyArray<QuickCommand>;
	filesCount: number;
	isRecording: boolean;
	amplitude: number[];
	isCommandPaletteActive: boolean;
	selectedIndex: number;
	suggestionListId: string;
	suggestionsCount: number;
	onChangeValue: (nextValue: string) => void;
	onOpenFilePicker: () => void;
	onQuickCommand: (command: string) => void;
	onFocus: () => void;
	onBlur: () => void;
	onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
	onStartRecording: () => void;
	onStopRecording: () => void;
}

export const PromptInputShell = ({
	value,
	disabled,
	placeholder,
	commandHint,
	quickCommands,
	filesCount,
	isRecording,
	amplitude,
	isCommandPaletteActive,
	selectedIndex,
	suggestionListId,
	suggestionsCount,
	onChangeValue,
	onOpenFilePicker,
	onQuickCommand,
	onFocus,
	onBlur,
	onKeyDown,
	onStartRecording,
	onStopRecording,
}: PromptInputShellProps): JSX.Element => {
	const [isToolsOpen, setIsToolsOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const focusComposer = () => {
			inputRef.current?.focus();
		};

		window.addEventListener("hub-focus-composer", focusComposer);
		return () =>
			window.removeEventListener("hub-focus-composer", focusComposer);
	}, []);

	const handleAttachFile = () => {
		setIsToolsOpen(false);
		onOpenFilePicker();
	};

	const handleRecordingAction = () => {
		setIsToolsOpen(false);
		if (isRecording) {
			onStopRecording();
			return;
		}
		onStartRecording();
	};

	const handleQuickCommand = (command: string) => {
		setIsToolsOpen(false);
		onQuickCommand(command);
	};

	return (
		<div
			className={cn(
				"relative z-20 flex min-h-[72px] items-center gap-2 rounded-[28px] border border-[var(--color-stroke-1)] bg-[var(--color-surface-1)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-5 transition-all duration-300 sm:min-h-[76px] sm:gap-4 sm:px-7",
				isCommandPaletteActive &&
					"ring-2 ring-[var(--border-prominent)] shadow-[0_20px_60px_rgba(0,0,0,0.15)]",
			)}
		>
			<PlusToolsMenu
				isOpen={isToolsOpen}
				isRecording={isRecording}
				quickCommands={quickCommands}
				commandHint={commandHint}
				onOpenChange={setIsToolsOpen}
				onAttachFile={handleAttachFile}
				onToggleRecording={handleRecordingAction}
				onQuickCommand={handleQuickCommand}
			/>

			<div className="relative flex flex-1 items-center gap-2">
				<input
					ref={inputRef}
					value={value}
					onFocus={onFocus}
					onBlur={onBlur}
					onKeyDown={onKeyDown}
					onChange={(event) => onChangeValue(event.target.value)}
					placeholder={placeholder}
					className="flex-1 border-none bg-transparent py-3 text-[16px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:ring-0 sm:text-lg"
					disabled={disabled}
					role="combobox"
					aria-label="Prompt de comando del enjambre"
					aria-autocomplete={value.startsWith("/") ? "list" : "none"}
					aria-expanded={suggestionsCount > 0}
					aria-controls={suggestionsCount > 0 ? suggestionListId : undefined}
					aria-activedescendant={
						selectedIndex >= 0
							? `${suggestionListId}-option-${selectedIndex}`
							: undefined
					}
				/>

				{/* Model Selector Badge (Codex Style) */}
				{!isRecording && value.length === 0 && (
					<div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 sm:flex cursor-pointer">
						<span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
						5.5 Medium
						<svg
							width="10"
							height="6"
							viewBox="0 0 10 6"
							fill="none"
							className="ml-0.5 opacity-60"
						>
							<path
								d="M1 1L5 5L9 1"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				)}
			</div>

			<div className="flex shrink-0 items-center gap-2 sm:gap-3">
				{isRecording ? (
					<button
						onClick={onStopRecording}
						type="button"
						className="cursor-pointer"
						aria-label="Detener grabación"
					>
						<NeuralWave amplitude={amplitude} isActive />
					</button>
				) : value.length > 0 || filesCount > 0 ? (
					<button
						type="submit"
						className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
						aria-label="Enviar prompt"
					>
						<ArrowUpRight size={20} strokeWidth={3} />
					</button>
				) : (
					<button
						type="button"
						onClick={onStartRecording}
						className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground"
						aria-label="Iniciar nota de voz"
					>
						<Mic size={18} strokeWidth={2.25} />
					</button>
				)}
			</div>
		</div>
	);
};
