import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { MissionBlocker } from "../mission.types";

const SEVERITY = {
	low: { icon: CircleAlert, label: "Bajo", tone: "text-warning" },
	medium: { icon: CircleAlert, label: "Medio", tone: "text-warning" },
	high: { icon: CircleX, label: "Alto", tone: "text-destructive" },
	critical: { icon: CircleX, label: "Crítico", tone: "text-destructive" },
} as const;

interface MissionBlockersProps {
	blockers: MissionBlocker[];
}

/** Open blockers first, with their severity in words; resolved ones stay collapsed. */
export function MissionBlockers({ blockers }: MissionBlockersProps) {
	if (blockers.length === 0) return null;

	const active = blockers.filter((blocker) => !blocker.resolved);
	const resolved = blockers.filter((blocker) => blocker.resolved);

	return (
		<section className="space-y-3">
			<h2 className="flex items-baseline gap-3 text-base font-medium tracking-tight">
				Bloqueadores
				{active.length > 0 ? (
					<span className="text-sm font-normal text-destructive">
						{active.length} activo{active.length !== 1 ? "s" : ""}
					</span>
				) : null}
			</h2>

			{active.length > 0 ? (
				<ul
					aria-label="Bloqueadores activos"
					className="divide-y divide-border rounded-xl border border-border bg-card"
				>
					{active.map((blocker) => {
						const severity = SEVERITY[blocker.severity] ?? SEVERITY.medium;
						const Icon = severity.icon;
						return (
							<li key={blocker.id} className="flex items-start gap-3 px-4 py-3">
								<Icon
									aria-hidden="true"
									className={`mt-0.5 size-4 shrink-0 ${severity.tone}`}
								/>
								<p className="min-w-0 flex-1 text-sm">{blocker.reason}</p>
								<span className={`shrink-0 text-sm ${severity.tone}`}>
									{severity.label}
								</span>
							</li>
						);
					})}
				</ul>
			) : null}

			{resolved.length > 0 ? (
				<details>
					<summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
						{resolved.length} bloqueador{resolved.length !== 1 ? "es" : ""}{" "}
						resuelto
						{resolved.length !== 1 ? "s" : ""}
					</summary>
					<ul className="space-y-2 pt-1">
						{resolved.map((blocker) => (
							<li
								key={blocker.id}
								className="flex items-start gap-3 px-1 text-sm text-muted-foreground"
							>
								<CircleCheck
									aria-hidden="true"
									className="mt-0.5 size-4 shrink-0 text-success"
								/>
								<span className="line-through">{blocker.reason}</span>
							</li>
						))}
					</ul>
				</details>
			) : null}
		</section>
	);
}
