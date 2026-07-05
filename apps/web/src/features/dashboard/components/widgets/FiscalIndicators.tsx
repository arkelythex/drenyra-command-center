import { ArrowUp, Coins, Landmark, RefreshCw } from "lucide-react";
import type React from "react";
import { Card } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";
import { useFiscalIndicators } from "../../hooks/useFiscalIndicators";

export const FiscalIndicators: React.FC = () => {
	const { exchangeRate, uit, isLoading } = useFiscalIndicators();

	return (
		<Card className="h-full rounded-2xl border border-border/50 bg-[var(--surface-1)]/84 p-5 shadow-sm">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<p className="text-label font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Variables del mercado
					</p>
					<h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
						Tipo de cambio y referencia UIT
					</h3>
				</div>
				<button
					type="button"
					className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Refrescar indicadores"
				>
					<RefreshCw
						size={14}
						className={cn(isLoading ? "animate-spin" : undefined)}
						aria-hidden="true"
					/>
				</button>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="rounded-xl border border-border/50 bg-[var(--surface-2)]/42 p-4">
					<div className="mb-2 flex items-center gap-2 text-muted-foreground">
						<Landmark size={14} aria-hidden="true" />
						<p className="text-xs font-medium">Tipo de cambio SUNAT</p>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-lg border border-border/50 bg-[var(--surface-1)] p-3 text-center">
							<p className="text-label uppercase tracking-wide text-muted-foreground">
								Compra
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
								{exchangeRate.compra || "3.745"}
							</p>
						</div>
						<div className="rounded-lg border border-border/50 bg-[var(--surface-1)] p-3 text-center">
							<p className="text-label uppercase tracking-wide text-muted-foreground">
								Venta
							</p>
							<p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
								{exchangeRate.venta || "3.758"}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-border/50 bg-[var(--surface-2)]/42 p-4">
					<div className="mb-2 flex items-center gap-2 text-muted-foreground">
						<Coins size={14} aria-hidden="true" />
						<p className="text-xs font-medium">Valor de UIT</p>
					</div>
					<div className="rounded-lg border border-border/50 bg-[var(--surface-1)] p-3">
						<p className="text-label uppercase tracking-wide text-muted-foreground">
							Ejercicio {uit.year || 2026}
						</p>
						<p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
							{n(uit.value || 5350)}
						</p>
						<p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
							<ArrowUp size={12} aria-hidden="true" />
							Referencia oficial activa
						</p>
					</div>
				</div>
			</div>
		</Card>
	);
};
