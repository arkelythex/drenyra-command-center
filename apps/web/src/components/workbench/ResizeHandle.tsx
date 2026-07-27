import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
	onResize: (deltaX: number) => void;
	/** Minimum pane width to enforce (default: 200) */
	minWidth?: number;
	/** Maximum pane width (default: 800) */
	maxWidth?: number;
	/** Current size of the adjacent pane */
	currentSize?: number;
}

/**
 * ResizeHandle — vertical resize handle between panes.
 *
 * 4px invisible hit area that shows a visible handle on hover.
 * Mouse drag resizes adjacent panes.
 * Shift+Arrow keyboard resizes by 10px increments.
 */
export function ResizeHandle({
	onResize,
	minWidth = 200,
	maxWidth = 800,
	currentSize,
}: ResizeHandleProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const startXRef = useRef(0);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			startXRef.current = e.clientX;
			setIsDragging(true);

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX = moveEvent.clientX - startXRef.current;
				startXRef.current = moveEvent.clientX;

				// Check bounds
				if (currentSize !== undefined) {
					const newSize = currentSize + deltaX;
					if (newSize < minWidth || newSize > maxWidth) return;
				}

				onResize(deltaX);
			};

			const handleMouseUp = () => {
				setIsDragging(false);
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
		},
		[onResize, minWidth, maxWidth, currentSize],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
				e.preventDefault();
				const delta = e.key === "ArrowRight" ? 10 : -10;
				onResize(delta);
			}
		},
		[onResize],
	);

	return (
		<button
			type="button"
			className={cn(
				"group relative flex w-1 cursor-col-resize flex-shrink-0 items-center justify-center",
				isDragging && "w-1",
			)}
			onMouseDown={handleMouseDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onKeyDown={handleKeyDown}
			aria-label="Redimensionar panel"
			tabIndex={0}
		>
			{/* Visible handle (appears on hover) */}
			<div
				className={cn(
					"h-8 w-0.5 rounded-full transition-all duration-150",
					isDragging || isHovered
						? "bg-[var(--color-primary)]/50 w-1"
						: "bg-transparent",
				)}
				aria-hidden={true}
			/>
		</button>
	);
}
