import {
	ArrowRight,
	Check,
	FileText,
	Receipt,
	Sparkles,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/ui/motion-primitives";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { confidenceToStatus } from "@/lib/design-tokens/semantic-tokens";
import { LEGIBILITY } from "@/lib/legibility";
import { cn, n } from "@/lib/utils";

interface MatchPreviewProps {
	transaction: {
		id: string;
		description: string;
		amount: string;
		transactionDate: string;
		reference?: string;
	};
	document: {
		id: string;
		number: string;
		type: "INVOICE" | "BILL";
		amount: string;
		dueDate: string;
		entityName?: string;
	};
	matchScore: number;
	matchCriteria: "REFERENCE" | "AMOUNT_DATE" | "AMOUNT_ENTITY" | "PARTIAL";
	onConfirm: () => void;
	onReject: () => void;
	onViewDocument?: () => void;
}

export const MatchPreview = ({
	transaction,
	document,
	matchScore,
	matchCriteria,
	onConfirm,
	onReject,
	onViewDocument,
}: MatchPreviewProps) => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();

	const formatMoney = (amount: string) => n(parseFloat(amount));

	const getScoreColor = () => {
		const status = confidenceToStatus(matchScore);
		if (status === "success")
			return "bg-success text-[var(--color-text-inverse)]";
		if (status === "info") return "bg-info text-[var(--color-text-inverse)]";
		if (status === "warning")
			return "bg-warning text-[var(--color-text-inverse)]";
		return "bg-danger text-[var(--color-text-inverse)]";
	};

	const getCriteriaIcon = () => {
		switch (matchCriteria) {
			case "REFERENCE":
				return <FileText size={12} />;
			case "AMOUNT_DATE":
				return <Receipt size={12} />;
			case "AMOUNT_ENTITY":
				return <Sparkles size={12} />;
			default:
				return <Sparkles size={12} />;
		}
	};

	const getCriteriaLabel = () => {
		switch (matchCriteria) {
			case "REFERENCE":
				return "Referencia exacta";
			case "AMOUNT_DATE":
				return "Monto + Fecha";
			case "AMOUNT_ENTITY":
				return "Monto + Cliente/Proveedor";
			case "PARTIAL":
				return "Pago parcial";
			default:
				return matchCriteria;
		}
	};

	const handleConfirm = () => {
		financialHaptics.onSave();
		onConfirm();
	};

	const handleReject = () => {
		trigger("light");
		onReject();
	};

	return (
		<MotionDiv
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="w-full"
		>
			<div className="p-5 space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Sparkles size={14} className="text-info" />
						<span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">
							Match Sugerido
						</span>
					</div>
					<div
						className={cn(
							"px-2.5 py-1 rounded-lg text-xs font-bold",
							getScoreColor(),
						)}
					>
						{matchScore}%
					</div>
				</div>

				<div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
					<div className="space-y-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]">
						<div className="flex items-center gap-2 text-[var(--text-tertiary)]">
							<Receipt size={14} />
							<span className="text-xs font-bold uppercase tracking-widest">
								Transacción
							</span>
						</div>
						<p
							className={cn(
								"text-sm font-bold truncate",
								LEGIBILITY.textShadow.light,
							)}
						>
							{transaction.description}
						</p>
						<p className="text-lg font-mono font-bold text-[var(--text-primary)] tabular-nums">
							{formatMoney(transaction.amount)}
						</p>
						<p className="text-xs text-[var(--text-tertiary)]">
							{transaction.transactionDate}
							{transaction.reference && ` • Ref: ${transaction.reference}`}
						</p>
					</div>

					<div className="flex flex-col items-center gap-2">
						<ArrowRight size={20} className="text-info" />
						<div className="flex items-center gap-1 rounded-lg border border-info-subtle bg-info-subtle px-2 py-1">
							{getCriteriaIcon()}
							<span className="text-xs font-bold text-info">
								{getCriteriaLabel()}
							</span>
						</div>
					</div>

					<div className="space-y-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]">
						<div className="flex items-center gap-2 text-[var(--text-tertiary)]">
							<FileText size={14} />
							<span className="text-xs font-bold uppercase tracking-widest">
								{document.type === "INVOICE" ? "Factura" : "Cuenta por Pagar"}
							</span>
						</div>
						<p className={cn("text-sm font-bold", LEGIBILITY.textShadow.light)}>
							{document.number}
						</p>
						<p className="text-lg font-mono font-bold text-[var(--text-primary)] tabular-nums">
							{formatMoney(document.amount)}
						</p>
						<p className="text-xs text-[var(--text-tertiary)]">
							Vence: {document.dueDate}
							{document.entityName && ` • ${document.entityName}`}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
					{onViewDocument && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								trigger("light");
								onViewDocument();
							}}
							className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
						>
							Ver documento
						</Button>
					)}

					<div className="flex items-center gap-2 ml-auto">
						<Button
							variant="outline"
							size="sm"
							onClick={handleReject}
							className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border-[var(--border-subtle)] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
						>
							<X size={14} className="mr-1.5" />
							Rechazar
						</Button>
						<Button
							size="sm"
							onClick={handleConfirm}
							className="h-9 px-5 rounded-xl bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90 text-xs font-bold uppercase tracking-widest shadow-sm"
						>
							<Check size={14} className="mr-1.5" />
							Confirmar
						</Button>
					</div>
				</div>
			</div>
		</MotionDiv>
	);
};
