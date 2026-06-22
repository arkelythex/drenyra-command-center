import { AlertTriangle, BadgePercent, ScanSearch } from "lucide-react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";

interface VendorAuditSidebarProps {
	stats: { totalSpend: number; criticalCount: number; retentionAgents: number };
}

interface AuditKpiProps {
	label: string;
	value: string;
	sub: string;
	icon: React.ReactNode;
	alert?: boolean;
}

export const VendorAuditSidebar = ({ stats }: VendorAuditSidebarProps) => {
	const safeStats = stats || {
		totalSpend: 0,
		criticalCount: 0,
		retentionAgents: 0,
	};

	return (
		<div className="h-full space-y-6 bg-background p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-label font-semibold tracking-[0.14em] text-muted-foreground">
					Control fiscal
				</h2>
				<div className="rounded border border-border bg-muted px-2 py-0.5 text-2xs font-medium tracking-wide text-muted-foreground">
					En línea
				</div>
			</div>

			<div className="space-y-4">
				<AuditKPI
					label="Gasto acumulado"
					value={n(safeStats.totalSpend || 0)}
					sub="Transacciones validadas"
					icon={<ScanSearch size={16} />}
				/>
				<AuditKPI
					label="Riesgo de habido"
					value={(safeStats.criticalCount || 0).toString()}
					sub="Proveedores observados"
					icon={<AlertTriangle size={16} />}
					alert={(safeStats.criticalCount || 0) > 0}
				/>
				<AuditKPI
					label="Agentes SUNAT"
					value={(safeStats.retentionAgents || 0).toString()}
					sub="Sujetos a retención"
					icon={<BadgePercent size={16} />}
				/>
			</div>
		</div>
	);
};

const AuditKPI = ({ label, value, sub, icon, alert }: AuditKpiProps) => (
	<Card
		className={cn(
			"transition-[background-color,border-color,box-shadow,transform,color] duration-200",
			alert
				? "border-warning/30 bg-warning/10 shadow-sm"
				: "border-border/60 bg-card shadow-sm",
		)}
	>
		<CardContent className="p-5">
			<div className="flex justify-between items-start mb-4">
				<p
					className={cn(
						"text-2xs font-medium tracking-wide",
						alert ? "text-warning" : "text-muted-foreground",
					)}
				>
					{label}
				</p>
				<div
					className={cn(
						"rounded-lg border p-1.5",
						alert
							? "border-warning/30 bg-warning/10 text-warning"
							: "border-border bg-muted text-muted-foreground",
					)}
				>
					{icon}
				</div>
			</div>
			<p
				className={cn(
					"font-mono text-2xl font-semibold tracking-tight tabular-nums",
					alert ? "text-warning" : "text-foreground",
				)}
			>
				{value}
			</p>
			<p
				className={cn(
					"mt-2 text-2xs font-medium tracking-wide",
					alert ? "text-warning/80" : "text-muted-foreground",
				)}
			>
				{sub}
			</p>
		</CardContent>
	</Card>
);
