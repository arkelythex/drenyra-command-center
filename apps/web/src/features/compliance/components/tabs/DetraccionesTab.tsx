import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Landmark, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn, n } from "@/lib/utils";

interface DetractionItem {
	id: string;
	reference: string;
	spotCode: string;
	percentage: number;
	amountCents: number;
	status: "pendiente" | "depositado" | "usado" | "liberado";
	createdAt: string;
}

interface DisplayItem {
	id: string;
	reference: string;
	provider: string;
	cat: string;
	rate: string;
	amount: number;
	status: "pending" | "conciled";
	total: number;
}

const MOCK_DATA: DisplayItem[] = [
	{
		id: "1",
		reference: "F001-000456",
		provider: "AWS PERU",
		cat: "Servicios de Nube",
		rate: "12%",
		amount: 540.0,
		status: "pending",
		total: 4500,
	},
	{
		id: "2",
		reference: "F005-001289",
		provider: "TRANSPORTE X",
		cat: "Carga Pesada",
		rate: "4%",
		amount: 48.0,
		status: "conciled",
		total: 1200,
	},
	{
		id: "3",
		reference: "F003-001456",
		provider: "ORACLE CLOUD",
		cat: "Servicios de Nube",
		rate: "12%",
		amount: 816.0,
		status: "pending",
		total: 6800,
	},
	{
		id: "4",
		reference: "F001-000890",
		provider: "AMAZON WEB SERVICES",
		cat: "Servicios de Nube",
		rate: "12%",
		amount: 624.0,
		status: "pending",
		total: 5200,
	},
	{
		id: "5",
		reference: "F002-001234",
		provider: "DIGITALOCEAN",
		cat: "Servicios de Nube",
		rate: "12%",
		amount: 408.0,
		status: "pending",
		total: 3400,
	},
	{
		id: "6",
		reference: "F006-002345",
		provider: "CONSTRUCTORA MODERNA",
		cat: "Construcción Civil",
		rate: "10%",
		amount: 1350.0,
		status: "conciled",
		total: 13500,
	},
	{
		id: "7",
		reference: "F007-003456",
		provider: "EQUIPOS INDUSTRIALES",
		cat: "Maquinaria Pesada",
		rate: "8%",
		amount: 720.0,
		status: "pending",
		total: 9000,
	},
	{
		id: "8",
		reference: "F008-004567",
		provider: "TRANSPORTES PESADOS",
		cat: "Carga Pesada",
		rate: "4%",
		amount: 180.0,
		status: "conciled",
		total: 4500,
	},
	{
		id: "9",
		reference: "F009-005678",
		provider: "LOGISTICA INTEGRAL",
		cat: "Transporte Terrestre",
		rate: "3%",
		amount: 120.0,
		status: "pending",
		total: 4000,
	},
	{
		id: "10",
		reference: "F010-006789",
		provider: "MANUFACTURA NACIONAL",
		cat: "Producción Industrial",
		rate: "6%",
		amount: 480.0,
		status: "conciled",
		total: 8000,
	},
];

function apiStatusToUi(
	status: DetractionItem["status"],
): "pending" | "conciled" {
	if (status === "pendiente") return "pending";
	return "conciled";
}

const fallbackItems: DisplayItem[] = MOCK_DATA;

export const DetraccionesTab = () => {
	const { data: items = [], isLoading } = useQuery<DetractionItem[]>({
		queryKey: ["detractions"],
		queryFn: async () => {
			const res = await api.api.detractions.get();
			const body = await res.json();
			return (body as { data: DetractionItem[] })?.data ?? [];
		},
		refetchInterval: 30_000,
	});

	const displayData: DisplayItem[] = useMemo(() => {
		if (items.length === 0) return fallbackItems;

		return items.map((item) => ({
			id: item.id,
			reference: item.reference,
			provider: `SPOT ${item.spotCode}`,
			cat: `SPOT ${item.spotCode}`,
			rate: `${item.percentage}%`,
			amount: item.amountCents / 100,
			status: apiStatusToUi(item.status),
			total: item.amountCents / 100,
		}));
	}, [items]);

	const pendingCount = useMemo(
		() => displayData.filter((d) => d.status === "pending").length,
		[displayData],
	);
	const conciledCount = useMemo(
		() => displayData.filter((d) => d.status === "conciled").length,
		[displayData],
	);

	if (isLoading && items.length === 0) {
		return (
			<div className="space-y-8 animate-entrance px-2">
				<div className="flex items-center justify-center py-16">
					<div className="text-center">
						<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground mx-auto mb-4" />
						<p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
							Cargando detracciones...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-entrance">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
				<div>
					<h2 className="text-sm font-black uppercase tracking-widest text-foreground">
						Control de Detracciones
					</h2>
					<p className="text-label text-muted-foreground uppercase tracking-[0.2em] mt-1">
						Monitoreo de fondos Banco de la Nación
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="grid grid-cols-3 gap-3">
						<div className="rounded-lg border border-success-subtle bg-success-muted p-3 text-center">
							<p className="text-2xs font-black text-success uppercase tracking-widest">
								CONCILIADAS
							</p>
							<p className="text-lg font-black text-success">{conciledCount}</p>
							<p className="text-[7px] text-success uppercase">S/ —</p>
						</div>
						<div className="rounded-lg border border-warning-subtle bg-warning-muted p-3 text-center">
							<p className="text-2xs font-black uppercase tracking-widest text-warning">
								PENDIENTES
							</p>
							<p className="text-lg font-black text-warning">{pendingCount}</p>
							<p className="text-[7px] uppercase text-warning">S/ —</p>
						</div>
						<div className="rounded-lg border border-info-subtle bg-info-muted p-3 text-center">
							<p className="text-2xs font-black text-info uppercase tracking-widest">
								VENCIDAS
							</p>
							<p className="text-lg font-black text-info">0</p>
							<p className="text-[7px] text-info uppercase">S/ —</p>
						</div>
					</div>
					<div className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-2 text-background shadow-sm">
						<ShieldAlert size={16} />
						<span className="text-label font-black uppercase tracking-widest">
							6 Inconsistencias Detectadas
						</span>
					</div>
				</div>
			</div>

			<div className="grid gap-4">
				{displayData.map((item) => (
					<Card
						key={item.id}
						className={cn(
							"border-border/40 shadow-sm",
							item.status === "pending" && "border-foreground/30",
						)}
					>
						<CardContent className="p-6 flex items-center justify-between gap-10">
							<div className="flex items-center gap-6 min-w-0">
								<div
									className={cn(
										"flex h-12 w-12 items-center justify-center rounded-xl border transition-[background-color,border-color,color,transform] duration-200",
										item.status === "pending"
											? "border-foreground/20 bg-foreground/10 text-foreground shadow-sm"
											: "border-border bg-muted/20 text-muted-foreground",
									)}
								>
									<Landmark size={24} strokeWidth={1.5} />
								</div>
								<div className="min-w-0">
									<p className="font-black text-sm text-foreground uppercase tracking-tight">
										{item.reference}
									</p>
									<p className="text-label font-bold text-muted-foreground uppercase mt-1 opacity-60">
										{item.cat} • {n(item.total)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-12 shrink-0">
								<div className="text-center hidden sm:block">
									<p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
										Tasa %
									</p>
									<span className="text-xs font-mono font-black text-foreground">
										{item.rate}
									</span>
								</div>
								<div className="text-right w-28">
									<p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
										Monto
									</p>
									<p className="text-sm font-black font-mono text-foreground tabular-nums tracking-tighter">
										{n(item.amount)}
									</p>
								</div>
								<div className="w-32 text-center">
									<span
										className={cn(
											"rounded-lg border px-3 py-1 text-2xs font-black uppercase tracking-widest transition-colors duration-200 shadow-sm",
											item.status === "pending"
												? "bg-warning-muted text-warning border-warning-subtle"
												: "bg-success-muted text-success border-success-subtle",
										)}
									>
										{item.status === "pending" ? "No Depositado" : "Conciliado"}
									</span>
								</div>
								{item.status === "pending" ? (
									<Button
										size="sm"
										className="h-9 bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-sm transition-[background-color,transform,box-shadow] duration-200 hover:bg-foreground/90 hover:-translate-y-0.5 hover:shadow-md"
									>
										Generar NPS
									</Button>
								) : (
									<CheckCircle2 size={20} className="ml-4 text-success" />
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};
