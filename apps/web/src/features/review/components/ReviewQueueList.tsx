"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { ConfidenceBadge } from "@/components/agentic/ConfidenceBadge";
import { cn, n } from "@/lib/utils";
import type { ReviewItem } from "../types/review.types";

interface ReviewQueueListProps {
	items: ReviewItem[];
	selectedItemId: string | null;
	onSelect: (item: ReviewItem) => void;
	onItemIntent?: (item: ReviewItem) => void;
}

export function ReviewQueueList({
	items,
	selectedItemId,
	onSelect,
	onItemIntent,
}: ReviewQueueListProps): ReactElement {
	return (
		<div className="flex w-1/3 flex-col overflow-hidden border-r border-[var(--border-default)] bg-[var(--bg-0)]">
			<div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-1)] p-4">
				<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
					Cola de trabajo ({items.length})
				</span>
				<div className="flex gap-1">
					<div className="rounded-full bg-warning-muted px-2 py-0.5 text-3xs font-bold text-warning">
						{items.filter((item) => item.status === "conflict").length}{" "}
						conflictos
					</div>
				</div>
			</div>

			<div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
				{items.map((item) => (
					<motion.button
						key={item.id}
						type="button"
						onClick={() => onSelect(item)}
						onPointerEnter={() => onItemIntent?.(item)}
						onFocus={() => onItemIntent?.(item)}
						layoutId={item.id}
						className={cn(
							"group relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-[background-color,border-color,box-shadow] duration-200",
							selectedItemId === item.id
								? "border-[var(--border-default)] bg-black/10 dark:bg-white/10 shadow-sm"
								: "border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
						)}
					>
						<div className="mb-3 flex items-start justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5">
									<FileText size={16} className="text-muted-foreground" />
								</div>
								<div>
									<p className="w-32 truncate text-xs font-bold">
										{item.filename}
									</p>
									<p className="font-mono text-3xs text-muted-foreground">
										{item.date}
									</p>
								</div>
							</div>
							<ConfidenceBadge score={item.confidence} />
						</div>

						<div className="flex items-end justify-between">
							<p className="font-mono text-lg font-black tracking-tighter tabular-nums">
								{n(item.amount)}
							</p>
							<div className="flex items-center gap-1.5">
								{item.confidence > 0.9 ? (
									<CheckCircle2 size={12} className="text-success" />
								) : (
									<AlertTriangle size={12} className="text-warning" />
								)}
								<span className="text-3xs font-black uppercase tracking-widest opacity-40">
									{item.confidence > 0.9 ? "Auto-validado" : "Requiere ojo"}
								</span>
							</div>
						</div>

						{selectedItemId === item.id ? (
							<motion.div
								layoutId="active-indicator"
								className="absolute inset-y-0 right-0 w-1 bg-primary"
							/>
						) : null}
					</motion.button>
				))}
			</div>
		</div>
	);
}
