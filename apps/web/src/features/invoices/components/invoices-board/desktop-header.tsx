import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Z_INDEX } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
	BOARD_TABS,
	type InvoicesBoardTabId,
} from "../invoices-board.constants";

interface InvoicesBoardDesktopHeaderProps {
	activeView: InvoicesBoardTabId;
	searchQuery: string;
	draftCount: number;
	openCount: number;
	overdueCount: number;
	openTotal: string;
	onSearchQueryChange: (value: string) => void;
	onCreateInvoice: () => void;
	onCreateInvoiceIntent?: () => void;
	onViewChange: (view: InvoicesBoardTabId) => void;
}

export function InvoicesBoardDesktopHeader({
	activeView,
	searchQuery,
	draftCount,
	openCount,
	overdueCount,
	openTotal,
	onSearchQueryChange,
	onCreateInvoice,
	onCreateInvoiceIntent,
	onViewChange,
}: InvoicesBoardDesktopHeaderProps) {
	return (
		<header
			className="relative hidden shrink-0 flex-col gap-5 border-b border-border bg-background px-6 py-5 sm:flex"
			style={{ zIndex: Z_INDEX.sticky }}
		>
			<div className="flex min-w-0 items-start justify-between gap-6">
				<div className="flex min-w-0 flex-1 items-start gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
						<FileText aria-hidden="true" className="size-5" />
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-3">
							<h1 className="truncate text-lg font-semibold leading-none tracking-tight text-foreground">
								Facturas y cobranza
							</h1>
							<span className="rounded-full border border-border bg-card px-2 py-1 text-2xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
								CxC
							</span>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Emite comprobantes, da seguimiento y detecta vencimientos sin
							salir del tablero.
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
								Borradores {draftCount}
							</span>
							<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
								Por cobrar {openCount}
							</span>
							<span
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-medium",
									overdueCount > 0
										? "bg-destructive/10 text-destructive"
										: "bg-muted text-muted-foreground",
								)}
							>
								Vencidas {overdueCount}
							</span>
							<span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-border">
								Saldo abierto {openTotal}
							</span>
						</div>
					</div>
				</div>

				<div className="flex w-[420px] max-w-[42vw] items-center gap-3">
					<div className="group relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
						<input
							aria-label="Buscar factura"
							value={searchQuery}
							onChange={(event) => onSearchQueryChange(event.target.value)}
							placeholder="Buscar por cliente o número"
							className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow,background-color,color] duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
						/>
					</div>

					<Button
						onClick={onCreateInvoice}
						onPointerEnter={onCreateInvoiceIntent}
						onFocus={onCreateInvoiceIntent}
						className="h-10 flex-shrink-0 rounded-lg border-transparent bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
					>
						<Plus size={14} strokeWidth={2.5} className="mr-2" />
						Nueva factura
					</Button>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<SegmentedControl
					label="Vistas"
					options={BOARD_TABS}
					value={activeView}
					onChange={onViewChange}
				/>

				<p className="text-xs text-muted-foreground">
					Arrastra entre columnas para actualizar el estado de cobro.
				</p>
			</div>
		</header>
	);
}
