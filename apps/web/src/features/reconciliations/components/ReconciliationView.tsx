import type { ReactNode } from "react";
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
import { StatementImportDialog } from "./sections/StatementImportDialog";

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
					{...emptyStateFor({ hasCompany, isLoading, failed: Boolean(error) })}
				/>
			)}
		</div>
	);
};

interface EmptyStateInput {
	hasCompany: boolean;
	isLoading: boolean;
	failed: boolean;
}

/** What the workspace says when there is nothing to reconcile yet. */
function emptyStateFor({ hasCompany, isLoading, failed }: EmptyStateInput) {
	if (!hasCompany) {
		return {
			message:
				"Inicia sesión con una empresa para ver sus movimientos bancarios.",
		};
	}
	if (isLoading) return { message: "Cargando movimientos bancarios…" };
	if (failed) {
		return {
			title: "No pudimos cargar los movimientos",
			message: "Revisa tu conexión e inténtalo de nuevo en unos minutos.",
		};
	}
	return {
		title: "Aún no hay movimientos bancarios",
		message:
			"Importa el extracto de tu banco en CSV y Drenyra propondrá coincidencias con tus comprobantes y el libro contable.",
		action: <StatementImportDialog />,
	};
}

function ReconciliationEmptyState({
	title,
	message,
	action,
}: {
	title?: string;
	message: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-1 items-center justify-center p-10">
			<div role="status" className="max-w-md space-y-3 text-center">
				{title ? (
					<h2 className="text-lg font-medium tracking-tight text-foreground">
						{title}
					</h2>
				) : null}
				<p className="text-sm leading-relaxed text-muted-foreground">
					{message}
				</p>
				{action ? (
					<div className="flex justify-center pt-2">{action}</div>
				) : null}
			</div>
		</div>
	);
}
