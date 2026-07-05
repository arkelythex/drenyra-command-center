/**
 * VerificationReportView — renderiza los 4 estados de verificación con
 * distinción visual clara entre pass / fail / inconclusive / bypassed.
 *
 * CRÍTICO: inconclusive NO debe verse como pass silencioso.
 * - pass: verde, checkmark
 * - fail: rojo, X, muestra expected vs actual
 * - inconclusive: ámbar, reloj/pendiente, texto explicativo
 * - bypassed: gris, muestra quién autorizó (authorizedBy)
 *
 * @since Jul 2026
 */

import { AlertCircle, CheckCircle2, Clock, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VerificationReport } from "@/stores/agentic-shell.store";

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string): {
	variant: "success" | "danger" | "warning" | "default";
	label: string;
} {
	switch (status) {
		case "pass":
			return { variant: "success", label: "Pasó" };
		case "fail":
			return { variant: "danger", label: "Discrepancia" };
		case "inconclusive":
			return { variant: "warning", label: "Inconcluso" };
		case "bypassed":
			return { variant: "default", label: "Bypass" };
		default:
			return { variant: "default", label: status };
	}
}

function statusIcon(status: string) {
	switch (status) {
		case "pass":
			return <CheckCircle2 size={16} className="text-[var(--color-success)]" />;
		case "fail":
			return <AlertCircle size={16} className="text-[var(--color-danger)]" />;
		case "inconclusive":
			return <Clock size={16} className="text-[var(--color-warning)]" />;
		case "bypassed":
			return <EyeOff size={16} className="text-[var(--text-tertiary)]" />;
		default:
			return null;
	}
}

function statusBgClass(status: string): string {
	switch (status) {
		case "pass":
			return "bg-[var(--color-success)]/5 border-[var(--color-success)]/15";
		case "fail":
			return "bg-[var(--color-danger)]/8 border-[var(--color-danger)]/20";
		case "inconclusive":
			return "bg-[var(--color-warning)]/8 border-[var(--color-warning)]/20";
		case "bypassed":
			return "bg-[var(--surface-2)] border-[var(--border-subtle)] opacity-70";
		default:
			return "bg-[var(--surface-1)] border-[var(--border-subtle)]";
	}
}

// ── Integrity score bar ──────────────────────────────────────────────────────

function IntegrityBar({ score }: { score: number }) {
	const color =
		score >= 90
			? "bg-[var(--color-success)]"
			: score >= 70
				? "bg-[var(--color-warning)]"
				: "bg-[var(--color-danger)]";
	const label = score >= 90 ? "Alta" : score >= 70 ? "Media" : "Baja";

	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-500 ${color}`}
					style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
				/>
			</div>
			<span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)] min-w-[4rem] text-right">
				{score}% · {label}
			</span>
		</div>
	);
}

// ── Finding row ──────────────────────────────────────────────────────────────

function FindingRow({
	finding,
}: {
	finding: VerificationReport["findings"][0];
}) {
	const badge = statusBadge(finding.status);

	return (
		<div className={`rounded-lg border p-3 ${statusBgClass(finding.status)}`}>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 shrink-0">{statusIcon(finding.status)}</div>
				<div className="flex-1 min-w-0">
					<div className="mb-1 flex items-center gap-2">
						<Badge variant={badge.variant}>{badge.label}</Badge>
						<span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">
							{finding.rule}
						</span>
					</div>
					<p className="text-sm text-[var(--text-primary)] leading-relaxed">
						{finding.finding}
					</p>
					{finding.status === "fail" && (
						<div className="mt-2 grid grid-cols-2 gap-2 text-xs">
							<div className="rounded bg-[var(--color-danger)]/5 p-2">
								<span className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
									Esperado
								</span>
								<span className="font-medium text-[var(--text-primary)]">
									{finding.expected ?? "—"}
								</span>
							</div>
							<div className="rounded bg-[var(--color-danger)]/5 p-2">
								<span className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
									Actual
								</span>
								<span className="font-medium text-[var(--color-danger)]">
									{finding.actual ?? "—"}
								</span>
							</div>
						</div>
					)}
					{finding.detail && (
						<p className="mt-1 text-xs text-[var(--text-tertiary)] italic">
							{finding.detail}
						</p>
					)}
					{finding.status === "bypassed" && "authorizedBy" in finding && (
						<div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
							<span className="font-medium">Autorizado por:</span>
							<span>
								{
									(
										finding as {
											authorizedBy: { userId: string; role: string };
										}
									).authorizedBy.userId
								}
							</span>
							<span className="text-[var(--border-subtle)]">·</span>
							<span className="text-[var(--text-tertiary)]">
								{
									(
										finding as {
											authorizedBy: { userId: string; role: string };
										}
									).authorizedBy.role
								}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ── Main component ───────────────────────────────────────────────────────────

interface VerificationReportViewProps {
	report: VerificationReport;
}

export function VerificationReportView({
	report,
}: VerificationReportViewProps) {
	const passedCount = report.findings.filter((f) => f.status === "pass").length;
	const failedCount = report.findings.filter((f) => f.status === "fail").length;
	const inconclusiveCount = report.findings.filter(
		(f) => f.status === "inconclusive",
	).length;
	const bypassedCount = report.findings.filter(
		(f) => f.status === "bypassed",
	).length;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-semibold">
						Verificación de Intención↔Acción
					</CardTitle>
					<Badge
						variant={
							failedCount > 0
								? "danger"
								: inconclusiveCount > 0
									? "warning"
									: "success"
						}
					>
						{report.adjustedConfidence}% confianza ajustada
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Integrity bar */}
				<IntegrityBar score={report.integrityScore} />

				{/* Summary counts */}
				<div className="flex gap-3 text-xs">
					<span className="text-[var(--color-success)] font-medium">
						{passedCount} pasadas
					</span>
					{failedCount > 0 && (
						<span className="text-[var(--color-danger)] font-medium">
							{failedCount} discrepancia(s)
						</span>
					)}
					{inconclusiveCount > 0 && (
						<span className="text-[var(--color-warning)] font-medium">
							{inconclusiveCount} inconclusa(s)
						</span>
					)}
					{bypassedCount > 0 && (
						<span className="text-[var(--text-tertiary)] font-medium">
							{bypassedCount} bypass(s)
						</span>
					)}
				</div>

				{/* Per-rule metrics */}
				{report.metrics.perRuleMetrics && (
					<details className="group text-xs">
						<summary className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] font-medium">
							Desglose por regla (
							{Object.keys(report.metrics.perRuleMetrics).length} reglas)
						</summary>
						<div className="mt-2 space-y-1.5">
							{Object.entries(report.metrics.perRuleMetrics).map(
								([rule, data]) => {
									const inconclusivePct =
										data.total > 0
											? Math.round((data.inconclusive / data.total) * 100)
											: 0;
									return (
										<div
											key={rule}
											className="flex items-center justify-between rounded bg-[var(--surface-2)] px-2.5 py-1.5"
										>
											<span className="font-mono text-[11px] text-[var(--text-secondary)]">
												{rule}
											</span>
											<div className="flex items-center gap-3 text-[11px]">
												<span className="text-[var(--color-success)]">
													{data.passed}✓
												</span>
												{data.failed > 0 && (
													<span className="text-[var(--color-danger)]">
														{data.failed}✗
													</span>
												)}
												{data.inconclusive > 0 && (
													<span
														className={`font-medium ${
															inconclusivePct > 50
																? "text-[var(--color-warning)]"
																: "text-[var(--text-tertiary)]"
														}`}
													>
														{data.inconclusive}? ({inconclusivePct}%)
													</span>
												)}
											</div>
										</div>
									);
								},
							)}
						</div>
					</details>
				)}

				{/* Findings list */}
				{report.summary && (
					<p className="text-xs text-[var(--text-tertiary)] italic leading-relaxed">
						{report.summary}
					</p>
				)}

				{report.findings.length === 0 ? (
					<p className="text-sm text-[var(--text-tertiary)]">
						No se ejecutaron verificaciones.
					</p>
				) : (
					<div className="space-y-2">
						{report.findings.map((finding, i) => (
							<FindingRow key={i} finding={finding} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
