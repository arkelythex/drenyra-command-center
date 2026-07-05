import { Clock, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import type { FiscalRiskLevel } from "@drenyra/domain";
import type { DrenyraApproval } from "@/features/drenyra-workspace";
import type { ApprovalItem } from "./ApprovalHubPage.types";

export const MODULE_LABELS: Record<string, string> = {
	sire: "SIRE",
	compras: "Compras",
	ventas: "Ventas",
	conciliacion: "Conciliación",
	cierre: "Cierre",
	bancos: "Bancos",
	facturacion: "Facturación",
	invoice: "Facturación",
	bill: "Pagos",
	banking: "Bancos",
	cashflow: "Flujo de Caja",
	reconciliation: "Conciliación",
	customer: "Clientes",
	vendor: "Proveedores",
	product: "Productos",
	inventory: "Inventario",
	document: "Documentos",
	taxation: "Tributación",
	compliance: "Cumplimiento",
	settings: "Configuración",
};

export const STATUS_MAP: Record<string, ApprovalItem["status"]> = {
	proposed: "PENDING",
	validated: "PENDING",
	approved: "APPROVED",
	rejected: "REJECTED",
};

export const RISK_MAP: Record<string, FiscalRiskLevel> = {
	auto: "LOW",
	notify: "LOW",
	gate: "MEDIUM",
	fiscal_gate: "CRITICAL",
};

interface StatusBadgeConfig {
	icon: LucideIcon;
	color: string;
	bg: string;
	label: string;
}

export const STATUS_BADGE: Record<string, StatusBadgeConfig> = {
	PENDING: {
		icon: Clock,
		color: "var(--color-warning)",
		bg: "bg-[var(--color-warning)]/8 border-[var(--color-warning)]/20 text-[var(--color-warning)]",
		label: "Pendiente",
	},
	APPROVED: {
		icon: CheckCircle2,
		color: "var(--color-success)",
		bg: "bg-[var(--color-success)]/8 border-[var(--color-success)]/20 text-[var(--color-success)]",
		label: "Aprobado",
	},
	REJECTED: {
		icon: XCircle,
		color: "var(--color-danger)",
		bg: "bg-[var(--color-danger)]/8 border-[var(--color-danger)]/20 text-[var(--color-danger)]",
		label: "Rechazado",
	},
};

export function mapToApprovalItem(ka: DrenyraApproval): ApprovalItem {
	const isApproved = ka.state === "approved";
	const isRejected = ka.state === "rejected";
	return {
		id: ka.id,
		summary: ka.summary,
		module: ka.module,
		companyRuc: ka.ruc,
		companyName: ka.companyId,
		riskLevel: RISK_MAP[ka.approvalLevel] ?? "MEDIUM",
		status: STATUS_MAP[ka.state] ?? "PENDING",
		proposedBy: "Agente",
		createdAt: ka.proposedAt,
		approvedBy: isApproved ? ka.reviewerId : undefined,
		approvedAt: isApproved ? ka.decidedAt : undefined,
		rejectedBy: isRejected ? ka.reviewerId : undefined,
		rejectionReason: isRejected ? ka.rationale : undefined,
		urgency: ka.approvalLevel === "fiscal_gate" ? "URGENT" : "NORMAL",
	};
}
