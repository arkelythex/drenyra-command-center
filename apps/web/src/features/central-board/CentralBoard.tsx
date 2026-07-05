"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
	useCentralBoardStore,
	type CentralBoardTab,
} from "@/stores/central-board-store";
import { BookOpen, FileText, ClipboardList, Rocket } from "lucide-react";
import { LedgerEditableTable } from "./components/LedgerEditableTable";
import { JournalPendingList } from "./components/JournalPendingList";
import { DocumentsList } from "./components/DocumentsList";
import { useDesignTokens } from "@/lib/design-tokens";

const TABS: {
	key: CentralBoardTab;
	label: string;
	icon: React.ElementType;
	description: string;
}[] = [
	{
		key: "ledger",
		label: "Ledger",
		icon: BookOpen,
		description: "Transacciones contables",
	},
	{
		key: "journal",
		label: "Journal",
		icon: ClipboardList,
		description: "Asientos propuestos",
	},
	{
		key: "documents",
		label: "Documents",
		icon: FileText,
		description: "Documentos adjuntos",
	},
	{
		key: "missions",
		label: "Misiones",
		icon: Rocket,
		description: "Automatizaciones y tareas",
	},
];

export function CentralBoard() {
	const activeTab = useCentralBoardStore((s) => s.centralBoardTab);
	const setActiveTab = useCentralBoardStore((s) => s.setCentralBoardTab);
	const journalEntries = useCentralBoardStore((s) => s.journalEntries);
	const documents = useCentralBoardStore((s) => s.documents);
	const { borderRadius } = useDesignTokens();

	const pendingCount = useMemo(
		() => journalEntries.filter((e) => e.status === "pending").length,
		[journalEntries],
	);

	const handleTabChange = useCallback(
		(tab: CentralBoardTab) => {
			setActiveTab(tab);
		},
		[setActiveTab],
	);

	return (
		<div className="flex h-full flex-col">
			{/* Header / Tab bar */}
			<div className="flex items-center gap-0.5 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-3">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.key;
					return (
						<button
							key={tab.key}
							onClick={() => handleTabChange(tab.key)}
							className={cn(
								"relative flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors",
								isActive
									? "text-[var(--text-primary)]"
									: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
							)}
						>
							<Icon size={14} />
							<span>{tab.label}</span>
							{tab.key === "journal" && pendingCount > 0 && (
								<span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-2xs font-bold text-white">
									{pendingCount}
								</span>
							)}
							{/* Active indicator */}
							{isActive && (
								<span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--color-primary)]" />
							)}
						</button>
					);
				})}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Subtle hint */}
				<span className="text-2xs text-[var(--text-muted)] hidden sm:block">
					Central Board
				</span>
			</div>

			{/* Content area */}
			<div className="flex-1 overflow-hidden">
				{activeTab === "ledger" && <LedgerEditableTable />}
				{activeTab === "journal" && <JournalPendingList />}
				{activeTab === "documents" && <DocumentsList />}
				{activeTab === "missions" && (
					<div className="h-full overflow-auto p-4 space-y-3">
						<h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">
							Misiones activas
						</h3>

						<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-[var(--text-primary)] truncate">
										Conciliación bancaria Q1
									</p>
									<p className="mt-0.5 text-2xs text-[var(--text-muted)]">
										Agente Contable
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<div className="h-2 w-24 rounded-full bg-[var(--surface-2)] overflow-hidden">
										<div className="h-full w-[72%] rounded-full bg-[var(--color-primary)]" />
									</div>
									<span className="text-2xs font-mono text-[var(--text-muted)]">
										72%
									</span>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-[var(--text-primary)] truncate">
										Validación SUNAT pendientes
									</p>
									<p className="mt-0.5 text-2xs text-[var(--text-muted)]">
										Agente Fiscal
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<div className="h-2 w-24 rounded-full bg-[var(--surface-2)] overflow-hidden">
										<div className="h-full w-[45%] rounded-full bg-amber-400" />
									</div>
									<span className="text-2xs font-mono text-[var(--text-muted)]">
										45%
									</span>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-[var(--text-primary)] truncate">
										Revisión de detracciones
									</p>
									<p className="mt-0.5 text-2xs text-[var(--text-muted)]">
										Agente Compliance
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<div className="h-2 w-24 rounded-full bg-[var(--surface-2)] overflow-hidden">
										<div className="h-full w-full rounded-full bg-[var(--color-success)]" />
									</div>
									<span className="text-2xs font-mono text-[var(--text-muted)]">
										100%
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
