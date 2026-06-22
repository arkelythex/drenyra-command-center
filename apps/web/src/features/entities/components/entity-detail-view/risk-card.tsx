import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface EntityRiskCardProps {
	complianceScore: number;
	riskLevel: string;
}

export function EntityRiskCard({
	complianceScore,
	riskLevel,
}: EntityRiskCardProps) {
	const scoreColor =
		complianceScore > 90
			? "bg-[var(--premium-success)]"
			: complianceScore > 70
				? "bg-warning"
				: "bg-danger";

	const scoreLabel =
		complianceScore > 90
			? "Excelente"
			: complianceScore > 70
				? "Estable"
				: "Riesgo Alto";

	return (
		<Card className="group relative overflow-hidden p-8 shadow-sm">
			<div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
				<ShieldCheck size={120} />
			</div>
			<h3
				className="text-2xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6"
			>
				Salud fiscal
			</h3>
			<div className="flex items-end gap-4">
				<span
					className="text-6xl font-black text-foreground tabular-nums tracking-tighter"
				>
					{complianceScore}
				</span>
				<span className="text-xl font-bold text-muted-foreground mb-2">/100</span>
			</div>
			<div className="mt-8 space-y-4">
				<div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-border/50">
					<div
						className={cn(
							"h-full rounded-full shadow-[0_0_15px_currentColor] transition-[width,background-color,box-shadow,opacity] duration-700",
							scoreColor,
						)}
						style={{ width: `${complianceScore}%` }}
					/>
				</div>
				<div className="flex justify-between items-center text-label font-black uppercase tracking-widest">
					<span className={complianceScore > 90 ? "text-success" : complianceScore > 70 ? "text-warning" : "text-danger"}>
						{scoreLabel}
					</span>
					<span className="text-muted-foreground">Nivel {riskLevel}</span>
				</div>
			</div>
		</Card>
	);
}
