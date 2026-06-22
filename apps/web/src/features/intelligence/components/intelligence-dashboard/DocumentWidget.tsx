import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DocumentDisplayData } from "../../types/intelligence.types";
import { ConfidenceBar } from "../widgets/SeverityBadge";

interface DocumentWidgetProps {
	data: DocumentDisplayData | null;
	isLoading: boolean;
}

const DOC_TYPE_COLORS: Record<string, string> = {
	invoice: "var(--color-primary)",
	receipt: "var(--color-success)",
	identity: "var(--color-warning)",
	contract: "var(--color-info)",
	bank_statement: "var(--color-danger)",
	sunat_xml: "var(--text-muted)",
};

export function DocumentWidget({ data, isLoading }: DocumentWidgetProps) {
	if (isLoading) return <DocumentWidgetSkeleton />;

	if (!data) {
		return (
			<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
				<EmptyState />
			</div>
		);
	}

	const avgConfidencePct = Math.round(data.averageConfidence * 100);

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
						<FileText className="w-5 h-5 text-[var(--color-primary)]" />
					</div>
					<div>
						<h3 className="n font-semibold tracking-tight text-foreground">
							Clasificación de Documentos
						</h3>
						<p className="text-xs text-[var(--text-secondary)]">
							{data.totalClassified} documentos · Confianza promedio{" "}
							{avgConfidencePct}%
						</p>
					</div>
				</div>
			</div>

			{/* Type distribution */}
			{data.typeBreakdown.length > 0 && (
				<div className="flex items-center gap-4 mb-4">
					<div className="w-24 h-24 shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data.typeBreakdown}
									cx="50%"
									cy="50%"
									innerRadius={22}
									outerRadius={38}
									dataKey="count"
									nameKey="type"
								>
									{data.typeBreakdown.map((entry) => (
										<Cell
											key={entry.type}
											fill={DOC_TYPE_COLORS[entry.type] ?? "var(--text-muted)"}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										background: "var(--surface-1)",
										border: "1px solid var(--border-subtle)",
										borderRadius: "8px",
										fontSize: "12px",
									}}
									formatter={(value: number, name: string) => [value, name]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="flex-1 space-y-1.5">
						{data.typeBreakdown.map((entry) => (
							<div
								key={entry.type}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<span
										className="w-2 h-2 rounded-full"
										style={{
											backgroundColor:
												DOC_TYPE_COLORS[entry.type] ?? "var(--text-muted)",
										}}
									/>
									<span className="text-xs text-[var(--text-secondary)] capitalize">
										{entry.type.replace(/_/g, " ")}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-[var(--text-primary)] tabular-nums">
										{entry.count}
									</span>
									<span className="text-xs text-[var(--text-muted)] tabular-nums">
										({entry.percentage.toFixed(0)}%)
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Average confidence */}
			<div className="p-3 rounded-lg bg-[var(--surface-2)]/50 mb-4">
				<div className="flex items-center justify-between mb-1.5">
					<span className="text-xs text-[var(--text-secondary)]">
						Confianza Promedio
					</span>
					<span
						className={`text-xs font-semibold ${avgConfidencePct >= 80 ? "text-[var(--color-success)]" : avgConfidencePct >= 50 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}`}
					>
						{avgConfidencePct}%
					</span>
				</div>
				<ConfidenceBar value={data.averageConfidence} />
			</div>

			{/* Recent classifications */}
			{data.recentResults.length > 0 && (
				<div className="pt-3 border-t border-[var(--border-subtle)]">
					<p className="text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
						Recientes
					</p>
					<div className="space-y-1.5">
						{data.recentResults.slice(0, 3).map((r) => (
							<div key={r.id} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{r.confidence >= 0.8 ? (
										<CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
									) : (
										<AlertCircle className="w-3.5 h-3.5 text-[var(--color-warning)]" />
									)}
									<span className="text-xs text-[var(--text-primary)] capitalize truncate max-w-[120px]">
										{r.type.replace(/_/g, " ")}
									</span>
								</div>
								<span className="text-xs text-[var(--text-muted)] tabular-nums">
									{Math.round(r.confidence * 100)}%
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function EmptyState() {
	return (
		<>
			<div className="flex items-center gap-3 mb-5">
				<div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
					<FileText className="w-5 h-5 text-[var(--color-primary)]" />
				</div>
				<div>
					<h3 className="n font-semibold tracking-tight text-foreground">
						Clasificación de Documentos
					</h3>
				</div>
			</div>
			<div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
				<FileText className="w-8 h-8 mb-2 opacity-50" />
				<p className="text-sm">Carga documentos para ver clasificación</p>
			</div>
		</>
	);
}

function DocumentWidgetSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-5">
				<div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
				<div className="space-y-1.5">
					<div className="h-4 w-48 bg-[var(--surface-2)] rounded" />
					<div className="h-3 w-36 bg-[var(--surface-2)] rounded" />
				</div>
			</div>
			<div className="h-24 bg-[var(--surface-2)] rounded-lg mb-3" />
			<div className="h-10 bg-[var(--surface-2)] rounded-lg" />
		</div>
	);
}
