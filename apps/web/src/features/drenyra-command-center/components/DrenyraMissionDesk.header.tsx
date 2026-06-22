import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";

export type DrenyraMissionDeskHeaderProps = {
	connectionStatus: string;
	isBusy: boolean;
};

/**
 * Header block: mission label, explanatory copy, and live-connection badge.
 */
export function DrenyraMissionDeskHeader({
	connectionStatus,
	isBusy,
}: DrenyraMissionDeskHeaderProps): ReactElement {
	const statusLabel =
		connectionStatus === "connected"
			? "Enjambre en vivo"
			: isBusy
				? "Orquestando…"
				: "Listo para cargar";

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<p className="text-2xs font-bold uppercase tracking-[0.2em] text-[var(--color-info)]">
					Misión fiscal
				</p>
				<h2
					id="drenyra-mission-title"
					className="mt-1 text-lg font-bold tracking-tight"
				>
					Subí facturas → agentes debaten → listo para declarar
				</h2>
				<p className="mt-1 max-w-2xl text-xs text-[var(--text-tertiary)]">
					Como Cursor: una acción, resultado visible en minutos. Los agentes
					leen el CPE, contabilizan, validan SUNAT y dejan el expediente con
					evidencia auditable.
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1 text-2xs text-[var(--text-secondary)]">
				<Sparkles size={12} className="text-[var(--color-info)]" />
				{statusLabel}
			</div>
		</div>
	);
}
