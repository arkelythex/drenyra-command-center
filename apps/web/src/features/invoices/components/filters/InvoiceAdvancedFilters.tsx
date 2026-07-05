import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InvoiceFilters } from "../../types/invoice-filters";

interface InvoiceAdvancedFiltersProps {
	filters: InvoiceFilters;
	setFilters: (filters: InvoiceFilters) => void;
	customers?: { id: string; legalName: string }[];
	onApply: () => void;
	onCancel: () => void;
	onClear: () => void;
	hasActiveFilters: boolean;
}

export const InvoiceAdvancedFilters = ({
	filters,
	setFilters,
	customers,
	onApply,
	onCancel,
	onClear,
	hasActiveFilters,
}: InvoiceAdvancedFiltersProps) => {
	const statusOptions = [
		{ value: "DRAFT", label: "Borrador" },
		{ value: "SENT", label: "Enviada" },
		{ value: "PAID", label: "Pagada" },
		{ value: "OVERDUE", label: "Vencida" },
		{ value: "CANCELLED", label: "Cancelada" },
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold">Filtros Avanzados</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClear}
					disabled={!hasActiveFilters}
				>
					Limpiar todo
				</Button>
			</div>

			{/* Customer Filter */}
			<div className="space-y-2">
				<Label>Cliente</Label>
				<Select
					value={filters.customerId || ""}
					onValueChange={(value) =>
						setFilters({ ...filters, customerId: value || undefined })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Todos los clientes" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">Todos los clientes</SelectItem>
						{customers?.map((customer) => (
							<SelectItem key={customer.id} value={customer.id}>
								{customer.legalName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Date Range */}
			<div className="space-y-2">
				<Label>Rango de Fechas</Label>
				<div className="grid grid-cols-2 gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"justify-start text-left font-normal",
									!filters.startDate && "text-muted-foreground",
								)}
							>
								<Calendar className="mr-2 h-4 w-4" />
								{filters.startDate
									? format(filters.startDate, "dd/MM/yyyy", { locale: es })
									: "Desde"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<CalendarComponent
								mode="single"
								selected={filters.startDate}
								onSelect={(date) => setFilters({ ...filters, startDate: date })}
								locale={es}
							/>
						</PopoverContent>
					</Popover>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"justify-start text-left font-normal",
									!filters.endDate && "text-muted-foreground",
								)}
							>
								<Calendar className="mr-2 h-4 w-4" />
								{filters.endDate
									? format(filters.endDate, "dd/MM/yyyy", { locale: es })
									: "Hasta"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<CalendarComponent
								mode="single"
								selected={filters.endDate}
								onSelect={(date) => setFilters({ ...filters, endDate: date })}
								locale={es}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			{/* Amount Range */}
			<div className="space-y-2">
				<Label>Rango de Monto</Label>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Input
							type="number"
							placeholder="Mínimo"
							value={filters.minAmount || ""}
							onChange={(e) =>
								setFilters({
									...filters,
									minAmount: e.target.value
										? parseFloat(e.target.value)
										: undefined,
								})
							}
						/>
					</div>
					<div>
						<Input
							type="number"
							placeholder="Máximo"
							value={filters.maxAmount || ""}
							onChange={(e) =>
								setFilters({
									...filters,
									maxAmount: e.target.value
										? parseFloat(e.target.value)
										: undefined,
								})
							}
						/>
					</div>
				</div>
			</div>

			{/* Currency Filter */}
			<div className="space-y-2">
				<Label>Moneda</Label>
				<Select
					value={filters.currency || ""}
					onValueChange={(value) =>
						setFilters({ ...filters, currency: value || undefined })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Todas las monedas" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">Todas las monedas</SelectItem>
						<SelectItem value="PEN">PEN (Soles)</SelectItem>
						<SelectItem value="USD">USD (Dólares)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Status Checkboxes */}
			<div className="space-y-2">
				<Label>Estado</Label>
				<div className="space-y-2">
					{statusOptions.map((status) => (
						<div key={status.value} className="flex items-center space-x-2">
							<Checkbox
								id={`status-${status.value}`}
								checked={filters.status?.includes(status.value)}
								onCheckedChange={(checked) => {
									const currentStatus = filters.status || [];
									const newStatus = checked
										? [...currentStatus, status.value]
										: currentStatus.filter((s) => s !== status.value);
									setFilters({
										...filters,
										status: newStatus.length > 0 ? newStatus : undefined,
									});
								}}
							/>
							<label
								htmlFor={`status-${status.value}`}
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{status.label}
							</label>
						</div>
					))}
				</div>
			</div>

			{/* Apply Button */}
			<div className="flex gap-2 pt-4">
				<Button onClick={onApply} className="flex-1">
					Aplicar Filtros
				</Button>
				<Button variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</div>
	);
};
