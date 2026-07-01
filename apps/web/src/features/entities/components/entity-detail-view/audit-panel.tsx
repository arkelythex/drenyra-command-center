import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import { AuditTrail } from "../EntityDetails/AuditTrail";

interface EntityAuditPanelProps {
	entityId: string;
	onTabSelect: () => void;
}

const AUDIT_TABS = ["Ventas", "Pagos", "Alertas"];

export function EntityAuditPanel({
	entityId,
	onTabSelect,
}: EntityAuditPanelProps) {
	return (
		<SurfacePanel padding="lg" className="min-h-[650px] flex flex-col">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
				<div className="flex items-center gap-5">
					<div className="p-4 rounded-2xl bg-muted/60 text-primary border border-border/60 shadow-inner">
						<History size={24} strokeWidth={1.5} />
					</div>
					<div>
						<h3
							className={cn(
								"text-xl font-black text-foreground uppercase tracking-tight",
								LEGIBILITY.textShadow.light,
							)}
						>
							Audit Trail & Historial
						</h3>
						<p className="text-label font-bold text-muted-foreground uppercase tracking-widest mt-1">
							Trazabilidad de operaciones 2026
						</p>
					</div>
				</div>
				<div className="flex bg-muted/60 p-1 rounded-xl border border-border/60 shadow-sm">
					{AUDIT_TABS.map((tab) => (
						<Button
							key={tab}
							variant="ghost"
							size="sm"
							onClick={onTabSelect}
							className="h-8 px-4 text-xs font-black uppercase tracking-widest hover:bg-muted rounded-lg transition-all"
						>
							{tab}
						</Button>
					))}
				</div>
			</div>

			<div className="flex-1">
				<AuditTrail entityId={entityId} />
			</div>
		</SurfacePanel>
	);
}
