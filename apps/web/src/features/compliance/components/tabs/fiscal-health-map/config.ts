import {
	Activity,
	Building2,
	DollarSign,
	type LucideIcon,
	ShieldCheck,
} from "lucide-react";
import type { RiskCategory, RiskSeverity } from "./types";

export const RISK_FILTERS = [
	"all",
	"critical",
	"high",
	"medium",
	"low",
] as const;
export type RiskFilter = (typeof RISK_FILTERS)[number];

export const severityConfig: Record<
	RiskSeverity,
	{ color: string; bg: string; border: string; label: string }
> = {
	critical: {
		color: "text-danger",
		bg: "bg-danger-muted",
		border: "border-danger-muted",
		label: "CRITICO",
	},
	high: {
		color: "text-warning",
		bg: "bg-warning-soft",
		border: "border-warning-muted",
		label: "ALTO",
	},
	medium: {
		color: "text-warning",
		bg: "bg-warning-muted",
		border: "border-warning-subtle",
		label: "MEDIO",
	},
	low: {
		color: "text-info",
		bg: "bg-info-muted",
		border: "border-info-muted",
		label: "BAJO",
	},
};

export const categoryConfig: Record<
	RiskCategory,
	{ icon: LucideIcon; label: string }
> = {
	fiscal: { icon: Building2, label: "Fiscal" },
	compliance: { icon: ShieldCheck, label: "Compliance" },
	operational: { icon: Activity, label: "Operacional" },
	financial: { icon: DollarSign, label: "Financiero" },
};
