import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceFilters } from "../../types/invoice-filters";

interface InvoiceActiveFiltersProps {
	filters: InvoiceFilters;
	customers?: { id: string; legalName: string }[];
	onRemove: (key: keyof InvoiceFilters) => void;
}

export const InvoiceActiveFilters = ({
	filters,
	customers,
	onRemove,
}: InvoiceActiveFiltersProps) => {
	return (
		<div className="flex flex-wrap gap-2">
			{filters.customerId && (
				<div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
					<span>
						Cliente:{" "}
						{customers?.find((c) => c.id === filters.customerId)?.legalName}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-4 w-4 p-0"
						onClick={() => onRemove("customerId")}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
			{filters.startDate && (
				<div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
					<span>
						Desde: {format(filters.startDate, "dd/MM/yyyy", { locale: es })}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-4 w-4 p-0"
						onClick={() => onRemove("startDate")}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
			{filters.endDate && (
				<div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
					<span>
						Hasta: {format(filters.endDate, "dd/MM/yyyy", { locale: es })}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-4 w-4 p-0"
						onClick={() => onRemove("endDate")}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
			{filters.status && filters.status.length > 0 && (
				<div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
					<span>Estados: {filters.status.length}</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-4 w-4 p-0"
						onClick={() => onRemove("status")}
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
		</div>
	);
};
