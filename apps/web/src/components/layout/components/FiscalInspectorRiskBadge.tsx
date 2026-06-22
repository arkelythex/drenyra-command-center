import { cn } from "@/lib/utils";
import { FISCAL_RISK_COLORS } from "@arkelythex/domain";
import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import type { RiskBadgeProps } from "../FiscalInspector.types";
import { RISK_BG } from "../FiscalInspector.data";

/**
 * Displays the fiscal risk level with icon, label, and impact description.
 */
export function FiscalInspectorRiskBadge({ riskLevel, impact }: RiskBadgeProps) {
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
