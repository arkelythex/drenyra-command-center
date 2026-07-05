"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComplianceActivityItem } from "./data";

interface ComplianceSidebarProps {
	activity: readonly ComplianceActivityItem[];
	syncStats: {
		totalDocuments: number;
		activeContributors: number;
		noHabidoContributors: number;
	};
}

export function ComplianceSidebar({
	activity,
	syncStats,
}: ComplianceSidebarProps): JSX.Element {
	return (
		<aside className="space-y-6">
			<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
				<CardHeader className="border-b border-[var(--border-subtle)] px-5 py-4">
					<CardTitle>System context</CardTitle>
					<CardDescription>
						Metricas secundarias para decidir con mas contexto.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 p-5">
					<MiniMetric
						label="Documentos"
						value={String(syncStats.totalDocuments)}
					/>
					<MiniMetric
						label="Activos"
						value={String(syncStats.activeContributors)}
					/>
					<MiniMetric
						label="No habidos"
						value={String(syncStats.noHabidoContributors)}
					/>
				</CardContent>
			</Card>

			<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
				<CardHeader className="border-b border-[var(--border-subtle)] px-5 py-4">
					<CardTitle>Actividad reciente</CardTitle>
					<CardDescription>
						Eventos que impactan el control regulatorio.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-5">
					{activity.map((item) => (
						<div
							key={`${item.time}-${item.title}`}
							className="flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-4 py-3.5"
						>
							<div className="mt-1 flex flex-col items-center">
								<span
									className={cn(
										"h-2.5 w-2.5 rounded-full",
										item.tone === "success"
											? "ui-dot-success"
											: item.tone === "warning"
												? "ui-dot-warning"
												: "ui-dot-info",
									)}
								/>
								<span className="mt-2 font-mono text-label text-[var(--text-tertiary)]">
									{item.time}
								</span>
							</div>
							<div className="min-w-0 space-y-1">
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									{item.title}
								</p>
								<p className="text-sm leading-6 text-[var(--text-secondary)]">
									{item.detail}
								</p>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</aside>
	);
}

function MiniMetric({
	label,
	value,
}: {
	label: string;
	value: string;
}): JSX.Element {
	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4">
			<p className="text-label font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
				{label}
			</p>
			<p className="mt-2 font-mono text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
				{value}
			</p>
		</div>
	);
}
