import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { MissionBlocker } from "../mission.types";

const SEVERITY_ICON: Record<string, typeof AlertTriangle> = {
	low: AlertTriangle,
	medium: AlertTriangle,
	high: XCircle,
	critical: XCircle,
};

const SEVERITY_COLOR: Record<string, string> = {
	low: "text-[var(--color-warning)]",
	medium: "text-[var(--color-warning)]",
	high: "text-[var(--color-danger)]",
	critical: "text-[var(--color-danger)]",
};

const SEVERITY_LABEL: Record<string, string> = {
	low: "Bajo",
	medium: "Medio",
	high: "Alto",
	critical: "Crítico",
};

interface MissionBlockersProps {
	blockers: MissionBlocker[];
}

export function MissionBlockers({ blockers }: MissionBlockersProps) {
	const active = blockers.filter((b) => !b.resolved);
	const resolved = blockers.filter((b) => b.resolved);

	if (blockers.length === 0) {
		return null;
	}

	return (
		<section>
			<h2 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
				Bloqueadores
				{active.length > 0 && (
					<span className="ml-2 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-2xs font-normal text-[var(--color-danger)]">
						{active.length} activo{active.length !== 1 ? "s" : ""}
					</span>
				)}
			</h2>

			<div className="space-y-2">
				{active.map((blocker) => {
					const Icon = SEVERITY_ICON[blocker.severity] ?? AlertTriangle;
					const color =
						SEVERITY_COLOR[blocker.severity] ?? "text-[var(--color-warning)]";

					return (
						<div
							key={blocker.id}
							className="flex items-start gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2"
						>
							<div className={`mt-0.5 shrink-0 ${color}`}>
								<Icon className="size-4" aria-hidden />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium text-[var(--text-primary)]">
									{blocker.reason}
								</p>
								<p className="text-2xs text-[var(--text-tertiary)]">
									{SEVERITY_LABEL[blocker.severity]}
								</p>
							</div>
						</div>
					);
				})}

				{resolved.length > 0 && (
					<details className="group">
						<summary className="cursor-pointer text-2xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
							{resolved.length} bloqueador{resolved.length !== 1 ? "es" : ""}{" "}
							resuelto
							{resolved.length !== 1 ? "s" : ""}
						</summary>
						<div className="mt-2 space-y-2">
							{resolved.map((blocker) => (
								<div
									key={blocker.id}
									className="flex items-start gap-3 rounded-lg px-3 py-2"
								>
									<div className="mt-0.5 shrink-0 text-[var(--color-success)]">
										<CheckCircle2 className="size-4" aria-hidden />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs text-[var(--text-muted)] line-through">
											{blocker.reason}
										</p>
									</div>
								</div>
							))}
						</div>
					</details>
				)}
			</div>
		</section>
	);
}
