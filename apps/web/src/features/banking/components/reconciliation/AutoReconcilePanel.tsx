import { useEffect, useState } from "react";
import { RefreshCw, Check, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion-primitives";
import { useHaptics, useFinancialHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";
import { presentError } from "@/lib/error-messages";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { useBankingReconciliation } from "../../stores/banking.store";
import { confidenceToStatus } from "@/lib/design-tokens/semantic-tokens";

interface AutoReconcilePanelProps {
	accountId: string;
	unreconciledCount: number;
	onComplete?: (count: number) => void;
}

export const AutoReconcilePanel = ({
	accountId,
	unreconciledCount,
	onComplete,
}: AutoReconcilePanelProps) => {
	const {
		autoReconcile,
		lastReconciliationResult,
		clearLastReconciliationResult,
		isLoading,
	} = useBankingReconciliation(accountId);
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const [showResults, setShowResults] = useState(false);

	useEffect(() => {
		setShowResults(false);
		clearLastReconciliationResult();
	}, [accountId, clearLastReconciliationResult, companyId]);

	const handleAutoReconcile = async () => {
		trigger("heavy");

		try {
			const count = await autoReconcile();

			if (count > 0) {
				financialHaptics.onSave();
				setShowResults(true);
				onComplete?.(count);
			}
		} catch (error) {
			const presentation = presentError(
				error,
				"No se pudo ejecutar la conciliación",
			);
			toast.error(presentation.title, {
				description: presentation.description,
			});
		}
	};

	const getScoreColor = (score: number) => {
		const status = confidenceToStatus(score);
		if (status === "success")
			return "border-success-subtle bg-success-subtle text-success";
		if (status === "info") return "border-info-subtle bg-info-subtle text-info";
		if (status === "warning")
			return "border-warning-subtle bg-warning-subtle text-warning";
		return "border-danger-subtle bg-danger-subtle text-danger";
	};

	const getCriteriaLabel = (criteria: string) => {
		switch (criteria) {
			case "REFERENCE":
				return "Referencia exacta";
			case "AMOUNT_DATE":
				return "Monto + Fecha";
			case "AMOUNT_ENTITY":
				return "Monto + Cliente";
			case "PARTIAL":
				return "Pago parcial";
			default:
				return criteria;
		}
	};

	if (unreconciledCount === 0) {
		return (
			<div className="flex items-center gap-3 rounded-xl border border-success-subtle bg-success-subtle px-4 py-3">
				<Check size={16} className="text-success" />
				<span className="text-xs font-bold uppercase tracking-widest text-success">
					Todas las transacciones conciliadas
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 shadow-sm">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--accent)] shadow-sm">
							<Check size={18} />
						</div>
						<div>
							<h3 className="text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]">
								Conciliación sugerida
							</h3>
							<p className="text-xs text-[var(--text-tertiary)] mt-0.5">
								<span className="font-bold text-[var(--text-primary)]">
									{unreconciledCount}
								</span>{" "}
								transacciones pendientes
							</p>
						</div>
					</div>

					<Button
						onClick={handleAutoReconcile}
						disabled={isLoading}
						className="h-10 rounded-xl bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-widest text-[var(--text-on-accent)] shadow-sm transition-[opacity,transform,box-shadow] duration-200 hover:opacity-95 active:scale-[0.99]"
					>
						{isLoading ? (
							<RefreshCw size={14} className="mr-2 animate-spin" />
						) : (
							<Check size={14} className="mr-2" />
						)}
						{isLoading ? "Procesando..." : "Ejecutar"}
					</Button>
				</div>
			</Card>

			{showResults && lastReconciliationResult && (
				<MotionDiv
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-3"
				>
					<div className="flex items-center justify-between px-2">
						<div className="flex items-center gap-2">
							<Check size={14} className="text-success" />
							<span className="text-xs font-bold uppercase tracking-widest text-success">
								{lastReconciliationResult.reconciledCount} conciliadas
								automáticamente
							</span>
						</div>
						<button
							type="button"
							onClick={() => {
								setShowResults(false);
								clearLastReconciliationResult();
							}}
							className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
						>
							<X size={14} />
						</button>
					</div>

					{lastReconciliationResult.matches.length > 0 && (
						<div className="space-y-2">
							{lastReconciliationResult.matches.slice(0, 5).map((match) => (
								<div
									key={match.transactionId}
									className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3"
								>
									<div className="flex items-center gap-3">
										<ArrowRight
											size={12}
											className="text-[var(--text-tertiary)]"
										/>
										<div>
											<span className="text-xs font-bold uppercase tracking-tight text-[var(--text-primary)]">
												{match.documentType === "INVOICE"
													? "Factura"
													: "Cuenta"}
											</span>
											<span className="text-xs text-[var(--text-tertiary)] ml-2">
												{getCriteriaLabel(match.matchCriteria)}
											</span>
										</div>
									</div>
									<span
										className={cn(
											"rounded-lg border px-2 py-1 text-xs font-bold",
											getScoreColor(match.matchScore),
										)}
									>
										{match.matchScore}%
									</span>
								</div>
							))}

							{lastReconciliationResult.matches.length > 5 && (
								<p className="text-xs text-[var(--text-tertiary)] text-center py-2">
									+{lastReconciliationResult.matches.length - 5} más
								</p>
							)}
						</div>
					)}
				</MotionDiv>
			)}
		</div>
	);
};
