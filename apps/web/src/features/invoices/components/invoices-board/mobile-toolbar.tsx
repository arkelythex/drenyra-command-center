import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InvoicesBoardMobileToolbarProps {
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	onCreateInvoice: () => void;
	onCreateInvoiceIntent?: () => void;
}

export function InvoicesBoardMobileToolbar({
	searchQuery,
	onSearchQueryChange,
	onCreateInvoice,
	onCreateInvoiceIntent,
}: InvoicesBoardMobileToolbarProps) {
	return (
		<div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-4 sm:hidden">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-medium tracking-tight text-foreground">
						Facturas y cobranza
					</h1>
					<p className="text-xs text-muted-foreground">
						Emite y sigue tus cobros.
					</p>
				</div>
				<button
					type="button"
					onClick={onCreateInvoice}
					onPointerEnter={onCreateInvoiceIntent}
					onFocus={onCreateInvoiceIntent}
					className="flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
				>
					<Plus size={16} strokeWidth={2} className="mr-1.5" />
					Nueva
				</button>
			</div>
			<div className="flex w-full items-center gap-2">
				<div className="group relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
					<Input
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
						placeholder="Buscar por cliente o número"
						className="h-10 w-full rounded-xl border-border bg-card pl-10 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
					/>
				</div>
			</div>
		</div>
	);
}
