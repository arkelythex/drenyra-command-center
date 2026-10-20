import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { useReconciliationWorkspace } from "../hooks/use-reconciliation-workspace";
import type { ReconciliationLedgerEntry } from "../reconciliation.types";
import { formatReconciliationMoney } from "../reconciliation.utils";
import { ReconciliationEvidenceRail } from "./sections/ReconciliationEvidenceRail";
import { ReconciliationExecutiveSummary } from "./sections/ReconciliationExecutiveSummary";
// Sections
import { ReconciliationHeader } from "./sections/ReconciliationHeader";
import { ReconciliationMatchWorkspace } from "./sections/ReconciliationMatchWorkspace";
import { ReconciliationQueuePanel } from "./sections/ReconciliationQueuePanel";

export const ReconciliationView = () => {
	const setIsMobileOpen = useAgenticShell((s) => s.setSidebarMobileOpen);
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();
	const {
		activeCandidate,
		activeTransaction,
		setSelectedCandidateId,
		setSelectedTransactionId,
		transactions,
		summary,
		isLoading,
		error,
		hasCompany,
		confirmCandidate,
	} = useReconciliationWorkspace();
	const {
		reconciledRate,
		requiresHumanDecision,
		unresolvedCount,
		unresolvedExposureCents,
	} = summary;
	const ledgerEntries: ReconciliationLedgerEntry[] = (
		activeTransaction?.candidates ?? []
	).map((candidate) => ({
		id: candidate.id,
		date: activeTransaction?.date ?? "",
		vendor: candidate.vendor,
		amount: candidate.amount,
		reference: candidate.ledgerEntryId,
	}));

	const approve = async () => {
		if (!activeCandidate) return;
		try {
			await confirmCandidate(activeCandidate);
			financialHaptics.onSave();
			toast.success(`Conciliado con ${activeCandidate.ledgerEntryId}.`);
		} catch (cause) {
			toast.error(
				cause instanceof Error ? cause.message : "No se pudo conciliar.",
			);
		}
	};

	return (
		<div className="flex flex-col h-full bg-background overflow-hidden font-sans text-foreground">
			<ReconciliationHeader
				setIsMobileOpen={setIsMobileOpen}
				triggerHaptic={trigger}
			/>

			<div className="flex shrink-0 items-center justify-between gap-8 border-b border-border/50 bg-[var(--surface-1)] px-6 py-3">
				<div className="flex items-center gap-4">
					<span className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">
						Cuenta activa
					</span>
					<span className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-black text-foreground shadow-sm">
						<Landmark size={14} className="text-info" /> Todas las cuentas
					</span>
				</div>
				<div className="flex items-center gap-6 border-l border-border/60 pl-6 h-8">
					<div className="flex items-center gap-2">
						<div className="ui-dot-success h-2 w-2 rounded-full" />
						<span className="text-label font-black uppercase tracking-widest text-success">
							{reconciledRate}% conciliado
						</span>
					</div>
					<div className="flex items-center gap-2 opacity-60">
						<div className="ui-dot-warning h-2 w-2 rounded-full" />
						<span className="text-label font-black uppercase tracking-widest text-foreground">
							{unresolvedCount} pendientes
						</span>
					</div>
				</div>
			</div>

			<ReconciliationExecutiveSummary
				unmatchedCount={unresolvedCount}
				unmatchedExposure={formatReconciliationMoney(
					unresolvedExposureCents / 100,
				)}
				reconciledRate={reconciledRate}
				decisionRequiresHuman={requiresHumanDecision}
			/>

			{activeTransaction ? (
				<div className="grid min-h-0 flex-1 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
					<ReconciliationQueuePanel
						formatMoney={formatReconciliationMoney}
						selectedTransactionId={activeTransaction.id}
						transactions={transactions}
						onSelect={(transactionId) => {
							trigger("light");
							setSelectedTransactionId(transactionId);
						}}
					/>
					<ReconciliationMatchWorkspace
						activeCandidate={activeCandidate}
						activeTransaction={activeTransaction}
						formatMoney={formatReconciliationMoney}
						ledgerEntries={ledgerEntries}
						onSelectCandidate={(candidateId) => {
							trigger("light");
							setSelectedCandidateId(candidateId);
						}}
					/>
					<ReconciliationEvidenceRail
						activeCandidate={activeCandidate}
						activeTransaction={activeTransaction}
						onDecision={(decision) => {
							if (decision === "approve") {
								void approve();
								return;
							}
							trigger("light");
						}}
					/>
				</div>
			) : (
				<ReconciliationEmptyState
					message={
						!hasCompany
							? "Inicia sesión con una empresa para ver sus movimientos bancarios."
							: isLoading
								? "Cargando movimientos bancarios…"
								: error
									? `No se pudieron cargar los movimientos: ${error.message}`
									: "No hay movimientos bancarios registrados para esta empresa."
					}
				/>
			)}
		</div>
	);
};

function ReconciliationEmptyState({ message }: { message: string }) {
	return (
		<div className="flex flex-1 items-center justify-center p-10">
			<p
				role="status"
				className="max-w-md text-center text-sm text-muted-foreground"
			>
				{message}
			</p>
		</div>
	);
}
