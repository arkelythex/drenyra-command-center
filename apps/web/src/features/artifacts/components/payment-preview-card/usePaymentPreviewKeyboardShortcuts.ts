import { useEffect } from "react";

interface UsePaymentPreviewKeyboardShortcutsInput {
	enabled: boolean;
	selectedBeneficiaryId: string | null;
	editingBeneficiaryId: string | null;
	hasDraft: (beneficiaryId: string) => boolean;
	onMoveSelection: (direction: "up" | "down") => void;
	onToggleInlineEditor: (beneficiaryId: string) => void;
	onSuggestInlineEdit: (beneficiaryId: string) => void;
	onApplyInlineEdit: (beneficiaryId: string) => void;
	onCloseInlineEditor: () => void;
}

export function usePaymentPreviewKeyboardShortcuts({
	enabled,
	selectedBeneficiaryId,
	editingBeneficiaryId,
	hasDraft,
	onMoveSelection,
	onToggleInlineEditor,
	onSuggestInlineEdit,
	onApplyInlineEdit,
	onCloseInlineEditor,
}: UsePaymentPreviewKeyboardShortcutsInput) {
	useEffect(() => {
		if (!enabled) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (!selectedBeneficiaryId) return;

			const target = event.target as HTMLElement | null;
			const isEditableTarget = isEditableElement(target);

			if (!isEditableTarget && event.key === "ArrowDown") {
				event.preventDefault();
				onMoveSelection("down");
				return;
			}

			if (!isEditableTarget && event.key === "ArrowUp") {
				event.preventDefault();
				onMoveSelection("up");
				return;
			}

			if (
				!isEditableTarget &&
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k"
			) {
				event.preventDefault();
				onToggleInlineEditor(selectedBeneficiaryId);
				return;
			}

			if (
				!isEditableTarget &&
				(event.metaKey || event.ctrlKey) &&
				event.key === "Enter" &&
				editingBeneficiaryId === selectedBeneficiaryId
			) {
				event.preventDefault();
				if (hasDraft(selectedBeneficiaryId)) {
					onApplyInlineEdit(selectedBeneficiaryId);
					return;
				}
				onSuggestInlineEdit(selectedBeneficiaryId);
				return;
			}

			if (
				!isEditableTarget &&
				event.key === "Escape" &&
				editingBeneficiaryId === selectedBeneficiaryId
			) {
				event.preventDefault();
				onCloseInlineEditor();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		editingBeneficiaryId,
		enabled,
		hasDraft,
		onApplyInlineEdit,
		onCloseInlineEditor,
		onMoveSelection,
		onSuggestInlineEdit,
		onToggleInlineEditor,
		selectedBeneficiaryId,
	]);
}

function isEditableElement(target: HTMLElement | null): boolean {
	if (!target) return false;

	const tag = target.tagName.toLowerCase();
	if (tag === "input" || tag === "textarea" || tag === "select") {
		return true;
	}

	return target.isContentEditable;
}
