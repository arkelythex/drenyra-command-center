import { useEffect } from "react";

interface UseSireDiffKeyboardShortcutsInput {
	enabled: boolean;
	selectedRowId: string | null;
	editingRowId: string | null;
	hasDraftForRow: (rowId: string) => boolean;
	onMoveSelection: (direction: "up" | "down") => void;
	onToggleInlineEditor: (rowId: string) => void;
	onSuggestInlineEdit: (rowId: string) => void;
	onApplyInlineEdit: (rowId: string) => void;
	onCloseInlineEditor: () => void;
}

export function useSireDiffKeyboardShortcuts({
	enabled,
	selectedRowId,
	editingRowId,
	hasDraftForRow,
	onMoveSelection,
	onToggleInlineEditor,
	onSuggestInlineEdit,
	onApplyInlineEdit,
	onCloseInlineEditor,
}: UseSireDiffKeyboardShortcutsInput) {
	useEffect(() => {
		if (!enabled) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (!selectedRowId) {
				return;
			}

			const target = event.target as HTMLElement | null;
			const isEditableTarget = isEditableElement(target);

			if (
				!isEditableTarget &&
				(event.key === "ArrowDown" || event.key === "j")
			) {
				event.preventDefault();
				onMoveSelection("down");
				return;
			}

			if (
				!isEditableTarget &&
				(event.key === "ArrowUp" || event.key === "k")
			) {
				event.preventDefault();
				onMoveSelection("up");
				return;
			}

			// Enter (without Ctrl) toggles selection/editor (REQ-E-003)
			if (
				!isEditableTarget &&
				event.key === "Enter" &&
				!(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault();
				onToggleInlineEditor(selectedRowId);
				return;
			}

			if (
				!isEditableTarget &&
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				onToggleInlineEditor(selectedRowId);
				return;
			}

			if (
				!isEditableTarget &&
				(event.metaKey || event.ctrlKey) &&
				event.key === "Enter" &&
				editingRowId === selectedRowId
			) {
				event.preventDefault();
				if (hasDraftForRow(selectedRowId)) {
					onApplyInlineEdit(selectedRowId);
					return;
				}
				onSuggestInlineEdit(selectedRowId);
				return;
			}

			if (
				!isEditableTarget &&
				event.key === "Escape" &&
				editingRowId === selectedRowId
			) {
				event.preventDefault();
				onCloseInlineEditor();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		editingRowId,
		enabled,
		hasDraftForRow,
		onApplyInlineEdit,
		onCloseInlineEditor,
		onMoveSelection,
		onSuggestInlineEdit,
		onToggleInlineEditor,
		selectedRowId,
	]);
}

function isEditableElement(target: HTMLElement | null): boolean {
	if (!target) {
		return false;
	}

	const tag = target.tagName.toLowerCase();
	if (tag === "input" || tag === "textarea" || tag === "select") {
		return true;
	}

	return target.isContentEditable;
}
