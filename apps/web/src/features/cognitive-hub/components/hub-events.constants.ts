import type { LucideIcon } from "lucide-react";
import { Activity, GitBranch } from "lucide-react";

export interface ResolvedHubEvent {
	id: string;
	msg: string;
	agent: string;
	icon: LucideIcon;
	color: string;
	reason: string;
}

export const RESOLVED_HUB_EVENTS: ReadonlyArray<ResolvedHubEvent> = [
	{
		id: "evt-1",
		msg: "Asiento Ledger #A442 listo. Validación fiscal completada con trazabilidad.",
		agent: "Eviden",
		icon: Activity,
		color: "text-info",
		reason:
			"El agente verificó que el comprobante E001-4492 coincide exactamente con el XML recibido de SUNAT. Se aplicó el mapeo contable estándar para servicios de consultoría.",
	},
	{
		id: "evt-2",
		msg: "Conciliación BCP detectó diferencia de 0.02%. Ajuste pendiente de aprobación humana.",
		agent: "Vigila",
		icon: GitBranch,
		color: "text-warning",
		reason:
			"Se detectó diferencia de redondeo bancario. El sistema solo propone el ajuste y espera aprobación explícita.",
	},
] as const;
