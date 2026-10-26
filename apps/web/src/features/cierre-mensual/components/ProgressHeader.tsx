interface ProgressHeaderProps {
	companyName: string;
	companyRuc: string;
	periodo: string;
	completedCount: number;
	totalCount: number;
	/** 0..1 share of tasks done. */
	progress: number;
}

/** Page header of the monthly close. The company switcher lives in the workspace top bar. */
export function ProgressHeader({
	companyName,
	companyRuc,
	periodo,
	completedCount,
	totalCount,
	progress,
}: ProgressHeaderProps) {
	const percent = Math.round(progress * 100);

	return (
		<header className="space-y-4">
			<div className="space-y-1">
				<h1 className="text-2xl font-medium tracking-tight text-foreground">
					Cierre mensual
				</h1>
				<p className="text-sm text-muted-foreground">
					{companyName} · RUC {companyRuc} · Período {periodo}
				</p>
			</div>

			{totalCount > 0 ? (
				<div className="space-y-2">
					<div className="flex items-baseline justify-between text-sm">
						<span className="text-muted-foreground">
							{completedCount} de {totalCount} tareas
						</span>
						<span className="font-mono tabular-nums text-foreground">
							{percent}%
						</span>
					</div>
					<div
						role="progressbar"
						aria-label="Avance del cierre"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={percent}
						className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
					>
						<div
							className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
							style={{ width: `${percent}%` }}
						/>
					</div>
				</div>
			) : null}
		</header>
	);
}
