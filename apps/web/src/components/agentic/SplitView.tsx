"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCentralBoardStore } from "@/stores/central-board-store";

interface SplitViewProps {
	left: React.ReactNode;
	right: React.ReactNode;
	defaultRatio?: number;
	minLeft?: number;
	minRight?: number;
	className?: string;
}

/**
 * SplitView — Resizable horizontal split pane.
 * Draggable divider between left and right children.
 * Ratio is persisted in central-board-store.
 */
export function SplitView({
	left,
	right,
	defaultRatio = 0.5,
	minLeft = 400,
	minRight = 320,
	className,
}: SplitViewProps) {
	const storedRatio = useCentralBoardStore((s) => s.splitRatio);
	const setSplitRatio = useCentralBoardStore((s) => s.setSplitRatio);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [localRatio, setLocalRatio] = useState<number | null>(null);

	const ratio = localRatio ?? storedRatio ?? defaultRatio;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			setIsDragging(true);

			const onMouseMove = (moveEvent: MouseEvent) => {
				if (!containerRef.current) return;
				const rect = containerRef.current.getBoundingClientRect();
				const x = moveEvent.clientX - rect.left;
				const raw = x / rect.width;
				const clamped = Math.max(
					minLeft / rect.width,
					Math.min(1 - minRight / rect.width, raw),
				);
				setLocalRatio(clamped);
			};

			const onMouseUp = () => {
				setIsDragging(false);
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";

				// Persist final ratio
				setLocalRatio((current) => {
					if (current !== null) {
						setSplitRatio(current);
					}
					return current;
				});
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
		},
		[minLeft, minRight, setSplitRatio],
	);

	const handleDoubleClick = useCallback(() => {
		setLocalRatio(defaultRatio);
		setSplitRatio(defaultRatio);
	}, [defaultRatio, setSplitRatio]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn("flex h-full w-full overflow-hidden", className)}
		>
			{/* Left pane */}
			<div
				className="h-full overflow-hidden"
				style={{ width: `${ratio * 100}%` }}
			>
				{left}
			</div>

			{/* Divider */}
			<div
				className={cn(
					"relative flex-shrink-0 cursor-col-resize",
					"w-1 transition-colors duration-150",
					isDragging
						? "bg-[var(--color-primary)]/40"
						: "bg-[var(--border-subtle)] hover:bg-[var(--color-primary)]/20",
				)}
				onMouseDown={handleMouseDown}
				onDoubleClick={handleDoubleClick}
			>
				{/* Invisible wider hit area */}
				<div className="absolute inset-y-0 -left-1 -right-1" />
			</div>

			{/* Right pane */}
			<div className="h-full flex-1 overflow-hidden">{right}</div>
		</div>
	);
}
