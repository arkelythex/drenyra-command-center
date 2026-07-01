import { Building2, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customersApi } from "@/features/customers/api/customers.api";
import { useDesignTokens } from "@/lib/design-tokens";
import { captureError } from "@/lib/monitoring";
import type { InvoiceCustomerOption } from "./types";

interface CustomerSelectorProps {
	selectedCustomer: InvoiceCustomerOption | null;
	onSelect: (customer: InvoiceCustomerOption | null) => void;
	companyId: string;
}

export const CustomerSelector = ({
	selectedCustomer,
	onSelect,
	companyId,
}: CustomerSelectorProps) => {
	const [query, setQuery] = useState("");
	const { zIndex } = useDesignTokens();
	const [customers, setCustomers] = useState<InvoiceCustomerOption[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) return undefined;

		let ignore = false;

		async function loadCustomers(): Promise<void> {
			try {
				const customerList = await customersApi.list({ companyId });

				if (ignore) return;

				setCustomers(
					customerList.map((customer) => ({
						id: customer.id,
						legalName:
							customer.legalName ?? customer.tradeName ?? customer.name ?? "",
						taxId: customer.taxId,
					})),
				);
			} catch (error) {
				if (ignore) return;

				captureError(
					error instanceof Error
						? error
						: new Error("Customer list unavailable"),
					{
						source: "create-invoice.customer-selector",
						companyId,
					},
				);
				setCustomers([]);
			}
		}

		void loadCustomers();

		return () => {
			ignore = true;
		};
	}, [isOpen, companyId]);

	const filtered = customers.filter(
		(c) =>
			c.legalName.toLowerCase().includes(query.toLowerCase()) ||
			c.taxId.includes(query),
	);

	return (
		<div className="relative group">
			<Label className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 block pl-1">
				Identidad del Adquirente (Cliente) *
			</Label>
			<div className="relative">
				<div className="absolute inset-0 bg-[rgba(var(--premium-info-rgb),0.05)] rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors z-10" />
				<Input
					placeholder="Buscar por RUC o Razón Social..."
					value={selectedCustomer ? selectedCustomer.legalName : query}
					onChange={(e) => {
						setQuery(e.target.value);
						if (selectedCustomer) onSelect(null);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					className="relative h-12 rounded-xl border border-border/60 bg-card/70 pl-11 font-mono text-xs font-bold text-foreground shadow-sm  transition-[background-color,border-color,box-shadow,color] placeholder:text-muted-foreground/70"
				/>
				{selectedCustomer && (
					<div className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-[rgba(var(--premium-info-rgb),0.20)] bg-[rgba(var(--premium-info-rgb),0.10)] px-2 py-1 text-xs font-black uppercase tracking-widest text-[var(--premium-action-cyan)]">
						VERIFICADO
					</div>
				)}
			</div>

			{isOpen && query && !selectedCustomer && (
				<div
					className="absolute mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-border/40 bg-card/95 shadow-xl  animate-in fade-in zoom-in duration-200"
					style={{ zIndex: zIndex.modal }}
				>
					<div className="sticky top-0 bg-muted/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border/20">
						Resultados Coincidentes
					</div>
					{filtered.length > 0 ? (
						filtered.map((c) => (
							<button
								type="button"
								key={c.id}
								className="w-full px-5 py-4 text-left hover:bg-[rgba(var(--premium-info-rgb),0.05)] border-b border-border/20 last:border-0 transition-colors group/item"
								onClick={() => {
									onSelect(c);
									setQuery(c.legalName);
									setIsOpen(false);
								}}
							>
								<div className="flex items-start gap-4">
									<div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-[background-color,color,box-shadow] group-hover/item:bg-[rgba(var(--premium-info-rgb),0.10)] group-hover/item:text-[var(--premium-action-cyan)]">
										<Building2 size={16} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-mono text-xs font-black text-[var(--premium-action-cyan)] uppercase tracking-wider mb-0.5">
											RUC: {c.taxId}
										</div>
										<div className="truncate text-xs font-bold uppercase text-foreground transition-colors group-hover/item:text-[var(--premium-action-cyan)]">
											{c.legalName}
										</div>
									</div>
								</div>
							</button>
						))
					) : (
						<div className="px-5 py-8 text-center flex flex-col items-center gap-2">
							<div className="p-3 rounded-full bg-muted/30">
								<User size={20} className="text-muted-foreground/30" />
							</div>
							<div className="text-label font-black uppercase tracking-widest text-muted-foreground/40">
								No se encontraron registros
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
