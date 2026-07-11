import { FileCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxGateItem {
	id: string;
	label: string;
	status: "verified" | "warning" | "blocked";
	detail: string;
}

interface TaxReviewGateProps {
	period: string;
	items: TaxGateItem[];
	verdict: "ready" | "attention" | "blocked";
}

const VERDICT_CONFIG = {
	ready: {
		icon: FileCheck,
		label: "Listo para declarar",
		color:
			"text-[var(--color-success)] border-[var(--color-success)]/20 bg-[var(--color-success)]/5",
	},
	attention: {
		icon: ShieldAlert,
		label: "Requiere atención antes de declarar",
		color:
			"text-[var(--color-warning)] border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5",
	},
	blocked: {
		icon: ShieldAlert,
		label: "No se puede declarar hasta resolver bloqueos",
		color:
			"text-[var(--color-danger)] border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5",
	},
} as const;

const ITEM_STATUS = {
	verified: "text-[var(--color-success)]",
	warning: "text-[var(--color-warning)]",
	blocked: "text-[var(--color-danger)]",
} as const;

export function TaxReviewGate({ period, items, verdict }: TaxReviewGateProps) {
	const config = VERDICT_CONFIG[verdict];
	const Icon = config.icon;

	return (
		<section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
						Gate fiscal — {period}
					</h2>
					<p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
						Revisión previa a declaración
					</p>
				</div>
				<div
					className={cn(
						"flex items-center gap-2 rounded-xl border px-3 py-2",
						config.color,
					)}
				>
					<Icon size={16} />
					<span className="text-xs font-semibold">{config.label}</span>
				</div>
			</div>

			<div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<div
						key={item.id}
						className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-medium text-[var(--text-primary)]">
								{item.label}
							</span>
							<span
								className={cn(
									"text-[10px] font-semibold",
									ITEM_STATUS[item.status],
								)}
							>
								{item.status === "verified" && "Verificado"}
								{item.status === "warning" && "Atención"}
								{item.status === "blocked" && "Bloqueado"}
							</span>
						</div>
						<p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
							{item.detail}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
