import { Menu, Plus, Search } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillsView } from "../../hooks/use-bills.types";

interface BillsBoardHeaderProps {
	activeView: BillsView;
	setActiveView: (view: BillsView) => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	setIsMobileOpen: (open: boolean) => void;
	tabs: ReadonlyArray<{ id: BillsView; label: string }>;
	reviewCount: number;
	approvalCount: number;
	overdueCount: number;
	openTotal: string;
}

export const BillsBoardHeader: React.FC<BillsBoardHeaderProps> = ({
	activeView,
	setActiveView,
	searchQuery,
	setSearchQuery,
	setIsMobileOpen,
	tabs,
	reviewCount,
	approvalCount,
	overdueCount,
	openTotal,
}) => {
	return (
		<header className="relative hidden shrink-0 border-b border-border/60 bg-background px-6 py-5 md:flex md:flex-col md:gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div className="flex w-full items-start gap-4 lg:max-w-4xl">
				<Button
					onClick={() => setIsMobileOpen(true)}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
				>
					<Menu className="h-4 w-4 text-muted-foreground" />
				</Button>
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.75"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-foreground/80"
					>
						<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
						<path d="M12 11h4" />
						<path d="M12 16h4" />
						<path d="M8 11h.01" />
						<path d="M8 16h.01" />
						<path d="M16 4h-8a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
					</svg>
				</div>
				<div className="min-w-0 flex-1 space-y-4">
					<div className="space-y-1.5">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
							CxP
						</p>
						<div className="flex flex-wrap items-end gap-x-4 gap-y-2">
							<h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
								Facturas de compra
							</h1>
							<p className="text-sm text-muted-foreground">
								Aprueba, programa y ejecuta pagos sin perder vencimientos.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<MetricPill label="Por revisar" value={String(reviewCount)} />
						<MetricPill label="Por aprobar" value={String(approvalCount)} />
						<MetricPill
							label="Vencidas"
							value={String(overdueCount)}
							tone="danger"
						/>
						<MetricPill label="Saldo abierto" value={openTotal} />
					</div>

					<div className="flex items-center gap-3">
						<div className="flex rounded-xl border border-border/60 bg-card p-1">
							{tabs.map(({ id, label }) => (
								<Button
									key={id}
									variant="ghost"
									size="sm"
									onClick={() => setActiveView(id)}
									className={cn(
										"relative h-8 rounded-lg px-3 text-xs font-semibold uppercase tracking-[0.2em] transition-[background-color,color] hover:bg-muted",
										activeView === id
											? "bg-[var(--accent)] text-[var(--text-on-accent)]"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{label}
								</Button>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							Organiza proveedores por etapa y ejecuta pagos desde la misma
							cola.
						</p>
					</div>
				</div>
			</div>

			<div className="flex w-full items-center gap-3 lg:w-auto">
				<div className="relative flex-1 lg:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						placeholder="Buscar por proveedor o comprobante"
						aria-label="Buscar factura de compra"
						className="h-10 w-full rounded-xl border border-border/60 bg-card px-4 pl-10 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
					/>
				</div>
				<Button className="h-10 shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent)] px-4 text-xs font-semibold tracking-[0.18em] text-[var(--text-on-accent)] transition-colors hover:opacity-95">
					<Plus size={16} strokeWidth={2.25} className="mr-2" /> Nueva cuenta
				</Button>
			</div>
		</header>
	);
};

interface MetricPillProps {
	label: string;
	value: string;
	tone?: "neutral" | "danger";
}

const MetricPill = ({ label, value, tone = "neutral" }: MetricPillProps) => (
	<div
		className={cn(
			"inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
			tone === "danger"
				? "border-[var(--border-danger)] bg-[var(--surface-danger)]/10 text-[var(--text-danger)]"
				: "border-border/60 bg-card text-foreground",
		)}
	>
		<span className="font-semibold text-muted-foreground">{label}</span>
		<span className="font-semibold tabular-nums">{value}</span>
	</div>
);
