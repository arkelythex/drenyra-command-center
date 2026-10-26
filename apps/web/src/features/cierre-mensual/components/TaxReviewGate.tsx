import { CircleAlert, CircleCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxGateItem {
	id: string;
	label: string;
	status: "verified" | "warning" | "blocked";
	/** Only for what is specific to this control; shared context goes in `summary`. */
	detail?: string;
}

interface TaxReviewGateProps {
	period: string;
	items: TaxGateItem[];
	verdict: "ready" | "attention" | "blocked";
	/** One note that applies to every control (e.g. no evidence yet). */
	summary?: string;
}

const VERDICT = {
	ready: {
		icon: CircleCheck,
		label: "Listo para declarar",
		tone: "text-success",
	},
	attention: {
		icon: ShieldAlert,
		label: "Requiere atención antes de declarar",
		tone: "text-warning",
	},
	blocked: {
		icon: ShieldAlert,
		label: "No se puede declarar hasta resolver bloqueos",
		tone: "text-destructive",
	},
} as const;

const ITEM = {
	verified: { icon: CircleCheck, label: "Verificado", tone: "text-success" },
	warning: { icon: CircleAlert, label: "Atención", tone: "text-warning" },
	blocked: { icon: CircleAlert, label: "Bloqueado", tone: "text-destructive" },
} as const;

/** Pre-filing review: one verdict, the shared note once, then one row per control. */
export function TaxReviewGate({
	period,
	items,
	verdict,
	summary,
}: TaxReviewGateProps) {
	const { icon: VerdictIcon, label, tone } = VERDICT[verdict];

	return (
		<section aria-labelledby="tax-gate-title" className="space-y-3">
			<div className="space-y-1">
				<h2
					id="tax-gate-title"
					className="text-base font-medium tracking-tight"
				>
					Revisión previa a la declaración
				</h2>
				<p className="text-sm text-muted-foreground">Período {period}</p>
			</div>

			<p className={cn("flex items-center gap-2 text-sm font-medium", tone)}>
				<VerdictIcon aria-hidden="true" className="size-4" />
				{label}
			</p>
			{summary ? (
				<p className="text-sm text-muted-foreground">{summary}</p>
			) : null}

			<ul
				aria-label="Controles fiscales"
				className="divide-y divide-border rounded-xl border border-border bg-card"
			>
				{items.map((item) => {
					const status = ITEM[item.status];
					const StatusIcon = status.icon;
					return (
						<li
							key={item.id}
							className="flex items-center justify-between gap-4 px-4 py-3"
						>
							<div className="min-w-0">
								<p className="text-sm">{item.label}</p>
								{item.detail ? (
									<p className="mt-0.5 text-sm text-muted-foreground">
										{item.detail}
									</p>
								) : null}
							</div>
							<span
								className={cn(
									"flex shrink-0 items-center gap-1.5 text-sm",
									status.tone,
								)}
							>
								<StatusIcon aria-hidden="true" className="size-4" />
								{status.label}
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
