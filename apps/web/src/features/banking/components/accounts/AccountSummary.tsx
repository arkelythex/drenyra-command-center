import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn, n } from "@/lib/utils";
import { LEGIBILITY } from "@/lib/legibility";

interface AccountSummaryProps {
	totalBalancePEN: string;
	totalBalanceUSD: string;
	unreconciledCount: number;
	totalAccounts: number;
}

export const AccountSummary = ({
	totalBalancePEN,
	totalBalanceUSD,
	unreconciledCount,
	totalAccounts,
}: AccountSummaryProps) => {
	const formatMoney = (amount: string, currency: "PEN" | "USD") =>
		n(parseFloat(amount || "0"), currency);

	const penBalance = parseFloat(totalBalancePEN || "0");
	const usdBalance = parseFloat(totalBalanceUSD || "0");

	return (
		<div className="p-5 space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Wallet size={16} className="text-info" />
					<span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
						Resumen de Cuentas
					</span>
				</div>
				<span className="text-xs text-[var(--text-tertiary)]">
					{totalAccounts} cuenta{totalAccounts !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<p className="text-xs text-[var(--text-tertiary)] font-medium">
						Soles (PEN)
					</p>
					<p
						className={cn(
							"text-xl font-mono font-bold tabular-nums",
							penBalance >= 0 ? "text-[var(--text-primary)]" : "text-danger",
							LEGIBILITY.textShadow.light,
						)}
					>
						{formatMoney(totalBalancePEN, "PEN")}
					</p>
					<div className="flex items-center gap-1">
						{penBalance >= 0 ? (
							<TrendingUp size={12} className="text-success" />
						) : (
							<TrendingDown size={12} className="text-danger" />
						)}
						<span
							className={cn(
								"text-xs font-bold",
								penBalance >= 0 ? "text-success" : "text-danger",
							)}
						>
							{penBalance >= 0 ? "+" : ""}
							{((penBalance / 100000) * 100).toFixed(1)}%
						</span>
					</div>
				</div>

				<div className="space-y-1">
					<p className="text-xs text-[var(--text-tertiary)] font-medium">
						Dólares (USD)
					</p>
					<p
						className={cn(
							"text-xl font-mono font-bold tabular-nums",
							usdBalance >= 0 ? "text-[var(--text-primary)]" : "text-danger",
							LEGIBILITY.textShadow.light,
						)}
					>
						{formatMoney(totalBalanceUSD, "USD")}
					</p>
					<div className="flex items-center gap-1">
						{usdBalance >= 0 ? (
							<TrendingUp size={12} className="text-success" />
						) : (
							<TrendingDown size={12} className="text-danger" />
						)}
						<span
							className={cn(
								"text-xs font-bold",
								usdBalance >= 0 ? "text-success" : "text-danger",
							)}
						>
							{usdBalance >= 0 ? "+" : ""}
							{((usdBalance / 10000) * 100).toFixed(1)}%
						</span>
					</div>
				</div>
			</div>

			{unreconciledCount > 0 && (
				<div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
					<span className="text-xs text-[var(--text-tertiary)]">
						Transacciones pendientes
					</span>
					<span className="rounded-lg border border-warning-subtle bg-warning-subtle px-2 py-1 text-xs font-bold text-warning">
						{unreconciledCount}
					</span>
				</div>
			)}
		</div>
	);
};
