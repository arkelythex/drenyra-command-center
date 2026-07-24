import { AlertTriangle, ExternalLink, FileSearch, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissionBlocker } from "../mission.types";

interface P0HeroProps {
	blockers: MissionBlocker[];
	onReviewWithAgent?: (blockerId: string) => void;
	onViewEvidence?: (blockerId: string) => void;
}

const SEVERITY_CONFIG = {
	critical: {
		icon: Shield,
		color: "bg-[var(--color-danger)]/5 border-[var(--color-danger)]/25",
		badge: "bg-[var(--color-danger)] text-white",
		text: "text-[var(--color-danger)]",
		label: "BLOQUEO CRÍTICO",
	},
	high: {
		icon: AlertTriangle,
		color: "bg-[var(--color-warning)]/5 border-[var(--color-warning)]/25",
		badge: "bg-[var(--color-warning)] text-white",
		text: "text-[var(--color-warning)]",
		label: "BLOQUEO",
	},
	medium: {
		icon: AlertTriangle,
		color: "bg-[var(--color-info)]/5 border-[var(--color-info)]/25",
		badge: "bg-[var(--color-info)] text-white",
		text: "text-[var(--color-info)]",
		label: "ATENCIÓN",
	},
	low: {
		icon: FileSearch,
		color: "bg-[var(--surface-2)] border-[var(--border-subtle)]",
		badge: "bg-[var(--text-quaternary)] text-white",
		text: "text-[var(--text-secondary)]",
		label: "INFORMATIVO",
	},
} as const;

export function P0Hero({
	blockers,
	onReviewWithAgent,
	onViewEvidence,
}: P0HeroProps) {
	const active = blockers.filter((b) => !b.resolved);

	if (active.length === 0) return null;

	// Show the most severe blocker as the hero
	const primary = active.reduce((a, b) => {
		const order = { critical: 4, high: 3, medium: 2, low: 1 };
		return (order[a.severity as keyof typeof order] ?? 0) >=
			(order[b.severity as keyof typeof order] ?? 0)
			? a
			: b;
	});

	const cfg =
		SEVERITY_CONFIG[primary.severity as keyof typeof SEVERITY_CONFIG] ??
		SEVERITY_CONFIG.medium;
	const Icon = cfg.icon;

	return (
		<section className={cn("rounded-2xl border-2 p-6 space-y-5", cfg.color)}>
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex size-10 shrink-0 items-center justify-center rounded-xl",
							cfg.badge,
						)}
					>
						<Icon size={20} />
					</div>
					<div>
						<h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
							{cfg.label}
						</h2>
						<p className="text-xs text-[var(--text-secondary)] mt-0.5">
							El cierre requiere una decisión contable
						</p>
					</div>
				</div>
				<div className="text-right">
					<p className="text-2xs font-bold text-[var(--color-danger)]">
						Vence 17:00
					</p>
				</div>
			</div>

			{/* Reason */}
			<div className="space-y-1">
				<p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
					{primary.reason}
				</p>
				<p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
					{active.length} inconsistencia{active.length !== 1 ? "s" : ""} entre
					SIRE y comprobantes bloquean la validación del IGV.
				</p>
			</div>

			{/* Evidence chips */}
			<div className="flex flex-wrap gap-2">
				<span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1 text-2xs font-medium text-[var(--text-secondary)]">
					<FileSearch size={12} />3 documentos afectados
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1 text-2xs font-medium text-[var(--text-secondary)]">
					<Shield size={12} />
					S/ 14,820 involucrados
				</span>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1 text-2xs font-medium text-[var(--text-secondary)]">
					<ExternalLink size={12} />
					Bloquea IGV y declaración mensual
				</span>
			</div>

			{/* Evidence references */}
			<div className="space-y-1">
				<p className="text-2xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
					Evidencia
				</p>
				<div className="flex flex-wrap gap-2">
					{["CDR-001-456", "F001-457", "B002-123"].map((ref) => (
						<button
							key={ref}
							type="button"
							className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-2xs font-mono text-[var(--color-info)] hover:bg-[var(--color-info)]/5 transition-colors"
							onClick={() => onViewEvidence?.(ref)}
						>
							{ref}
						</button>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-3 pt-1">
				<Button
					className="h-10 text-xs font-bold px-5"
					onClick={() => onReviewWithAgent?.(primary.id)}
				>
					<Shield size={16} className="mr-2" />
					Revisar con Drenyra
				</Button>
				<Button
					variant="outline"
					className="h-10 text-xs font-bold px-5"
					onClick={() => onViewEvidence?.(primary.id)}
				>
					Ver evidencia
				</Button>
			</div>
		</section>
	);
}
