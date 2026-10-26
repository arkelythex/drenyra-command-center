import { Building2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customersApi } from "@/features/customers/api/customers.api";
import { useDesignTokens } from "@/lib/design-tokens";
import { captureError } from "@/lib/monitoring";
import { FIELD_INPUT, FIELD_LABEL } from "./invoice-field";
import { NewCustomerForm } from "./NewCustomerForm";
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
	const [registering, setRegistering] = useState(false);

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
		<div className="relative">
			<Label htmlFor="invoice-customer" className={FIELD_LABEL}>
				Cliente
			</Label>
			<div className="relative">
				<Search
					aria-hidden="true"
					className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					id="invoice-customer"
					placeholder="Buscar por RUC o Razón Social..."
					value={selectedCustomer ? selectedCustomer.legalName : query}
					onChange={(e) => {
						setQuery(e.target.value);
						setRegistering(false);
						if (selectedCustomer) onSelect(null);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					autoComplete="off"
					className={`${FIELD_INPUT} pl-9`}
				/>
				{selectedCustomer && (
					<span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-success">
						RUC {selectedCustomer.taxId}
					</span>
				)}
			</div>

			{isOpen && query && !selectedCustomer && (
				<div
					className="absolute mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
					style={{ zIndex: zIndex.modal }}
				>
					{filtered.length > 0 ? (
						<ul>
							{filtered.map((c) => (
								<li key={c.id}>
									<button
										type="button"
										className="flex min-h-11 w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
										onClick={() => {
											onSelect(c);
											setQuery(c.legalName);
											setIsOpen(false);
										}}
									>
										<Building2
											aria-hidden="true"
											className="size-4 shrink-0 text-muted-foreground"
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-medium">
												{c.legalName}
											</span>
											<span className="block text-xs text-muted-foreground tabular-nums">
												RUC {c.taxId}
											</span>
										</span>
									</button>
								</li>
							))}
						</ul>
					) : registering ? (
						<NewCustomerForm
							companyId={companyId}
							initialQuery={query}
							onCreated={(created) => {
								setCustomers((current) => [created, ...current]);
								onSelect(created);
								setQuery(created.legalName);
								setRegistering(false);
								setIsOpen(false);
							}}
							onCancel={() => setRegistering(false)}
						/>
					) : (
						<div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
							<p className="text-sm text-muted-foreground">
								No encontramos ese cliente.
							</p>
							<button
								type="button"
								onClick={() => setRegistering(true)}
								className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
							>
								<Plus size={14} aria-hidden="true" />
								Registrar cliente
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
