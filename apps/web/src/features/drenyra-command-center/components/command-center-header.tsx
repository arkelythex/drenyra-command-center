import type { CompanyContext } from "@/lib/company-context";
import type { FiscalRiskLevel } from "../api/drenyra-command-center.api";
import { FiscalRiskBadge } from "./fiscal-risk-badge";

export interface CommandCenterHeaderProps {
	companyContext: CompanyContext;
	riskLevel: FiscalRiskLevel;
	riskScore: number;
	pendingApprovals: number;
}

export function CommandCenterHeader({
	companyContext,
	riskLevel,
	riskScore,
	pendingApprovals,
}: CommandCenterHeaderProps) {
	return (
		<header className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4 shadow-2xl shadow-black/10 xl:flex-row xl:items-center xl:justify-between">
			<div>
				<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					{companyContext.companyName} · RUC {companyContext.ruc}
				</p>
				<h2 className="mt-1 text-lg font-bold">
					Workspace fiscal evidence-first
				</h2>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<FiscalRiskBadge riskLevel={riskLevel} score={riskScore} />
				<span className="rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-1 text-2xs font-bold text-[var(--color-warning)]">
					{pendingApprovals} aprobaciones
				</span>
			</div>
		</header>
	);
}
