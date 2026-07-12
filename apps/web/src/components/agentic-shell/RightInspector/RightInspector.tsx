import type { FC } from "react";
import type { RightInspectorProps } from "./RightInspector.types";

export const RightInspector: FC<RightInspectorProps> = ({
	isOpen,
	activePanel,
	panels,
	onClose,
	onPin,
}) => {
	if (!isOpen || !activePanel) return null;

	const panel = panels.find((p) => p.id === activePanel);
	if (!panel) return null;

	return (
		<aside className="flex h-full flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)]">
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
				<h3 className="text-sm font-medium">{panel.label}</h3>
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
						onClick={onPin}
						aria-label="Pin panel"
					>
						📌
					</button>
					<button
						type="button"
						className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
						onClick={onClose}
						aria-label="Close panel"
					>
						✕
					</button>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-4">{panel.component}</div>
		</aside>
	);
};
