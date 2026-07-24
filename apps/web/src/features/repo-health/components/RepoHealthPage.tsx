import { useRepoHealth } from "../hooks/useRepoHealth";

function HealthScoreCard({
	score,
	label,
	color,
}: {
	score: number;
	label: string;
	color: string;
}) {
	const barColor = color.replace("text-", "bg-");
	return (
		<div className="glass-panel rounded-xl p-6 border border-border/40">
			<h3 className="text-sm font-medium text-muted-foreground mb-2">
				Salud del Repositorio
			</h3>
			<div className="flex items-baseline gap-2">
				<span className={`text-4xl font-bold ${color}`}>{score}%</span>
				<span className={`text-sm font-medium ${color}`}>{label}</span>
			</div>
			<div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-500 ${barColor}`}
					style={{ width: `${score}%` }}
				/>
			</div>
		</div>
	);
}

function IssuesList({
	title,
	issues,
	emptyMessage,
}: {
	title: string;
	issues: Array<{
		number: number;
		title: string;
		state: string;
		updatedAt?: string;
	}>;
	emptyMessage: string;
}) {
	return (
		<div className="glass-panel rounded-xl p-6 border border-border/40">
			<h3 className="text-sm font-medium text-muted-foreground mb-4">
				{title}
			</h3>
			{issues.length === 0 ? (
				<p className="text-sm text-muted-foreground/60">{emptyMessage}</p>
			) : (
				<ul className="space-y-3">
					{issues.map((issue) => (
						<li
							key={issue.number}
							className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
						>
							<span
								className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
									issue.state === "open" ? "bg-green-500" : "bg-gray-400"
								}`}
							/>
							<div className="min-w-0 flex-1">
								<a
									href={`https://github.com/arkelythex/Drenyra/issues/${issue.number}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-medium hover:underline truncate block"
								>
									#{issue.number} {issue.title}
								</a>
								{issue.updatedAt && (
									<p className="text-xs text-muted-foreground/60 mt-0.5">
										Actualizado:{" "}
										{new Date(issue.updatedAt).toLocaleDateString()}
									</p>
								)}
							</div>
							<span className="text-xs uppercase font-medium text-muted-foreground/50 flex-shrink-0">
								{issue.state}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function WorkflowStatusBadge({
	name,
	status,
}: {
	name: string;
	status: string;
}) {
	const colorMap: Record<string, string> = {
		success: "bg-green-500/20 text-green-600",
		failure: "bg-red-500/20 text-red-600",
		cancelled: "bg-gray-500/20 text-gray-600",
		pending: "bg-yellow-500/20 text-yellow-600",
	};
	const color = colorMap[status] ?? "bg-gray-500/20 text-gray-600";
	return (
		<div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
			<span className={`w-2 h-2 rounded-full ${color.split(" ")[0]}`} />
			<span className="text-xs font-medium">{name}</span>
			<span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>
		</div>
	);
}

const WORKFLOWS = [
	{ name: "Post-Merge Verification", status: "success" },
	{ name: "Judgment Day Review", status: "success" },
	{ name: "Auto-SDD", status: "success" },
	{ name: "SDD Auto-Implementation", status: "success" },
	{ name: "Auto-Healing", status: "pending" },
];

export function RepoHealthPage() {
	const { healthScore, mergeHealthIssues, autoSddProposals, isLoading } =
		useRepoHealth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-pulse text-muted-foreground">
					Cargando salud del repositorio...
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Salud del Repositorio</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Monitoreo automático del ecosistema de auto-mejora
				</p>
			</div>

			{/* Health Score */}
			<HealthScoreCard
				score={healthScore.score}
				label={healthScore.label}
				color={healthScore.color}
			/>

			{/* Workflows Grid */}
			<div className="glass-panel rounded-xl p-6 border border-border/40">
				<h3 className="text-sm font-medium text-muted-foreground mb-4">
					Workflows de Auto-Mejora
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{WORKFLOWS.map((wf) => (
						<WorkflowStatusBadge
							key={wf.name}
							name={wf.name}
							status={wf.status}
						/>
					))}
				</div>
			</div>

			{/* Two-column layout for issues */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<IssuesList
					title="Merge Health"
					issues={mergeHealthIssues}
					emptyMessage="No hay issues de merge health. Todo estable."
				/>
				<IssuesList
					title="Auto-SDD Proposals"
					issues={autoSddProposals}
					emptyMessage="No hay propuestas SDD activas."
				/>
			</div>
		</div>
	);
}
