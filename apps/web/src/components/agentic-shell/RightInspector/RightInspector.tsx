"use client";

import { Suspense, lazy } from "react";
import { X } from "lucide-react";
import type { InspectorPanel } from "@/stores/agentic-shell.store";

const InspectorFiscalPanel = lazy(() =>
	import("./panels/InspectorFiscalPanel").then((m) => ({
		default: m.InspectorFiscalPanel,
	})),
);

interface RightInspectorProps {
	panel: InspectorPanel;
	onClose: () => void;
}

function PanelContent({ panel }: { panel: InspectorPanel }) {
	switch (panel.type) {
		case "fiscal":
			return <InspectorFiscalPanel id={panel.id} title={panel.title} />;
		case "thread":
			return (
				<div className="p-4 text-sm text-[var(--text-muted)]">
					Thread panel coming in Plan 2
				</div>
			);
		case "diff":
			return (
				<div className="p-4 text-sm text-[var(--text-muted)]">
					Diff panel coming in Plan 4
				</div>
			);
		case "agent":
			return (
				<div className="p-4 text-sm text-[var(--text-muted)]">
					Agent panel coming in Plan 3
				</div>
			);
		case "evidence":
			return (
				<div className="p-4 text-sm text-[var(--text-muted)]">
					Evidence panel coming in Plan 6
				</div>
			);
		default:
			return null;
	}
}

export function RightInspector({ panel, onClose }: RightInspectorProps) {
	return (
		<aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-[var(--border-default)] bg-[var(--surface-1)] animate-in slide-in-from-right duration-200">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
				<span className="truncate text-sm font-medium text-[var(--text-primary)]">
					{panel.title}
				</span>
				<button
					type="button"
					onClick={onClose}
					className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Close inspector"
				>
					<X size={14} />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<Suspense
					fallback={
						<div className="flex items-center justify-center py-12">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--color-primary)]" />
						</div>
					}
				>
					<PanelContent panel={panel} />
				</Suspense>
			</div>
		</aside>
	);
}
