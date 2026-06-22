import { Building2, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GroupHeaderCardProps {
	groupName: string;
	groupCode: string;
	subscriptionTier: string;
	monthlyFee: string;
	companiesCount: number;
	onOpenSidebar: () => void;
}

export function GroupHeaderCard({
	groupName,
	groupCode,
	subscriptionTier,
	monthlyFee,
	companiesCount,
	onOpenSidebar,
}: GroupHeaderCardProps) {
	return (
		<div className="backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-8">
			<div className="flex items-start justify-between">
				<Button
					onClick={onOpenSidebar}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden mr-4"
				>
					<Menu className="h-4 w-4 text-muted-foreground" />
				</Button>
				<div>
					<h1 className="text-3xl font-black uppercase tracking-wider text-foreground">
						{groupName}
					</h1>
					<p className="text-muted-foreground text-sm mt-2 font-mono">Codigo: {groupCode}</p>
					<div className="mt-4 flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-primary" />
							<span className="text-sm font-bold text-foreground">{subscriptionTier}</span>
						</div>
						<div className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-muted-foreground" />
							<span className="text-sm font-bold text-foreground">{companiesCount} RUCs</span>
						</div>
					</div>
				</div>

				<div className="text-right">
					<p className="text-xs text-muted-foreground uppercase tracking-wider">Tarifa Mensual</p>
					<p className="text-4xl font-mono font-bold text-primary mt-1">
						S/ {parseFloat(monthlyFee).toFixed(2)}
					</p>
					<p className="text-xs text-muted-foreground mt-1">RUCs Ilimitados</p>
				</div>
			</div>
		</div>
	);
}
