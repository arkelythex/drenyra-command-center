import {
	type ChangeEvent,
	type DragEvent,
	type FormEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

/* ------------------------------------------------------------------ */
/*  Prompt input state — consolidated from 3 previously separate hooks */
/* ------------------------------------------------------------------ */

interface UsePromptInputOptions {
	value: string;
	disabled?: boolean;
	isRecording: boolean;
	suggestionsCount: number;
	onSend: (content: string, files?: File[]) => void;
	onAfterSend: () => void;
	onCommandModeChange?: (isActive: boolean) => void;
	takeSelectedCommand: () => string | null;
}

interface UsePromptInputResult {
	// File state
	files: File[];
	isDragging: boolean;
	fileInputRef: RefObject<HTMLInputElement | null>;
	clearFiles: () => void;
	handleDragLeave: () => void;
	handleDragOver: (event: DragEvent<HTMLFormElement>) => void;
	handleDrop: (event: DragEvent<HTMLFormElement>) => void;
	handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
	openFilePicker: () => void;
	removeFileAt: (index: number) => void;
	// Composer state
	isCommandPaletteActive: boolean;
	shouldDimChatBackdrop: boolean;
	handleBlur: () => void;
	handleFocus: () => void;
	// Submission
	handleSend: (content: string, selectedFiles?: File[]) => void;
	handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function usePromptInput({
	value,
	disabled = false,
	isRecording,
	suggestionsCount,
	onSend,
	onAfterSend,
	onCommandModeChange,
	takeSelectedCommand,
}: UsePromptInputOptions): UsePromptInputResult {
	/* ---------- Files ---------- */
	const [files, setFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const appendFiles = useCallback((incomingFiles: File[]) => {
		if (incomingFiles.length === 0) return;
		setFiles((prev) => [...prev, ...incomingFiles]);
	}, []);

	const openFilePicker = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			appendFiles(Array.from(event.target.files ?? []));
			event.target.value = "";
		},
		[appendFiles],
	);

	const handleDragOver = useCallback((event: DragEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLFormElement>) => {
			event.preventDefault();
			setIsDragging(false);
			appendFiles(Array.from(event.dataTransfer.files));
		},
		[appendFiles],
	);

	const removeFileAt = useCallback((index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const clearFiles = useCallback(() => {
		setFiles([]);
	}, []);

	/* ---------- Composer state ---------- */
	const [isFocused, setIsFocused] = useState(false);

	const isCommandPaletteActive =
		isFocused ||
		isRecording ||
		value.trim().length > 0 ||
		files.length > 0 ||
		suggestionsCount > 0;

	const shouldDimChatBackdrop = suggestionsCount > 0;

	useEffect(() => {
		onCommandModeChange?.(isCommandPaletteActive);
	}, [isCommandPaletteActive, onCommandModeChange]);

	const handleBlur = useCallback(() => setIsFocused(false), []);
	const handleFocus = useCallback(() => setIsFocused(true), []);

	/* ---------- Submission ---------- */
	const handleSend = useCallback(
		(content: string, selectedFiles?: File[]) => {
			onSend(content, selectedFiles);
			onAfterSend();
		},
		[onAfterSend, onSend],
	);

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			const selectedCommand = takeSelectedCommand();
			if (selectedCommand) {
				handleSend(selectedCommand);
				return;
			}

			if ((!value.trim() && files.length === 0) || disabled) return;

			handleSend(value, files);
		},
		[disabled, files, handleSend, takeSelectedCommand, value],
	);

	return {
		// Files
		files,
		isDragging,
		fileInputRef,
		clearFiles,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		handleInputChange,
		openFilePicker,
		removeFileAt,
		// Composer
		isCommandPaletteActive,
		shouldDimChatBackdrop,
		handleBlur,
		handleFocus,
		// Submission
		handleSend,
		handleSubmit,
	};
}
