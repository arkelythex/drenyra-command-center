import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgressHeaderProps {
	companyName: string;
	companyRuc: string;
	periodo: string;
	completedCount: number;
	totalCount: number;
	progress: number;
}

export function ProgressHeader({
	companyName,
	companyRuc,
	periodo,
	completedCount,
	totalCount,
	progress,
}: ProgressHeaderProps) {
	return (
		<header className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Building2
						size={22}
						className="text-[var(--color-info)]"
						strokeWidth={1.5}
					/>
					<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
						Cierre Mensual
					</h1>
				</div>
				<Button size="sm" variant="outline" className="h-8 text-2xs font-bold">
					Cambiar empresa
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-4 text-xs">
				<span className="text-[var(--text-secondary)]">
					{companyName} · RUC {companyRuc}
				</span>
				<span className="text-[var(--text-tertiary)]">Período {periodo}</span>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-2xs">
					<span className="font-bold text-[var(--text-secondary)]">
						{completedCount} de {totalCount} completados
					</span>
					<span className="font-bold text-[var(--color-info)]">
						{Math.round(progress * 100)}%
					</span>
				</div>
				<div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
					<div
						className="h-full rounded-full transition-all duration-500 bg-[var(--color-info)]"
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
			</div>
		</header>
	);
}
