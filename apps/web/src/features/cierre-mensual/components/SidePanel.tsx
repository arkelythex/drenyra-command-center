import type { CierreMensual } from "@drenyra/domain";
import {
	Calculator,
	Clock,
	Fingerprint,
	Landmark,
	type LucideIcon,
	Receipt,
	ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidePanelProps {
	cierre: CierreMensual;
	onOpenInspector: () => void;
}

export function SidePanel({ cierre, onOpenInspector }: SidePanelProps) {
	return (
		<aside className="space-y-5">
			{/* Agent Analysis */}
			{cierre.agentAnalysis && (
				<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-3">
					<h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
						Análisis del Agente
					</h3>
					<p className="text-xs text-[var(--text-secondary)] leading-relaxed">
						{cierre.agentAnalysis.summary}
					</p>
					<p className="text-3xs font-bold text-[var(--color-success)]">
						{cierre.agentAnalysis.confidence * 100}% confianza ·{" "}
						{cierre.agentAnalysis.discrepancies} discrepancias
					</p>
					{cierre.agentAnalysis.recommendations.length > 0 && (
						<div className="space-y-1">
							{cierre.agentAnalysis.recommendations.map((r, i) => (
								<p
									key={i}
									className="text-2xs text-[var(--text-tertiary)] italic"
								>
									• {r}
								</p>
							))}
						</div>
					)}
				</div>
			)}

			{/* Status Cards */}
			<div className="grid grid-cols-2 gap-3">
				<StatusCard label="SIRE" status={cierre.sireStatus} icon={Receipt} />
				<StatusCard
					label="Bancos"
					status={cierre.bancosStatus}
					icon={Landmark}
				/>
				<StatusCard label="IGV" status={cierre.igvStatus} icon={Calculator} />
				<StatusCard
					label="Riesgo"
					status={
						cierre.globalRiskLevel === "LOW" ? "VALIDADO" : "CON_DISCREPANCIAS"
					}
					icon={ShieldCheck}
					isRisk
				/>
			</div>

			{/* Firmas */}
			<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-3">
				<h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
					Firmas Requeridas
				</h3>
				{Object.entries(cierre.firmas).map(([rol, firma]) => (
					<div
						key={rol}
						className={cn(
							"flex items-center gap-2 rounded-lg border px-3 py-2",
							firma?.firmado
								? "border-[var(--color-success)]/20 bg-[var(--color-success)]/4"
								: "border-[var(--border-subtle)]",
						)}
					>
						{firma?.firmado ? (
							<Fingerprint size={14} className="text-[var(--color-success)]" />
						) : (
							<Clock size={14} className="text-[var(--text-tertiary)]" />
						)}
						<span className="text-2xs font-bold text-[var(--text-primary)] capitalize">
							{rol}
						</span>
						<span
							className={cn(
								"ml-auto text-3xs font-bold",
								firma?.firmado
									? "text-[var(--color-success)]"
									: "text-[var(--text-tertiary)]",
							)}
						>
							{firma?.firmado ? `Firmado ${firma.fecha ?? ""}` : "Pendiente"}
						</span>
					</div>
				))}
			</div>

			<Button
				className="w-full h-10 text-xs font-bold"
				onClick={onOpenInspector}
			>
				<ShieldCheck size={16} className="mr-2" />
				Abrir Inspector Fiscal
			</Button>
		</aside>
	);
}

/* ── Status Card (co-located) ───────────────────────────────── */

interface StatusCardProps {
	label: string;
	status: string;
	icon: LucideIcon;
	isRisk?: boolean;
}

function StatusCard({ label, status, icon: Icon, isRisk }: StatusCardProps) {
	const ok =
		status === "CONCILIADO" || status === "VALIDADO" || status === "NO_APLICA";
	return (
		<div
			className={cn(
				"rounded-2xl border p-3 text-center",
				ok
					? "border-[var(--color-success)]/20 bg-[var(--color-success)]/4"
					: "border-[var(--color-warning)]/20 bg-[var(--color-warning)]/4",
			)}
		>
			<Icon
				size={16}
				className={cn(
					"mx-auto",
					ok ? "text-[var(--color-success)]" : "text-[var(--color-warning)]",
				)}
			/>
			<p className="mt-1 text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
				{label}
			</p>
			<p
				className={cn(
					"text-2xs font-bold",
					ok ? "text-[var(--color-success)]" : "text-[var(--color-warning)]",
				)}
			>
				{status === "CONCILIADO"
					? "OK"
					: status === "VALIDADO"
						? "OK"
						: status === "CON_DISCREPANCIAS"
							? "Alertas"
							: status === "NO_APLICA"
								? "N/A"
								: "Pendiente"}
			</p>
		</div>
	);
}
