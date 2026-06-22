import { AlertTriangle, Building2, MapPin, TrendingDown } from "lucide-react";
import { StatCard } from "./stat-card";

export function AssetsKpiGrid() {
	return (
		<div className="px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 mb-8">
			<StatCard
				icon={<Building2 size={18} />}
				label="Valor Activos Netos"
				value="S/ 1,245,000"
				trend="+12.5% vs AA"
				trendColor="text-success"
			/>
			<StatCard
				icon={<TrendingDown size={18} />}
				label="Depreciacion Mensual"
				value="S/ 12,450"
				trend="Automatica (Linea Recta)"
				trendColor="text-muted-foreground"
			/>
			<StatCard
				icon={<AlertTriangle size={18} />}
				label="Alertas Mantto."
				value="3 Criticas"
				trend="Requiere Atencion"
				trendColor="text-destructive"
				isAlert
			/>
			<StatCard
				icon={<MapPin size={18} />}
				label="Tasa de Ubicacion"
				value="98.5%"
				trend="5 Sedes Trackeadas"
				trendColor="text-primary"
			/>
		</div>
	);
}
