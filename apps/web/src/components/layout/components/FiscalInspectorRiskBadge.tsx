import { FISCAL_RISK_COLORS } from "@drenyra/domain";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { RISK_BG } from "../FiscalInspector.data";
import type { RiskBadgeProps } from "../FiscalInspector.types";

/**
 * Displays the fiscal risk level with icon, label, and impact description.
 */
export function FiscalInspectorRiskBadge({
	riskLevel,
	impact,
}: RiskBadgeProps) {
	const RiskIcon =
		riskLevel === "LOW"
			? CheckCircle2
			: riskLevel === "CRITICAL"
				? AlertTriangle
				: ShieldAlert;

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-xl border px-3 py-2",
				RISK_BG[riskLevel],
			)}
		>
			<RiskIcon size={14} style={{ color: FISCAL_RISK_COLORS[riskLevel] }} />
			<span
				className="text-2xs font-bold uppercase"
				style={{ color: FISCAL_RISK_COLORS[riskLevel] }}
			>
				{riskLevel}
			</span>
			<span className="text-2xs text-[var(--color-text-secondary)] ml-auto">
				{impact}
			</span>
		</div>
	);
}
