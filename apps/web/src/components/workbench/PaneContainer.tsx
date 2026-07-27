import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { PaneConfig } from "@drenyra/domain";
import { Pane } from "./Pane";
import { ResizeHandle } from "./ResizeHandle";

interface PaneContainerProps {
	panes: PaneConfig[];
	renderPane: (config: PaneConfig) => ReactNode;
	onPaneClose?: (id: string) => void;
	onPanesResized?: (panes: PaneConfig[]) => void;
	onPanesReordered?: (panes: PaneConfig[]) => void;
	storageKey?: string;
}

const STORAGE_DEBOUNCE_MS = 500;

export function PaneContainer({
	panes,
	renderPane,
	onPaneClose,
	onPanesResized,
	onPanesReordered,
	storageKey,
}: PaneContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [localPanes, setLocalPanes] = useState<PaneConfig[]>(panes);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	useEffect(() => {
		setLocalPanes(panes);
	}, [panes]);

	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const persistLayout = useCallback(
		(paneList: PaneConfig[]) => {
			if (!storageKey) return;
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			saveTimerRef.current = setTimeout(() => {
				try {
					localStorage.setItem(
						`drenyra:layout:${storageKey}`,
						JSON.stringify(paneList),
					);
				} catch {
					// silent no-op
				}
			}, STORAGE_DEBOUNCE_MS);
		},
		[storageKey],
	);

	const handleResize = useCallback(
		(paneIndex: number) => (deltaX: number) => {
			setLocalPanes((prev) => {
				if (paneIndex < 0 || paneIndex >= prev.length - 1) return prev;
				const left = prev[paneIndex];
				const right = prev[paneIndex + 1];
				if (!left || !right) return prev;
				const updated = [...prev];
				updated[paneIndex] = {
					...left,
					size: Math.max(left.minSize, left.size + deltaX),
				};
				updated[paneIndex + 1] = {
					...right,
					size: Math.max(right.minSize, right.size - deltaX),
				};
				persistLayout(updated);
				onPanesResized?.(updated);
				return updated;
			});
		},
		[persistLayout, onPanesResized],
	);

	const handleClose = useCallback(
		(paneId: string) => {
			setLocalPanes((prev) => {
				const updated = prev.filter((p) => p.id !== paneId);
				persistLayout(updated);
				onPanesReordered?.(updated);
				return updated;
			});
			onPaneClose?.(paneId);
		},
		[onPaneClose, persistLayout, onPanesReordered],
	);

	// Drag & Drop handlers
	const handleDragStart = useCallback((index: number) => {
		setDragIndex(index);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
		e.preventDefault();
		setDragOverIndex(index);
	}, []);

	const handleDrop = useCallback(
		(index: number) => {
			if (dragIndex === null || dragIndex === index) {
				setDragIndex(null);
				setDragOverIndex(null);
				return;
			}
			setLocalPanes((prev) => {
				const updated = [...prev];
				const removed = updated.splice(dragIndex, 1);
				const moved = removed[0];
				if (!moved) return prev;
				updated.splice(index, 0, moved);
				persistLayout(updated);
				onPanesReordered?.(updated);
				return updated;
			});
			setDragIndex(null);
			setDragOverIndex(null);
		},
		[dragIndex, persistLayout, onPanesReordered],
	);

	const handleDragEnd = useCallback(() => {
		setDragIndex(null);
		setDragOverIndex(null);
	}, []);

	return (
		<div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
			{localPanes.map((config, index) => {
				const isDraggedOver = dragOverIndex === index && dragIndex !== index;

				return (
					<section
						key={config.id}
						className={`flex min-h-0 transition-all duration-150 ${
							isDraggedOver ? "border-l-2 border-[var(--color-primary)]" : ""
						}`}
						style={{
							flex: `${config.size} ${config.size} ${config.minSize}px`,
							minWidth: `${config.minSize}px`,
						}}
						draggable
						onDragStart={() => handleDragStart(index)}
						onDragOver={(e) => handleDragOver(e, index)}
						onDrop={() => handleDrop(index)}
						onDragEnd={handleDragEnd}
						aria-label={config.label}
					>
						<Pane
							id={config.id}
							label={config.label}
							onClose={() => handleClose(config.id)}
							minWidth={config.minSize}
							closable={config.position !== "center"}
						>
							{renderPane(config)}
						</Pane>
					</section>
				);
			})}

			{localPanes.map((config, paneIndex) => {
				if (paneIndex === localPanes.length - 1) return null;
				const pane = localPanes[paneIndex];
				return (
					<ResizeHandle
						key={`resize-${config.id}`}
						onResize={handleResize(paneIndex)}
						minWidth={pane?.minSize ?? 200}
						currentSize={pane?.size ?? 260}
					/>
				);
			})}
		</div>
	);
}
