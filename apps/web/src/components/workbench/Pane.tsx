import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PaneProps {
	id: string;
	label: string;
	children: ReactNode;
	onClose?: () => void;
	className?: string;
	/** Minimum width in px (default: 200) */
	minWidth?: number;
	/** Whether this pane can be closed (default: true) */
	closable?: boolean;
	/** Optional header action element */
	headerAction?: ReactNode;
}

/**
 * Pane — a single pane in the workspace layout.
 *
 * Renders a header with label and close button,
 * and a flexible content area below.
 * Respects minWidth for resize constraints.
 */
export function Pane({
	id,
	label,
	children,
	onClose,
	className,
	minWidth = 200,
	closable = true,
	headerAction,
}: PaneProps) {
	return (
		<div
			className={cn(
				"relative flex min-h-0 flex-col overflow-hidden",
				className,
			)}
			data-pane-id={id}
			style={{ minWidth: `${minWidth}px` }}
		>
			{/* Pane header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5">
				<span className="truncate text-xs font-medium text-[var(--text-secondary)]">
					{label}
				</span>
				<div className="flex items-center gap-1">
					{headerAction}
					{closable && onClose && (
						<button
							type="button"
							onClick={onClose}
							className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
							aria-label={`Cerrar ${label}`}
						>
							<X size={12} />
						</button>
					)}
				</div>
			</div>

			{/* Pane content */}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
