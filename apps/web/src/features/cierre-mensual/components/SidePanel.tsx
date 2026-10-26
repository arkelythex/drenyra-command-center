import type { CierreMensual } from "@drenyra/domain";
import {
	CircleAlert,
	CircleCheck,
	CircleDashed,
	ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidePanelProps {
	cierre: CierreMensual;
	onOpenInspector: () => void;
}

type Tone = "ok" | "attention" | "pending";

/** Area status as the domain reports it -> the word shown and its tone. */
const AREA_STATUS: Record<string, { label: string; tone: Tone }> = {
	CONCILIADO: { label: "Conciliado", tone: "ok" },
	VALIDADO: { label: "Validado", tone: "ok" },
	NO_APLICA: { label: "No aplica", tone: "ok" },
	CON_DISCREPANCIAS: { label: "Con discrepancias", tone: "attention" },
};
const PENDING = { label: "Pendiente", tone: "pending" as Tone };

const TONE = {
	ok: { icon: CircleCheck, className: "text-success" },
	attention: { icon: CircleAlert, className: "text-warning" },
	pending: { icon: CircleDashed, className: "text-muted-foreground" },
} as const;

function StatusRow({
	label,
	status,
}: {
	label: string;
	status: { label: string; tone: Tone };
}) {
	const { icon: Icon, className } = TONE[status.tone];
	return (
		<li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
			<span>{label}</span>
			<span className={cn("flex items-center gap-1.5", className)}>
				<Icon aria-hidden="true" className="size-4" />
				{status.label}
			</span>
		</li>
	);
}

function riskStatus(level: CierreMensual["globalRiskLevel"]) {
	return level === "LOW"
		? { label: "Sin alertas", tone: "ok" as Tone }
		: { label: "Con alertas", tone: "attention" as Tone };
}

export function SidePanel({ cierre, onOpenInspector }: SidePanelProps) {
	const { agentAnalysis } = cierre;
	const signatures = Object.entries(cierre.firmas);

	return (
		<aside className="space-y-8">
			{agentAnalysis ? (
				<section className="space-y-2">
					<h3 className="text-base font-medium tracking-tight">
						Análisis del agente
					</h3>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{agentAnalysis.summary}
					</p>
					<p className="text-sm text-foreground">
						{Math.round(agentAnalysis.confidence * 100)}% de confianza ·{" "}
						{agentAnalysis.discrepancies}{" "}
						{agentAnalysis.discrepancies === 1
							? "discrepancia"
							: "discrepancias"}
					</p>
					{agentAnalysis.recommendations.length > 0 ? (
						<ul
							aria-label="Recomendaciones"
							className="list-disc space-y-1 pl-5 text-sm text-muted-foreground"
						>
							{agentAnalysis.recommendations.map((recommendation) => (
								<li key={recommendation}>{recommendation}</li>
							))}
						</ul>
					) : null}
				</section>
			) : null}

			<section className="space-y-3">
				<h3 className="text-base font-medium tracking-tight">
					Estado del cierre
				</h3>
				<ul
					aria-label="Estado del cierre"
					className="divide-y divide-border rounded-xl border border-border bg-card"
				>
					<StatusRow
						label="SIRE"
						status={AREA_STATUS[cierre.sireStatus] ?? PENDING}
					/>
					<StatusRow
						label="Bancos"
						status={AREA_STATUS[cierre.bancosStatus] ?? PENDING}
					/>
					<StatusRow
						label="IGV"
						status={AREA_STATUS[cierre.igvStatus] ?? PENDING}
					/>
					<StatusRow
						label="Riesgo"
						status={riskStatus(cierre.globalRiskLevel)}
					/>
				</ul>
			</section>

			<section className="space-y-3">
				<h3 className="text-base font-medium tracking-tight">
					Firmas requeridas
				</h3>
				<ul
					aria-label="Firmas requeridas"
					className="divide-y divide-border rounded-xl border border-border bg-card"
				>
					{signatures.map(([role, signature]) => (
						<li
							key={role}
							className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
						>
							<span className="capitalize">{role}</span>
							<span
								className={
									signature?.firmado ? "text-success" : "text-muted-foreground"
								}
							>
								{signature?.firmado
									? `Firmado ${signature.fecha ?? ""}`.trim()
									: "Pendiente"}
							</span>
						</li>
					))}
				</ul>
			</section>

			<button
				type="button"
				onClick={onOpenInspector}
				className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
			>
				<ShieldCheck aria-hidden="true" className="size-4" />
				Abrir inspector fiscal
			</button>
		</aside>
	);
}
