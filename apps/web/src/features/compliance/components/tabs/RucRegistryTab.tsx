import { ArrowUpRight, Building2, Clock, Search } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_VALIDATIONS = [
	{
		id: "1",
		ruc: "20123456789",
		businessName: "Amazon Web Services Peru S.R.L.",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 2 min",
		score: 100,
	},
	{
		id: "2",
		ruc: "20987654321",
		businessName: "Servicios Logísticos S.A.C.",
		status: "ACTIVO",
		condition: "NO HABIDO",
		lastChecked: "Hace 1 hora",
		score: 40,
	},
	{
		id: "3",
		ruc: "20554433221",
		businessName: "Muebles Express E.I.R.L.",
		status: "INACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 5 min",
		score: 10,
	},
	{
		id: "4",
		ruc: "20345678901",
		businessName: "Tecnología Avanzada SAC",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 3 min",
		score: 95,
	},
	{
		id: "5",
		ruc: "20789012345",
		businessName: "Consultoría Estratégica E.I.R.L.",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 45 min",
		score: 88,
	},
	{
		id: "6",
		ruc: "20111222333",
		businessName: "Distribuidora Nacional SAC",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 12 min",
		score: 92,
	},
	{
		id: "7",
		ruc: "20566778899",
		businessName: "Manufactura Peruana S.A.",
		status: "ACTIVO",
		condition: "NO HABIDO",
		lastChecked: "Hace 2 horas",
		score: 35,
	},
	{
		id: "8",
		ruc: "20233445566",
		businessName: "Servicios Profesionales SAC",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 8 min",
		score: 97,
	},
	{
		id: "9",
		ruc: "20877889900",
		businessName: "Comercializadora Global E.I.R.L.",
		status: "INACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 30 min",
		score: 15,
	},
	{
		id: "10",
		ruc: "20444555666",
		businessName: "Inversiones Estratégicas SAC",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 6 min",
		score: 98,
	},
	{
		id: "11",
		ruc: "20677889911",
		businessName: "Transportes Seguros S.A.C.",
		status: "ACTIVO",
		condition: "NO HABIDO",
		lastChecked: "Hace 1.5 horas",
		score: 45,
	},
	{
		id: "12",
		ruc: "20333444555",
		businessName: "Alimentos Saludables SAC",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 15 min",
		score: 89,
	},
	{
		id: "13",
		ruc: "20900111222",
		businessName: "Equipos Industriales E.I.R.L.",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 9 min",
		score: 91,
	},
	{
		id: "14",
		ruc: "20122334455",
		businessName: "Marketing Digital SAC",
		status: "ACTIVO",
		condition: "NO HABIDO",
		lastChecked: "Hace 3 horas",
		score: 28,
	},
	{
		id: "15",
		ruc: "20555666777",
		businessName: "Constructora Moderna S.A.",
		status: "ACTIVO",
		condition: "HABIDO",
		lastChecked: "Hace 4 min",
		score: 99,
	},
];

export const RucRegistryTab = () => {
	const summary = useMemo(() => {
		const active = MOCK_VALIDATIONS.filter(
			(item) => item.status === "ACTIVO",
		).length;
		const inactive = MOCK_VALIDATIONS.filter(
			(item) => item.status !== "ACTIVO",
		).length;
		const noHabido = MOCK_VALIDATIONS.filter(
			(item) => item.condition === "NO HABIDO",
		).length;
		return { active, inactive, noHabido };
	}, []);

	return (
		<div className="space-y-8 animate-entrance">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
				<div>
					<h2 className="text-sm font-black uppercase tracking-widest text-foreground">
						Vigilancia de Contribuyentes
					</h2>
					<p className="text-label text-muted-foreground uppercase tracking-[0.2em] mt-1">
						Sincronizado con base de datos SUNAT
					</p>
					<div className="flex items-center gap-4 mt-2">
						<div className="flex items-center gap-2">
							<div className="ui-dot-success h-2 w-2 rounded-full animate-pulse"></div>
							<span className="text-xs font-bold text-success uppercase tracking-widest">
								{summary.active} ACTIVOS
							</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="ui-dot-danger h-2 w-2 rounded-full"></div>
							<span className="text-xs font-bold text-danger uppercase tracking-widest">
								{summary.inactive} INACTIVOS
							</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="ui-dot-warning h-2 w-2 rounded-full"></div>
							<span className="text-xs font-bold text-warning uppercase tracking-widest">
								{summary.noHabido} NO HABIDO
							</span>
						</div>
					</div>
				</div>
				<div className="relative group">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
					<Input
						placeholder="RUC / Razón Social..."
						className="h-10 w-full rounded-xl border border-border bg-card/70 pl-10 text-sm font-bold uppercase tracking-tight text-foreground placeholder:text-muted-foreground/70 transition-[border-color,box-shadow,color] duration-200 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 md:w-80"
					/>
				</div>
			</div>

			<div className="grid gap-4">
				{MOCK_VALIDATIONS.map((v) => (
					<Card
						key={v.id}
						className="group cursor-default border-border/40 shadow-sm"
					>
						<CardContent className="p-0 flex items-center">
							<div
								className={cn(
									"w-1.5 h-20 shrink-0",
									v.score > 80 ? "bg-foreground" : "bg-muted-foreground/40",
								)}
							/>

							<div className="flex-1 p-6 flex items-center justify-between gap-10">
								<div className="flex items-center gap-6 min-w-0">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted shadow-inner transition-[background-color,color,border-color] duration-200 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
										<Building2 size={20} strokeWidth={1.5} />
									</div>
									<div className="min-w-0">
										<h3 className="font-black text-sm text-foreground uppercase tracking-tight truncate">
											{v.businessName}
										</h3>
										<div className="flex items-center gap-3 mt-1.5 font-mono text-label font-bold text-muted-foreground uppercase">
											<span>RUC: {v.ruc}</span>
											<span className="h-1 w-1 rounded-full bg-border" />
											<span className="flex items-center gap-1">
												<Clock size={10} /> {v.lastChecked}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-12 shrink-0">
									<StatusBadge
										label="Estado"
										value={v.status}
										active={v.status === "ACTIVO"}
									/>
									<StatusBadge
										label="Condición"
										value={v.condition}
										active={v.condition === "HABIDO"}
									/>
									<Button
										variant="ghost"
										size="icon"
										aria-label="Abrir enlace"
										className="h-10 w-10 text-muted-foreground hover:text-foreground"
									>
										<ArrowUpRight size={20} />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};

interface StatusBadgeProps {
	label: string;
	value: string;
	active: boolean;
}

const StatusBadge = ({ label, value, active }: StatusBadgeProps) => (
	<div className="text-center hidden sm:block">
		<p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
			{label}
		</p>
		<span
			className={cn(
				"rounded-lg border px-3 py-1 text-2xs font-black uppercase tracking-widest transition-colors duration-200 shadow-sm",
				active
					? "bg-success-muted text-success border-success-subtle"
					: "bg-muted/30 text-muted-foreground border-border/50 opacity-60",
			)}
		>
			{value}
		</span>
	</div>
);
