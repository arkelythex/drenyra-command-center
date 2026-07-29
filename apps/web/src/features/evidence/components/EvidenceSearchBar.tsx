import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EvidenceFilters, EvidenceSource, EvidenceStatus, EvidenceType } from "../hooks/useEvidence";

const TYPE_OPTIONS = {
	INVOICE: "Factura",
	RECEIPT: "Recibo",
	CONTRACT: "Contrato",
	BANK_STATEMENT: "Estado de cuenta",
	EMAIL: "Correo",
	XML: "XML",
	CDR: "CDR",
	PDF: "PDF",
	OTHER: "Otro",
} as const;

const SOURCE_OPTIONS = {
	UPLOAD: "Carga manual",
	EMAIL: "Correo",
	API: "API",
	SYNC: "Sincronización",
	SUNAT: "SUNAT",
} as const;

const STATUS_OPTIONS = {
	UPLOADED: "Subido",
	EXTRACTING: "Extrayendo",
	CLASSIFIED: "Clasificado",
	VALIDATED: "Validado",
	REJECTED: "Rechazado",
	ERROR: "Error",
} as const;

interface EvidenceSearchBarProps {
	filters: EvidenceFilters;
	onFiltersChange: (filters: EvidenceFilters) => void;
	companies: Array<{ companyId: string; companyName: string }>;
}

function FilterSelect<T extends string>({
	ariaLabel,
	placeholder,
	value,
	options,
	onValueChange,
}: {
	ariaLabel: string;
	placeholder: string;
	value?: T;
	options: Record<T, string>;
	onValueChange: (value: T | undefined) => void;
}) {
	return (
		<Select value={value ?? "all"} onValueChange={(next) => onValueChange(next === "all" ? undefined : (next as T))}>
			<SelectTrigger aria-label={ariaLabel} className="w-full sm:w-[160px]">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">{placeholder}</SelectItem>
				{Object.entries(options).map(([key, label]) => (
					<SelectItem key={key} value={key}>{label}</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export function EvidenceSearchBar({ filters, onFiltersChange, companies }: EvidenceSearchBarProps) {
	const update = (next: Partial<EvidenceFilters>) => onFiltersChange({ ...filters, ...next, offset: 0 });

	return (
		<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			<Input aria-label="Buscar evidencia" placeholder="Buscar por nombre..." value={filters.q ?? ""} onChange={(event) => update({ q: event.target.value })} />
			<FilterSelect<EvidenceType> ariaLabel="Filtrar por tipo" placeholder="Todos los tipos" value={filters.type} options={TYPE_OPTIONS} onValueChange={(type) => update({ type })} />
			<FilterSelect<EvidenceSource> ariaLabel="Filtrar por origen" placeholder="Todos los orígenes" value={filters.source} options={SOURCE_OPTIONS} onValueChange={(source) => update({ source })} />
			<FilterSelect<EvidenceStatus> ariaLabel="Filtrar por estado" placeholder="Todos los estados" value={filters.status} options={STATUS_OPTIONS} onValueChange={(status) => update({ status })} />
			<Input aria-label="Filtrar por período" placeholder="Período (YYYY-MM)" value={filters.period ?? ""} onChange={(event) => update({ period: event.target.value })} />
			<Select value={filters.companyId ?? "all"} onValueChange={(companyId) => update({ companyId: companyId === "all" ? undefined : companyId })}>
				<SelectTrigger aria-label="Filtrar por empresa"><SelectValue placeholder="Todas las empresas" /></SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas las empresas</SelectItem>
					{companies.map((company) => <SelectItem key={company.companyId} value={company.companyId}>{company.companyName}</SelectItem>)}
				</SelectContent>
			</Select>
		</div>
	);
}
