import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NotificationSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Slide-in notification panel from the right.
 *
 * Displays recent activity and notifications for the current user.
 * Follows the same overlay pattern as the mobile sidebar.
 */
export function NotificationSidebar({
	isOpen,
	onClose,
}: NotificationSidebarProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	const handleEscape = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (!isOpen) return;
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, handleEscape]);

	useEffect(() => {
		if (!isOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Cerrar panel de notificaciones"
				className="fixed inset-0 z-[115] bg-black/20 lg:bg-black/10"
				onClick={onClose}
			/>

			{/* Panel */}
			<aside
				ref={panelRef}
				className={cn(
					"fixed inset-y-0 right-0 z-[120] w-full border-l border-[var(--border-subtle)]",
					"bg-[var(--surface-1)] shadow-2xl sm:w-[420px]",
					"flex flex-col overflow-hidden",
					"animate-in slide-in-from-right duration-300",
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Notificaciones y actividad"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
					<h2 className="text-sm font-semibold text-[var(--text-primary)]">
						Actividad
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
						aria-label="Cerrar panel de notificaciones"
					>
						<X size={16} strokeWidth={1.5} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto custom-scrollbar p-5">
					<div className="space-y-4">
						{/* Empty state placeholder */}
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
								<span className="text-lg">📭</span>
							</div>
							<p className="text-sm font-medium text-[var(--text-primary)]">
								Sin actividad reciente
							</p>
							<p className="mt-1 text-xs text-[var(--text-secondary)]">
								Las notificaciones de tu equipo aparecerán aquí
							</p>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="border-t border-[var(--border-subtle)] px-5 py-3">
					<p className="text-center text-xs text-[var(--text-secondary)]">
						Actividad de los últimos 30 días
					</p>
				</div>
			</aside>
		</>
	);
}
