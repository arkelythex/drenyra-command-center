/**
 * AgentMemoryList — Memory timeline list with loading/empty/data/error states.
 *
 * Wraps the timeline entry components with Card layout and handles all
 * visual states: loading skeleton, empty state, error state.
 */

"use client";

import { AlertTriangle, Brain, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemoryEntry } from "../AgentMemoryTab.types";
import { AgentMemoryTimelineEntry } from "./AgentMemoryTimeline";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ListSkeleton() {
	return (
		<div className="space-y-0">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="relative flex gap-4">
					<div className="flex shrink-0 flex-col items-center">
						<Skeleton className="h-3 w-3 rounded-full" />
						<div className="mt-0.5 h-full w-px bg-[var(--border-subtle)]" />
					</div>
					<div className="flex-1 pb-6">
						<Skeleton className="h-24 w-full rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function ListEmpty() {
	return (
		<div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
			<Brain className="h-10 w-10 text-[var(--text-tertiary)]" />
			<div>
				<p className="text-sm font-medium text-[var(--text-secondary)]">
					No memory timeline yet
				</p>
				<p className="mt-1 max-w-xs text-2xs text-[var(--text-tertiary)]">
					Once the AI Control Plane completes invoice processing runs, each run
					with a generated memory summary will appear here in chronological
					order.
				</p>
			</div>
		</div>
	);
}

// ─── Error State ─────────────────────────────────────────────────────────────

export interface AgentMemoryListErrorProps {
	onRetry: () => void;
}

export function AgentMemoryListError({ onRetry }: AgentMemoryListErrorProps) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-10 text-center">
			<AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
			<div>
				<p className="text-sm font-medium text-[var(--color-danger)]">
					Failed to load agent memory data
				</p>
				<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
					Ensure the AI Control Plane API is reachable.
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
				<RefreshCw className="h-3.5 w-3.5" />
				Retry
			</Button>
		</div>
	);
}

// ─── Main List ───────────────────────────────────────────────────────────────

export interface AgentMemoryListProps {
	entries: MemoryEntry[];
	isLoading: boolean;
}

export function AgentMemoryList({ entries, isLoading }: AgentMemoryListProps) {
	return (
		<Card variant="glass" padding="lg">
			<CardHeader className="mb-3">
				<div className="flex items-center gap-2">
					<Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
					<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
						Memory Timeline
					</CardTitle>
					{isLoading && (
						<span className="ml-auto text-2xs text-[var(--text-tertiary)]">
							Loading…
						</span>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<ListSkeleton />
				) : entries.length === 0 ? (
					<ListEmpty />
				) : (
					<div className="pl-1">
						{entries.map((entry, index) => (
							<AgentMemoryTimelineEntry
								key={entry.runId}
								entry={entry}
								index={index}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
