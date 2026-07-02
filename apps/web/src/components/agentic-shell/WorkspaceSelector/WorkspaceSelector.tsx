"use client";

import { useState } from "react";
import { Building2, ChevronDown, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { DEFAULT_PERIODS, DEFAULT_MOCK_ORGS } from "./WorkspaceSelector.data";
import type { WorkspaceSelectorProps } from "./WorkspaceSelector.types";

export function WorkspaceSelector({
	compact = false,
	className,
}: WorkspaceSelectorProps) {
	const { workspace, setWorkspace } = useAgenticShell();
	const [isOrgOpen, setOrgOpen] = useState(false);
	const [isPeriodOpen, setPeriodOpen] = useState(false);

	const currentOrg = workspace
		? {
				id: workspace.organizationId,
				name: workspace.organizationName,
				ruc: workspace.ruc,
			}
		: DEFAULT_MOCK_ORGS[0];

	const currentPeriod = workspace?.period ?? "2026-06";

	const handleOrgSelect = (id: string, name: string, ruc: string) => {
		setWorkspace({
			organizationId: id,
			organizationName: name,
			ruc,
			period: currentPeriod,
		});
		setOrgOpen(false);
	};

	const handlePeriodSelect = (period: string) => {
		if (workspace) {
			setWorkspace({ ...workspace, period });
		}
		setPeriodOpen(false);
	};

	if (compact) {
		return (
			<div className={cn("relative", className)}>
				<button
					type="button"
					onClick={() => setOrgOpen(!isOrgOpen)}
					className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
				>
					<Building2 size={14} className="shrink-0 text-[var(--text-muted)]" />
					<span className="truncate font-medium">{currentOrg.name}</span>
					<span className="shrink-0 text-[10px] text-[var(--text-muted)]">
						{currentPeriod}
					</span>
					<ChevronDown
						size={12}
						className="shrink-0 text-[var(--text-muted)]"
					/>
				</button>

				{isOrgOpen && (
					<div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-lg">
						{DEFAULT_MOCK_ORGS.map((org) => (
							<button
								key={org.id}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
									org.id === currentOrg.id
										? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
										: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
								)}
								onClick={() => handleOrgSelect(org.id, org.name, org.ruc)}
							>
								<Building2 size={12} />
								<div className="flex-1 truncate">{org.name}</div>
								<span className="text-[10px] text-[var(--text-muted)]">
									{org.ruc}
								</span>
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{/* Organization selector */}
			<div className="relative">
				<button
					type="button"
					onClick={() => {
						setOrgOpen(!isOrgOpen);
						setPeriodOpen(false);
					}}
					className="flex w-full items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-left hover:bg-[var(--surface-2)]"
				>
					<Building2 size={14} className="shrink-0 text-[var(--text-muted)]" />
					<div className="flex-1 min-w-0">
						<div className="truncate text-xs font-medium text-[var(--text-primary)]">
							{currentOrg.name}
						</div>
						<div className="truncate text-[10px] text-[var(--text-muted)]">
							RUC {currentOrg.ruc}
						</div>
					</div>
					<ChevronDown
						size={12}
						className="shrink-0 text-[var(--text-muted)]"
					/>
				</button>

				{isOrgOpen && (
					<div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-lg">
						<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
							Empresas
						</div>
						{DEFAULT_MOCK_ORGS.map((org) => (
							<button
								key={org.id}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
									org.id === currentOrg.id
										? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
										: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
								)}
								onClick={() => handleOrgSelect(org.id, org.name, org.ruc)}
							>
								<Building2 size={12} />
								<div className="flex-1 truncate">{org.name}</div>
								<span className="text-[10px] text-[var(--text-muted)]">
									{org.ruc}
								</span>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Period selector */}
			<div className="relative">
				<button
					type="button"
					onClick={() => {
						setPeriodOpen(!isPeriodOpen);
						setOrgOpen(false);
					}}
					className="flex w-full items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-left hover:bg-[var(--surface-2)]"
				>
					<CalendarDays
						size={14}
						className="shrink-0 text-[var(--text-muted)]"
					/>
					<span className="flex-1 text-xs text-[var(--text-primary)]">
						{DEFAULT_PERIODS.find((p) => p.value === currentPeriod)?.label ??
							currentPeriod}
					</span>
					<ChevronDown
						size={12}
						className="shrink-0 text-[var(--text-muted)]"
					/>
				</button>

				{isPeriodOpen && (
					<div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-lg">
						<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
							Periodo
						</div>
						{DEFAULT_PERIODS.map((period) => (
							<button
								key={period.value}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
									period.value === currentPeriod
										? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
										: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
								)}
								onClick={() => handlePeriodSelect(period.value)}
							>
								<span className="flex-1">{period.label}</span>
								{period.isActive && (
									<span className="rounded-full bg-[var(--color-success)]/20 px-1.5 py-0.5 text-[10px] text-[var(--color-success)]">
										Activo
									</span>
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
